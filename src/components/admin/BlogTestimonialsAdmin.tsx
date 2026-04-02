"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GripVertical, Trash2 } from "lucide-react";
import type { AlumniTestimonialRow } from "@/lib/blog";

type EditorState = {
  id: string | null;
  fullName: string;
  avatarUrl: string;
  avatarFile: File | null;
  positionsText: string;
  message: string;
  isPublished: boolean;
};

const initialEditor: EditorState = {
  id: null,
  fullName: "",
  avatarUrl: "",
  avatarFile: null,
  positionsText: "",
  message: "",
  isPublished: true,
};

export function BlogTestimonialsAdmin({ adminPassword }: { adminPassword: string }) {
  const [rows, setRows] = useState<AlumniTestimonialRow[]>([]);
  const [editor, setEditor] = useState<EditorState>(initialEditor);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOrder, setDragOrder] = useState<AlumniTestimonialRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const authHeaders = useMemo(() => ({ "x-admin-password": adminPassword }), [adminPassword]);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/blog/testimonials", { headers: authHeaders });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Không tải được dữ liệu.");
      const data = Array.isArray(json?.data) ? json.data : [];
      setRows(data);
      setDragOrder(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const resetEditor = () => setEditor(initialEditor);

  const editRow = (row: AlumniTestimonialRow) => {
    setEditor({
      id: row.id,
      fullName: row.full_name,
      avatarUrl: row.avatar_url || "",
      avatarFile: null,
      positionsText: row.positions.join("\n"),
      message: row.message,
      isPublished: row.is_published,
    });
  };

  const avatarPreviewUrl = useMemo(() => {
    if (editor.avatarFile) {
      return URL.createObjectURL(editor.avatarFile);
    }
    return editor.avatarUrl;
  }, [editor.avatarFile, editor.avatarUrl]);

  const uploadAvatar = async () => {
    if (!editor.avatarFile) {
      setError("Vui lòng chọn file ảnh trước khi upload.");
      return;
    }

    setUploadingAvatar(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", editor.avatarFile);
      if (editor.id) {
        formData.append("testimonialId", editor.id);
      }

      const res = await fetch("/api/admin/blog/testimonials/upload-avatar", {
        method: "POST",
        headers: authHeaders,
        body: formData,
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.message || "Upload ảnh thất bại.");
      }

      setEditor((prev) => ({
        ...prev,
        id: prev.id || json?.data?.testimonialId || null,
        avatarUrl: json?.data?.avatarUrl || "",
        avatarFile: null,
      }));
      alert("Upload ảnh đại diện thành công.");
    } catch (e) {
      setError(String(e));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const save = async () => {
    setError(null);
    if (!editor.fullName.trim()) return setError("Vui lòng nhập tên cựu thành viên.");
    if (!editor.message.trim()) return setError("Vui lòng nhập lời gửi gắm.");

    setSaving(true);
    try {
      const payload = {
        id: editor.id || undefined,
        fullName: editor.fullName,
        avatarUrl: editor.avatarUrl,
        positions: editor.positionsText,
        message: editor.message,
        isPublished: editor.isPublished,
      };

      const res = await fetch("/api/admin/blog/testimonials", {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Không lưu được dữ liệu.");

      await refresh();
      resetEditor();
      alert("Lưu lời gửi gắm thành công.");
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    const ok = confirm("Bạn có chắc muốn xóa lời gửi gắm này?");
    if (!ok) return;

    setError(null);
    try {
      const res = await fetch(`/api/admin/blog/testimonials/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Không xóa được dữ liệu.");
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
      const res = await fetch("/api/admin/blog/testimonials", {
        method: "PATCH",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(dragOrder.map((item) => ({ id: item.id }))),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Không lưu được thứ tự.");
      await refresh();
      alert("Cập nhật thứ tự thành công.");
    } catch (e) {
      setError(String(e));
    } finally {
      setSavingOrder(false);
    }
  };

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
          <CardTitle>{editor.id ? "Sửa lời gửi gắm" : "Thêm lời gửi gắm mới"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <label className="text-sm font-semibold">Họ và tên</label>
            <Input
              value={editor.fullName}
              onChange={(e) => setEditor((prev) => ({ ...prev, fullName: e.target.value }))}
              placeholder="VD: NGUYEN VAN A"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-semibold">Ảnh đại diện (URL)</label>
            <Input
              value={editor.avatarUrl}
              onChange={(e) => setEditor((prev) => ({ ...prev, avatarUrl: e.target.value }))}
              placeholder="https://..."
            />
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setEditor((prev) => ({ ...prev, avatarFile: file }));
              }}
            />
            {avatarPreviewUrl && (
              <div className="rounded-md border p-2 w-fit">
                <img
                  src={avatarPreviewUrl}
                  alt="Avatar preview"
                  className="w-20 h-20 rounded-full object-cover"
                />
              </div>
            )}
            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                onClick={uploadAvatar}
                disabled={!editor.avatarFile || uploadingAvatar}
              >
                {uploadingAvatar ? "Đang upload..." : "Upload ảnh lên Supabase"}
              </Button>
              {editor.avatarFile && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditor((prev) => ({ ...prev, avatarFile: null }))}
                >
                  Bỏ ảnh đã chọn
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-semibold">Chức vụ (mỗi dòng một chức vụ)</label>
            <Textarea
              value={editor.positionsText}
              onChange={(e) => setEditor((prev) => ({ ...prev, positionsText: e.target.value }))}
              rows={4}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-semibold">Lời gửi gắm</label>
            <Textarea
              value={editor.message}
              onChange={(e) => setEditor((prev) => ({ ...prev, message: e.target.value }))}
              rows={5}
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
              {saving ? "Đang lưu..." : "Lưu lời gửi gắm"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Danh sách lời gửi gắm</CardTitle>
          <div className="flex gap-2">
            {isDragging && (
              <Button type="button" onClick={saveOrder} disabled={savingOrder}>
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
            <p className="text-sm text-muted-foreground">Chưa có dữ liệu. Nhấn "Tải lại" để đồng bộ.</p>
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
                  <div className="flex items-start gap-3">
                    <GripVertical className="w-4 h-4 mt-1 text-muted-foreground" />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold truncate">{row.full_name}</p>
                        <Badge variant={row.is_published ? "default" : "secondary"}>
                          {row.is_published ? "Công khai" : "Ẩn"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{row.message}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => editRow(row)}>
                        Sửa
                      </Button>
                      <Button type="button" variant="destructive" size="sm" onClick={() => remove(row.id)}>
                        <Trash2 className="w-4 h-4" />
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
