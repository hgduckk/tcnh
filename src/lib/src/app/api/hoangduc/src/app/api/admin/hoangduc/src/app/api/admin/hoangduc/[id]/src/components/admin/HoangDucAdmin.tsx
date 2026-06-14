"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from "lucide-react";
import { HoangDucRow } from "@/lib/hoangduc";

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

export function HoangDucAdmin({ adminPassword }: { adminPassword: string }) {
  const [rows, setRows] = useState<HoangDucRow[]>([]);
  const [editor, setEditor] = useState<EditorState>(initialEditor);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authHeaders = useMemo(() => ({ "x-admin-password": adminPassword }), [adminPassword]);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/hoangduc", { headers: authHeaders });
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
      const res = await fetch("/api/admin/hoangduc", {
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
      const res = await fetch(`/api/admin/hoangduc/${id}`, {
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