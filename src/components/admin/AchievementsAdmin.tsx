"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, GripVertical } from "lucide-react";
import Image from "next/image";
import type { AchievementRow } from "@/lib/achievements";

type EditorState = {
  id: string | null;
  title: string;
  imageUrl: string;
  isPublished: boolean;
  imageFile: File | null;
};

const initialEditor: EditorState = {
  id: null,
  title: "",
  imageUrl: "",
  isPublished: true,
  imageFile: null,
};

export function AchievementsAdmin({ adminPassword }: { adminPassword: string }) {
  const [rows, setRows] = useState<AchievementRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState>(initialEditor);
  const [dragOrder, setDragOrder] = useState<AchievementRow[]>([]);
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
      const res = await fetch("/api/admin/achievements", { headers: authHeaders });
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

  const editRow = (row: AchievementRow) => {
    setEditor({
      id: row.id,
      title: row.title || "",
      imageUrl: row.image_url || "",
      isPublished: Boolean(row.is_published),
      imageFile: null,
    });
  };

  const save = async () => {
    setError(null);
    if (!editor.title.trim()) return setError("Vui lòng nhập tiêu đề thành tích.");

    setSaving(true);
    try {
      let finalImageUrl = editor.imageUrl;

      // Upload image if a new file is selected
      if (editor.imageFile) {
        const formData = new FormData();
        formData.append("file", editor.imageFile);
        if (editor.id) {
          formData.append("achievementId", editor.id);
        }

        const uploadRes = await fetch("/api/admin/achievements/upload-image", {
          method: "POST",
          headers: { ...authHeaders },
          body: formData,
        });

        if (!uploadRes.ok) throw new Error(await uploadRes.text());
        const uploadJson = await uploadRes.json();
        finalImageUrl = uploadJson.data.imageUrl;
        if (!editor.id) {
          editor.id = uploadJson.data.achievementId;
        }
      }

      const payload = {
        id: editor.id ?? undefined,
        title: editor.title,
        imageUrl: finalImageUrl,
        isPublished: editor.isPublished,
      };

      const res = await fetch("/api/admin/achievements", {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());
      await res.json();
      await refresh();
      resetEditor();
      alert("Lưu thành tích thành công.");
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    const ok = confirm("Bạn có chắc muốn xóa thành tích này?");
    if (!ok) return;

    setError(null);
    try {
      const res = await fetch(`/api/admin/achievements/${id}`, {
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
      const res = await fetch("/api/admin/achievements", {
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

  const imagePreviewUrl = useMemo(() => {
    if (editor.imageFile) {
      return URL.createObjectURL(editor.imageFile);
    }
    return editor.imageUrl;
  }, [editor.imageFile, editor.imageUrl]);

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
          <CardTitle>{editor.id ? "Sửa thành tích" : "Thêm thành tích mới"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <label className="text-sm font-semibold">Tiêu đề</label>
            <Input
              value={editor.title}
              onChange={(e) => setEditor((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Nhập tiêu đề thành tích"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-semibold">Hình ảnh</label>
            {imagePreviewUrl && (
              <div className="relative w-full max-w-xs h-40 rounded-lg overflow-hidden border">
                <Image
                  src={imagePreviewUrl}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setEditor((prev) => ({ ...prev, imageFile: file }));
                }
              }}
              disabled={saving}
            />
            {editor.imageFile && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditor((prev) => ({ ...prev, imageFile: null }))}
              >
                Xóa hình ảnh được chọn
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
              {saving ? "Đang lưu..." : "Lưu thành tích"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Danh sách thành tích</CardTitle>
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
            <p className="text-sm text-muted-foreground">Chưa có thành tích nào. Nhấn "Tải lại" để đồng bộ.</p>
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
                        <p className="font-semibold line-clamp-2">{row.title}</p>
                        {row.image_url && (
                          <div className="relative w-20 h-20 rounded overflow-hidden border">
                            <Image
                              src={row.image_url}
                              alt={row.title}
                              fill
                              className="object-cover"
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
