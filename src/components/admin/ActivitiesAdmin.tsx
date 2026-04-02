"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2, GripVertical, X } from "lucide-react";
import Image from "next/image";
import type { ActivityRow } from "@/lib/activities";

type EditorState = {
  id: string | null;
  name: string;
  description: string;
  images: string[];
  imageFiles: File[];
  isPublished: boolean;
};

const initialEditor: EditorState = {
  id: null,
  name: "",
  description: "",
  images: [],
  imageFiles: [],
  isPublished: true,
};

export function ActivitiesAdmin({ adminPassword }: { adminPassword: string }) {
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState>(initialEditor);
  const [dragOrder, setDragOrder] = useState<ActivityRow[]>([]);
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
      const res = await fetch("/api/admin/activities", { headers: authHeaders });
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

  const editRow = (row: ActivityRow) => {
    setEditor({
      id: row.id,
      name: row.name || "",
      description: row.description || "",
      images: row.images || [],
      imageFiles: [],
      isPublished: Boolean(row.is_published),
    });
  };

  const save = async () => {
    setError(null);
    if (!editor.name.trim()) return setError("Vui lòng nhập tên hoạt động.");

    setSaving(true);
    try {
      let activityId = editor.id;
      let finalImages = [...editor.images];

      // Upload new image files if provided
      if (editor.imageFiles.length > 0) {
        const formData = new FormData();
        editor.imageFiles.forEach((file) => {
          formData.append("files", file);
        });
        if (activityId) {
          formData.append("activityId", activityId);
        }

        const uploadRes = await fetch("/api/admin/activities/upload-images", {
          method: "POST",
          headers: { ...authHeaders },
          body: formData,
        });

        if (!uploadRes.ok) throw new Error(await uploadRes.text());
        const uploadJson = await uploadRes.json();
        finalImages = [...finalImages, ...(uploadJson.data.imageUrls || [])];
        activityId = uploadJson.data.activityId;
      }

      const payload = {
        id: activityId ?? undefined,
        name: editor.name,
        description: editor.description,
        images: finalImages,
        isPublished: editor.isPublished,
      };

      const res = await fetch("/api/admin/activities", {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());
      await res.json();
      await refresh();
      resetEditor();
      alert("Lưu hoạt động thành công.");
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    const ok = confirm("Bạn có chắc muốn xóa hoạt động này?");
    if (!ok) return;

    setError(null);
    try {
      const res = await fetch(`/api/admin/activities/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });

      if (!res.ok) throw new Error(await res.text());
      await refresh();
    } catch (e) {
      setError(String(e));
    }
  };

  const removeImage = (index: number) => {
    setEditor((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const removeImageFile = (index: number) => {
    setEditor((prev) => ({
      ...prev,
      imageFiles: prev.imageFiles.filter((_, i) => i !== index),
    }));
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
      const res = await fetch("/api/admin/activities", {
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

  const imagePreviewUrls = useMemo(() => {
    return editor.imageFiles.map((file) => URL.createObjectURL(file));
  }, [editor.imageFiles]);

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
          <CardTitle>{editor.id ? "Sửa hoạt động" : "Thêm hoạt động mới"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <label className="text-sm font-semibold">Tên hoạt động</label>
            <Input
              value={editor.name}
              onChange={(e) => setEditor((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Nhập tên hoạt động"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-semibold">Mô tả hoạt động</label>
            <Textarea
              value={editor.description}
              onChange={(e) => setEditor((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Nhập mô tả hoạt động"
              rows={4}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-semibold">Hình ảnh có sẵn</label>
            {editor.images.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {editor.images.map((url, idx) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden border">
                    <div className="relative w-full h-24">
                      <Image
                        src={url}
                        alt={`Activity image ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Chưa có hình ảnh</p>
            )}
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-semibold">Thêm hình ảnh mới</label>
            {imagePreviewUrls.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 mb-3">
                {imagePreviewUrls.map((url, idx) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden border">
                    <div className="relative w-full h-24">
                      <Image
                        src={url}
                        alt={`New image ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImageFile(idx)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (files.length > 0) {
                  setEditor((prev) => ({ ...prev, imageFiles: [...prev.imageFiles, ...files] }));
                }
              }}
              disabled={saving}
            />
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
              {saving ? "Đang lưu..." : "Lưu hoạt động"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Danh sách hoạt động</CardTitle>
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
            <p className="text-sm text-muted-foreground">Chưa có hoạt động nào. Nhấn "Tải lại" để đồng bộ.</p>
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
                        <p className="font-semibold line-clamp-2">{row.name}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">{row.description}</p>
                        {row.images && row.images.length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {row.images.slice(0, 3).map((url, idx) => (
                              <div key={idx} className="relative w-12 h-12 rounded overflow-hidden border">
                                <Image
                                  src={url}
                                  alt={`Activity image ${idx + 1}`}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ))}
                            {row.images.length > 3 && (
                              <div className="w-12 h-12 rounded border flex items-center justify-center bg-muted text-xs">
                                +{row.images.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="flex gap-2 flex-wrap">
                          {row.is_published ? <Badge>Public</Badge> : <Badge variant="destructive">Ẩn</Badge>}
                          <Badge variant="outline">{row.images?.length || 0} ảnh</Badge>
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
