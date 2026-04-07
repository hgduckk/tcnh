# Hướng dẫn tạo mục mới trong trang Tuổi Trẻ (Ví dụ: "new-page")

Thay tất cả `new-page` / `NewPage` / `newPage` / `new_page` bằng tên thật của bạn.

---

## BƯỚC 1: Tạo bảng Database (Supabase)

**File:** `supabase-schema.sql`

Thêm vào sau phần kết thúc bảng `youth_items':

```sql
-- ── New Page Items ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS new_page_items (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name         TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  -- Thêm các cột dữ liệu riêng của mục này ở đây
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  updated_at   TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_new_page_items_created_at
  ON new_page_items(created_at DESC);

ALTER TABLE new_page_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read new_page_items" ON new_page_items
  FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION set_new_page_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_new_page_items_updated_at ON new_page_items;
CREATE TRIGGER trg_new_page_items_updated_at
BEFORE UPDATE ON new_page_items
FOR EACH ROW EXECUTE FUNCTION set_new_page_items_updated_at();
```

Sau đó chạy SQL này trên **Supabase Dashboard → SQL Editor** → Execute.

---

## BƯỚC 2: Tạo Thư viện Dữ liệu

**Tạo file:** `src/lib/newpage.ts`

```typescript
export const NEW_PAGE_SELECT_COLUMNS = "id, name, description, created_at, updated_at";

export type NewPageRow = {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export type NewPageInput = {
  id?: string;
  name: string;
  description?: string;
};

export function mapNewPageRow(input: any): NewPageRow {
  return {
    id: String(input?.id ?? "").trim(),
    name: String(input?.name ?? "").trim(),
    description: String(input?.description ?? "").trim(),
    created_at: String(input?.created_at ?? ""),
    updated_at: String(input?.updated_at ?? ""),
  };
}

export function normalizeNewPageInput(input: any): NewPageInput {
  return {
    id: String(input?.id ?? "").trim() || undefined,
    name: String(input?.name ?? "").trim(),
    description: String(input?.description ?? "").trim(),
  };
}

export function newPageInputToDb(input: NewPageInput) {
  return {
    name: input.name,
    description: String(input.description ?? "").trim(),
  };
}
```

---

## BƯỚC 3: Tạo API Public

**Tạo file:** `src/app/api/newpage/route.ts`

```typescript
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import { mapNewPageRow, NEW_PAGE_SELECT_COLUMNS } from "@/lib/newpage";
import { serializeError } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const db = supabaseAdmin ?? supabase;

    if (!db) {
      return NextResponse.json(
        { success: false, message: "Supabase not configured." },
        { status: 500 }
      );
    }

    const { data, error } = await db
      .from("new_page_items")
      .select(NEW_PAGE_SELECT_COLUMNS)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(
      { success: true, data: (data || []).map(mapNewPageRow) },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (e) {
    return NextResponse.json(
      { success: false, message: serializeError(e) },
      { status: 500 }
    );
  }
}
```

---

## BƯỚC 4: Tạo API Admin

**Tạo file:** `src/app/api/admin/newpage/route.ts`

```typescript
import { NextResponse } from "next/server";
import { assertAdminRequest } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import { mapNewPageRow, normalizeNewPageInput, newPageInputToDb, NEW_PAGE_SELECT_COLUMNS } from "@/lib/newpage";
import { serializeError } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const authError = assertAdminRequest(req);
    if (authError) return authError;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, message: "Supabase admin client not configured." },
        { status: 500 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("new_page_items")
      .select(NEW_PAGE_SELECT_COLUMNS)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: (data || []).map(mapNewPageRow) });
  } catch (e) {
    return NextResponse.json(
      { success: false, message: serializeError(e) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const authError = assertAdminRequest(req);
    if (authError) return authError;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, message: "Supabase admin client not configured." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const normalized = normalizeNewPageInput(body);

    if (!normalized.name) {
      return NextResponse.json(
        { success: false, message: "Missing name." },
        { status: 400 }
      );
    }

    const payload = {
      ...newPageInputToDb(normalized),
      ...(normalized.id ? { id: normalized.id } : {}),
    };

    let result;
    if (normalized.id) {
      result = await supabaseAdmin.from("new_page_items").update(payload).eq("id", normalized.id).select();
    } else {
      result = await supabaseAdmin.from("new_page_items").insert([payload]).select();
    }

    if (result.error) throw result.error;

    return NextResponse.json({
      success: true,
      data: result.data?.[0] ? mapNewPageRow(result.data[0]) : null,
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, message: serializeError(e) },
      { status: 500 }
    );
  }
}
```

---

## BƯỚC 5: Tạo API Admin Delete

**Tạo file:** `src/app/api/admin/newpage/[id]/route.ts`

```typescript
import { NextResponse } from "next/server";
import { assertAdminRequest } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import { serializeError } from "@/lib/utils";

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authError = assertAdminRequest(req);
    if (authError) return authError;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, message: "Supabase admin client not configured." },
        { status: 500 }
      );
    }

    const { id: rawId } = await context.params;
    const id = String(rawId || "").trim();

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Missing id." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.from("new_page_items").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { success: false, message: serializeError(e) },
      { status: 500 }
    );
  }
}
```

---

## BƯỚC 6: Tạo Component Admin

**Tạo file:** `src/components/admin/NewPageAdmin.tsx`

```typescript
"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { NewPageRow } from "@/lib/newpage";

