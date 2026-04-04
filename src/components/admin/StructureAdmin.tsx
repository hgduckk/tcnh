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
import type { StructureDepartmentRow } from "@/lib/structureDepartments";

type EditorState = {
  id: string | null;
  name: string;
  shortDescription: string;
  content: string;
  images: string[];
  imageFiles: File[];
  isPublished: boolean;
};

const initialEditor: EditorState = {
  id: null,
  name: "",
  shortDescription: "",
  content: "",
  images: [],
  imageFiles: [],
  isPublished: true,
};

export function StructureAdmin({ adminPassword }: { adminPassword: string }) {
  const [rows, setRows] = useState<StructureDepartmentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState>(initialEditor);
  const [dragOrder, setDragOrder] = useState<StructureDepartmentRow[]>([]);
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
      const res = await fetch("/api/admin/structure", { headers: authHeaders });
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

  const editRow = (row: StructureDepartmentRow) => {
    setEditor({
      id: row.id,
      name: row.name || "",
      shortDescription: row.short_description || "",
      content: row.content || "",
      images: row.images || [],
      imageFiles: [],
      isPublished: Boolean(row.is_published),
    });
  };

  const save = async () => {
    setError(null);
    if (!editor.name.trim()) return setError("Vui lòng nhập tên ban.");

    setSaving(true);
    try {
      let departmentId = editor.id;
      let finalImages = [...editor.images];

      if (editor.imageFiles.length > 0) {
        const formData = new FormData();
        editor.imageFiles.forEach((file) => {
          formData.append("files", file);
        });
        if (departmentId) {
          formData.append("departmentId", departmentId);
        }

        const uploadRes = await fetch("/api/admin/structure/upload-images", {
          method: "POST",
          headers: { ...authHeaders },
          body: formData,
        });

        if (!uploadRes.ok) throw new Error(await uploadRes.text());
        const uploadJson = await uploadRes.json();
        finalImages = [...finalImages, ...(uploadJson.data.imageUrls || [])];
        departmentId = uploadJson.data.departmentId;
      }

      const payload = {
        id: departmentId ?? undefined,
        name: editor.name,
        shortDescription: editor.shortDescription,
        content: editor.content,
        images: finalImages,
        isPublished: editor.isPublished,
      };

      const res = await fetch("/api/admin/structure", {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());
      await res.json();
      await refresh();
      resetEditor();
      alert("Lưu ban thành công.");
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    const ok = confirm("Bạn có chắc muốn xóa ban này?");
    if (!ok) return;

    setError(null);
    try {
      const res = await fetch(`/api/admin/structure/${id}`, {
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
      const res = await fetch("/api/admin/structure", {
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

  const removeExistingImage = (imageUrl: string) => {
    setEditor((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img !== imageUrl),
    }));
  };

  const removeNewImage = (index: number) => {
    setEditor((prev) => ({
      ...prev,
      imageFiles: prev.imageFiles.filter((_, i) => i !== index),
    }));
  };

  const newImagePreviews = useMemo(() => {
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
          <CardTitle>{editor.id ? "Chỉnh sửa ban" : "Thêm ban mới"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tên ban</label>
              <Input
                value={editor.name}
                onChange={(e) => setEditor((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ví dụ: Ban Tổ chức - Xây dựng Đoàn"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Câu quote ngắn</label>
              <Input
                value={editor.shortDescription}
                onChange={(e) => setEditor((prev) => ({ ...prev, shortDescription: e.target.value }))}
                placeholder="Ví dụ: High risk - high return"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Mô tả</label>
            <Textarea
              value={editor.content}
              onChange={(e) => setEditor((prev) => ({ ...prev, content: e.target.value }))}
              placeholder="Nhập nội dung giới thiệu của ban..."
              rows={8}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Hình ảnh</label>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setEditor((prev) => ({ ...prev, imageFiles: Array.from(e.target.files || []) }))}
            />
          </div>

          {editor.images.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Ảnh hiện có</p>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {editor.images.map((imageUrl) => (
                  <div key={imageUrl} className="relative overflow-hidden rounded-lg border bg-slate-50">
                    <Image src={imageUrl} alt="Department image" width={240} height={160} className="h-32 w-full object-cover" />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute right-2 top-2 h-8 w-8"
                      onClick={() => removeExistingImage(imageUrl)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {newImagePreviews.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Ảnh mới sẽ tải lên</p>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {newImagePreviews.map((previewUrl, index) => (
                  <div key={previewUrl} className="relative overflow-hidden rounded-lg border bg-slate-50">
                    <Image src={previewUrl} alt="New upload preview" width={240} height={160} className="h-32 w-full object-cover" />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute right-2 top-2 h-8 w-8"
                      onClick={() => removeNewImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={editor.isPublished ? "default" : "outline"}
              onClick={() => setEditor((prev) => ({ ...prev, isPublished: !prev.isPublished }))}
            >
              {editor.isPublished ? "Đang hiển thị" : "Đang ẩn"}
            </Button>
            <Button type="button" variant="outline" onClick={resetEditor}>
              Làm mới form
            </Button>
            <Button type="button" onClick={save} disabled={saving}>
              {saving ? "Đang lưu..." : editor.id ? "Cập nhật" : "Tạo mới"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Danh sách ban</CardTitle>
          <Button type="button" variant="outline" onClick={saveOrder} disabled={savingOrder || dragOrder.length === 0}>
            {savingOrder ? "Đang lưu thứ tự..." : "Lưu thứ tự"}
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500">Đang tải...</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có ban nào.</p>
          ) : (
            <div className="space-y-3">
              {dragOrder.map((row, index) => (
                <div
                  key={row.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, row.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, row.id)}
                  onDragEnd={() => {
                    setIsDragging(false);
                    setDraggedId(null);
                  }}
                  className={`flex flex-col gap-4 rounded-xl border p-4 md:flex-row md:items-center md:justify-between ${isDragging && draggedId === row.id ? "opacity-50" : ""}`}
                >
                  <div className="flex items-start gap-4">
                    <button type="button" className="cursor-grab text-slate-400 active:cursor-grabbing">
                      <GripVertical className="mt-1 h-5 w-5" />
                    </button>
                    {row.images?.[0] ? (
                      <Image src={row.images[0]} alt={row.name} width={96} height={72} className="h-18 w-24 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-18 w-24 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">No image</div>
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-800">{index + 1}. {row.name}</h3>
                        <Badge variant={row.is_published ? "default" : "secondary"}>
                          {row.is_published ? "Hiển thị" : "Ẩn"}
                        </Badge>
                      </div>
                      <p className="text-sm italic text-slate-500">{row.short_description}</p>
                      <p className="line-clamp-2 text-sm text-slate-600">{row.content}</p>
                      <p className="text-xs text-slate-400">{row.images?.length || 0} ảnh</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" onClick={() => editRow(row)}>
                      Sửa
                    </Button>
                    <Button type="button" variant="destructive" onClick={() => remove(row.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Xóa
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
