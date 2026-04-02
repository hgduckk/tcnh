"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, GripVertical } from "lucide-react";
import Image from "next/image";
import type { PartnerRow } from "@/lib/partners";

type EditorState = {
  id: string | null;
  name: string;
  logoUrl: string;
  logoFile: File | null;
  isPublished: boolean;
};

const initialEditor: EditorState = {
  id: null,
  name: "",
  logoUrl: "",
  logoFile: null,
  isPublished: true,
};

export function PartnersAdmin({ adminPassword }: { adminPassword: string }) {
  const [rows, setRows] = useState<PartnerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState>(initialEditor);
  const [dragOrder, setDragOrder] = useState<PartnerRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  const authHeaders = useMemo(() => {
    return { "x-admin-password": adminPassword };
  }, [adminPassword]);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/partners", { headers: authHeaders });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setRows(json.data || []);
      setDragOrder(json.data || []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetEditor = () => setEditor(initialEditor);

  const editRow = (row: PartnerRow) => {
    setEditor({
      id: row.id,
      name: row.name || "",
      logoUrl: row.logo_url || "",
      logoFile: null,
      isPublished: Boolean(row.is_published),
    });
  };

  const save = async () => {
    setError(null);
    if (!editor.name.trim()) return setError("Vui lòng nhập tên đơn vị.");

    setSaving(true);
    try {
      let partnerId = editor.id;
      let finalLogoUrl = editor.logoUrl;

      // Upload logo if a new file is selected
      if (editor.logoFile) {
        const formData = new FormData();
        formData.append("file", editor.logoFile);
        if (partnerId) {
          formData.append("partnerId", partnerId);
        }

        const uploadRes = await fetch("/api/admin/partners/upload-logo", {
          method: "POST",
          headers: { ...authHeaders },
          body: formData,
        });

        if (!uploadRes.ok) throw new Error(await uploadRes.text());
        const uploadJson = await uploadRes.json();
        finalLogoUrl = uploadJson.data.logoUrl;
        partnerId = uploadJson.data.partnerId;
      }

      if (!finalLogoUrl) {
        return setError("Vui lòng cung cấp logo cho đơn vị.");
      }

      const payload = {
        id: partnerId ?? undefined,
        name: editor.name,
        logoUrl: finalLogoUrl,
        isPublished: editor.isPublished,
      };

      const res = await fetch("/api/admin/partners", {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());
      await res.json();
      await refresh();
      resetEditor();
      alert("Lưu đơn vị hợp tác thành công.");
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    const ok = confirm("Bạn có chắc muốn xóa đơn vị này?");
    if (!ok) return;

    setError(null);
    try {
      const res = await fetch(`/api/admin/partners/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });

      if (!res.ok) throw new Error(await res.text());
      await refresh();
    } catch (e) {
      setError(String(e));
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setIsDragging(false);
      return;
    }

    const draggedIndex = dragOrder.findIndex((r) => r.id === draggedId);
    const targetIndex = dragOrder.findIndex((r) => r.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newOrder = [...dragOrder];
    const [draggedItem] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedItem);

    setDragOrder(newOrder);
    setDraggedId(null);
    setIsDragging(false);
  };

  const saveOrder = async () => {
    setSavingOrder(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/partners", {
        method: "PATCH",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(dragOrder),
      });

      if (!res.ok) throw new Error(await res.text());
      await refresh();
      alert("Cập nhật thứ tự thành công.");
    } catch (e) {
      setError(String(e));
    } finally {
      setSavingOrder(false);
    }
  };

  const logoPreviewUrl = useMemo(() => {
    if (editor.logoFile) {
      return URL.createObjectURL(editor.logoFile);
    }
    return editor.logoUrl;
  }, [editor.logoFile, editor.logoUrl]);

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{editor.id ? "Sửa đơn vị" : "Thêm đơn vị mới"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <label className="text-sm font-semibold">Tên đơn vị</label>
            <Input
              value={editor.name}
              onChange={(e) => setEditor((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Nhập tên đơn vị"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-semibold">Logo</label>
            {logoPreviewUrl && (
              <div className="relative w-full max-w-xs h-20 rounded-lg overflow-hidden border bg-muted flex items-center justify-center">
                <Image
                  src={logoPreviewUrl}
                  alt="Preview"
                  fill
                  className="object-contain p-2"
                />
              </div>
            )}
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setEditor((prev) => ({ ...prev, logoFile: file }));
                }
              }}
              disabled={saving}
            />
            {editor.logoFile && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditor((prev) => ({ ...prev, logoFile: null }))}
              >
                Xóa logo được chọn
              </Button>
            )}
          </div>

          <div className="grid gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editor.isPublished}
                onChange={(e) => setEditor((prev) => ({ ...prev, isPublished: e.target.checked }))}
              />
              Công khai
            </label>
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={resetEditor} disabled={saving}>
              Reset
            </Button>
            <Button type="button" onClick={save} disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu đơn vị"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Danh sách đơn vị hợp tác</CardTitle>
          <div className="flex gap-2">
            {isDragging && (
              <Button
                type="button"
                variant="default"
                onClick={saveOrder}
                disabled={savingOrder}
              >
                {savingOrder ? "Đang lưu..." : "Lưu thứ tự"}
              </Button>
            )}
            <Button type="button" variant="outline" onClick={refresh} disabled={loading}>
              {loading ? "Đang tải..." : "Tải lại"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có đơn vị nào. Nhấn "Tải lại" để đồng bộ.</p>
          ) : (
            <div className="space-y-3">
              {dragOrder.map((row) => (
                <div
                  key={row.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, row.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, row.id)}
                  className={`border rounded-lg p-3 cursor-move transition ${
                    draggedId === row.id ? "opacity-50 bg-muted" : isDragging ? "bg-muted/30" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3 flex-1">
                      <GripVertical className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="space-y-1 flex-1">
                        <p className="font-semibold">{row.name}</p>
                        {row.logo_url && (
                          <div className="relative w-16 h-16 rounded overflow-hidden border bg-muted flex items-center justify-center">
                            <Image
                              src={row.logo_url}
                              alt={row.name}
                              fill
                              className="object-contain p-1"
                            />
                          </div>
                        )}
                        <div className="flex gap-2 flex-wrap">
                          {row.is_published ? <Badge>Public</Badge> : <Badge variant="destructive">Ẩn</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button type="button" size="sm" variant="secondary" onClick={() => editRow(row)}>
                        Sửa
                      </Button>
                      <Button type="button" size="sm" variant="destructive" onClick={() => remove(row.id)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Xóa
                      </Button>
                    </div>
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