type EditorState = {
  id: string | null;
  name: string;
  description: string;
};

const initialEditor: EditorState = {
  id: null,
  name: "",
  description: "",
};

export function NewPageAdmin({ adminPassword }: { adminPassword: string }) {
  const [rows, setRows] = useState<NewPageRow[]>([]);
  const [editor, setEditor] = useState<EditorState>(initialEditor);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authHeaders = useMemo(() => ({ "x-admin-password": adminPassword }), [adminPassword]);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/newpage", { headers: authHeaders });
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setRows(Array.isArray(json?.data) ? json.data : []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [authHeaders]);

  const handleSave = async () => {
    if (!editor.name.trim()) {
      setError("Tên không được để trống");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/newpage", {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(editor),
      });
      if (!res.ok) throw new Error("Failed to save");
      setEditor(initialEditor);
      refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa mục này?")) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/newpage/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (!res.ok) throw new Error("Failed to delete");
      refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {editor.id ? "Sửa mục" : "Thêm mục mới"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Tên</label>
            <Input
              value={editor.name}
              onChange={(e) => setEditor({ ...editor, name: e.target.value })}
              placeholder="Nhập tên..."
            />
          </div>

          <div>
            <label className="text-sm font-medium">Mô tả</label>
            <Textarea
              value={editor.description}
              onChange={(e) => setEditor({ ...editor, description: e.target.value })}
              placeholder="Nhập mô tả..."
              rows={4}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {editor.id ? "Cập nhật" : "Thêm mới"}
            </Button>
            {editor.id && (
              <Button
                variant="outline"
                onClick={() => setEditor(initialEditor)}
                disabled={saving}
              >
                Hủy
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách ({rows.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-slate-500">Đang tải...</p>
          ) : rows.length === 0 ? (
            <p className="text-center text-slate-500">Chưa có mục nào</p>
          ) : (
            <div className="space-y-2">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-slate-50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{row.name}</p>
                    <p className="text-sm text-slate-500 truncate">{row.description}</p>
                  </div>
                  <div className="flex gap-2 ml-3 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditor({ id: row.id, name: row.name, description: row.description })}
                    >
                      Sửa
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(row.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## BƯỚC 7: Tạo Trang Public

**Tạo file:** `src/app/youth/new-page/page.tsx`

```typescript
"use client";

import { useEffect, useState } from "react";
import { PageBanner } from "@/components/shared/PageBanner";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import type { NewPageRow } from "@/lib/newpage";

export default function NewPagePublic() {
  const [items, setItems] = useState<NewPageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/newpage", { cache: "no-store" });
        if (!res.ok) throw new Error("Không thể tải dữ liệu");
        const json = await res.json();
        setItems(Array.isArray(json?.data) ? json.data : []);
      } catch (e) {
        setError(String(e));
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <PageBanner
        title="TÊN TRANG"
        subtitle="Mô tả ngắn về trang này"
        imageUrl="/images/back-ocean.jpg"
        imageHint="page"
      />

      <main className="container mx-auto px-4 md:px-8 py-12 md:py-16">
        {loading && <p className="text-center text-slate-600">Đang tải...</p>}
        {error && <p className="text-center text-red-600">Lỗi: {error}</p>}

        {!loading && !error && items.length === 0 && (
          <p className="text-center text-slate-600">Chưa có dữ liệu</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-3">
                <h3 className="font-bold text-lg text-slate-900">{item.name}</h3>
                <p className="text-slate-600 text-sm">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
```

---

## BƯỚC 8: Cập nhật Admin Panel

**Sửa file:** `src/app/admin/page.tsx`

### *8.1. Import component mới*

Thêm vào phần imports:

```typescript
import { NewPageAdmin } from '@/components/admin/NewPageAdmin';
```

### *8.2 Cập nhật type AdminTab*

Tìm `type AdminTab`, thêm vào:

```typescript
| 'category-youth-newpage'
```

### *8.3. Cập nhật state sidebar*

Tìm nơi khai báo `youthSubOpen`, giữ nguyên.

*### 8.4. Cập nhật sidebar dropdown*

Tìm khối `{youthSubOpen && (`, thêm vào trong khối:

```typescript
<SidebarBtn
  icon={Settings} // hoặc icon khác phù hợp
  label="New Page"
  active={activeTab === 'category-youth-newpage'}
  onClick={() => {
    setActiveTab('category-youth-newpage');
    setSidebarOpen(false);
  }}
/>
```

### *8.5. Cập nhật render content*

Tìm khối `{activeTab === 'category-youth-student-info' && ...}`, thêm sau:

```typescript
{activeTab === 'category-youth-newpage' && <CategoryNewPagePanel adminPassword={password} />}
```

### *8.6. Định nghĩa Panel function*
Thêm vào cuối file, trước `CategoryPartnersPanel`:

```typescript
// ─────────────────────────────────────────────────────────────────────────────
// Panel: Category — New Page
// ─────────────────────────────────────────────────────────────────────────────

function CategoryNewPagePanel({ adminPassword }: { adminPassword: string }) {
  return (
    <div>
      <div className="mb-6">
        <Breadcrumb label="Tuổi trẻ / New Page" />
        <h1 className="text-2xl font-bold text-slate-800">Quản lý New Page</h1>
        <p className="text-sm text-slate-500 mt-1">Quản lý những mục trong New Page</p>
      </div>

      <NewPageAdmin adminPassword={adminPassword} />
    </div>
  );
}
```

---

## BƯỚC 9: Cập nhật Youth Links

**Sửa file:** `src/lib/youth.ts`

Tìm `YOUTH_TARGET_LINK_OPTIONS`, thêm:

```typescript
{ value: "/youth/new-page", label: "New Page" },
```

---

## Hoàn thành!

Giờ bạn đã hoàn thành:
1. Database table
2. Thư viện dữ liệu
3. API public + admin
4. Component admin quản lý
5. Trang public hiển thị
6. Tích hợp vào admin panel
7. Cập nhật youth links

Thử truy cập:
- Admin: `/admin` → Tuổi trẻ → New Page
- Public: `/youth/new-page`



# File structure

```
src/
├── app/
│   ├── api/
│   │   ├── newpage/
│   │   │   └── route.ts ........................ (PUBLIC API GET)
│   │   └── admin/
│   │       └── newpage/
│   │           ├── route.ts .................. (ADMIN API GET/POST)
│   │           └── [id]/
│   │               └── route.ts ............. (ADMIN API DELETE)
│   ├── youth/
│   │   └── new-page/
│   │       └── page.tsx ....................... (PUBLIC PAGE)
│   └── admin/
│       └── page.tsx ........................... 
├── lib/
│   ├── newpage.ts ............................ (TẠO MỚI)
│   └── youth.ts ............................. 
└── components/
    └── admin/
        └── NewPageAdmin.tsx .................. (TẠO MỚI)

supabase-schema.sql ...........................
```