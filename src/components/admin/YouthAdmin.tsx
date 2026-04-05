"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Trash2 } from "lucide-react";
import Image from "next/image";
import { YOUTH_TARGET_LINK_OPTIONS, type YouthLaunchStatus, type YouthRow } from "@/lib/youth";

type EditorState = {
  id: string | null;
  name: string;
  subtitle: string;
  iconUrl: string;
  iconFile: File | null;
  targetHref: string;
  launchStatus: YouthLaunchStatus;
  isPublished: boolean;
};

const initialEditor: EditorState = {
  id: null,
  name: "",
  subtitle: "",
  iconUrl: "",
  iconFile: null,
  targetHref: "",
  launchStatus: "active",
  isPublished: true,
};

export function YouthAdmin({ adminPassword }: { adminPassword: string }) {
  const [rows, setRows] = useState<YouthRow[]>([]);
  const [dragOrder, setDragOrder] = useState<YouthRow[]>([]);
  const [editor, setEditor] = useState<EditorState>(initialEditor);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const authHeaders = useMemo(() => ({ "x-admin-password": adminPassword }), [adminPassword]);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/youth", { headers: authHeaders });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      const data = Array.isArray(json?.data) ? (json.data as YouthRow[]) : [];
      setRows(data);
      setDragOrder(data);
    } catch (e) {
      setError(String(e));
      setRows([]);
      setDragOrder([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetEditor = () => setEditor(initialEditor);

  const editRow = (row: YouthRow) => {
    setEditor({
      id: row.id,
      name: row.name,
      subtitle: row.subtitle,
      iconUrl: row.icon_url,
      iconFile: null,
      targetHref: row.target_href,
      launchStatus: row.launch_status,
      isPublished: row.is_published,
    });
  };

  const iconPreviewUrl = useMemo(() => {
    if (editor.iconFile) {
      return URL.createObjectURL(editor.iconFile);
    }
    return editor.iconUrl;
  }, [editor.iconFile, editor.iconUrl]);

  const uploadIcon = async (): Promise<{ youthId: string; iconUrl: string } | null> => {
    if (!editor.iconFile) return null;

    setUploadingIcon(true);
    try {
      const formData = new FormData();
      formData.append("file", editor.iconFile);
      if (editor.id) {
        formData.append("youthId", editor.id);
      }

      const res = await fetch("/api/admin/youth/upload-icon", {
        method: "POST",
        headers: authHeaders,
        body: formData,
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Upload icon that bai.");

      return {
        youthId: String(json?.data?.youthId || editor.id || ""),
        iconUrl: String(json?.data?.iconUrl || ""),
      };
    } finally {
      setUploadingIcon(false);
    }
  };

  const save = async () => {
    setError(null);

    if (!editor.name.trim()) {
      setError("Vui long nhap tieu de.");
      return;
    }

    if (editor.targetHref && !editor.targetHref.startsWith("/youth")) {
      setError("Duong dan phai bat dau bang /youth.");
      return;
    }

    if (editor.launchStatus === "active" && !editor.targetHref) {
      setError("Muc dang hoat dong can co duong dan /youth/...");
      return;
    }

    setSaving(true);
    try {
      let youthId = editor.id;
      let iconUrl = editor.iconUrl;

      if (editor.iconFile) {
        const uploadData = await uploadIcon();
        if (uploadData) {
          youthId = uploadData.youthId;
          iconUrl = uploadData.iconUrl;
        }
      }

      const payload = {
        id: youthId ?? undefined,
        name: editor.name,
        subtitle: editor.subtitle,
        iconUrl,
        targetHref: editor.targetHref,
        launchStatus: editor.launchStatus,
        isPublished: editor.isPublished,
      };

      const res = await fetch("/api/admin/youth", {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());

      await refresh();
      resetEditor();
      alert("Lưu thành công!");
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    const ok = confirm("Bạn có chắc muốn xóa mục này?");
    if (!ok) return;

    setError(null);
    try {
      const res = await fetch(`/api/admin/youth/${id}`, {
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
      const res = await fetch("/api/admin/youth", {
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

  const getStatusBadgeClass = (status: YouthLaunchStatus) => {
    if (status === "coming_soon") return "border-amber-200 bg-amber-100 text-amber-800";
    if (status === "ended") return "border-red-200 bg-red-100 text-red-800";
    return "border-emerald-200 bg-emerald-100 text-emerald-800";
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
          <CardTitle>{editor.id ? "Điều chỉnh nội dung" : "Thêm mới nội dung"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <label className="text-sm font-semibold">Tiêu đề</label>
            <Input
              value={editor.name}
              onChange={(e) => setEditor((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Nhập tiêu đề"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-semibold">Phụ đề</label>
            <Textarea
              value={editor.subtitle}
              onChange={(e) => setEditor((prev) => ({ ...prev, subtitle: e.target.value }))}
              placeholder="Mô tả ngắn"
              rows={2}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-semibold">Icon</label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setEditor((prev) => ({ ...prev, iconFile: file }));
              }}
            />
            {iconPreviewUrl ? (
              <div className="rounded-md border p-2 w-fit">
                <Image src={iconPreviewUrl} alt="Icon preview" width={40} height={40} className="w-10 h-10 rounded object-cover" />
              </div>
            ) : null}
            {editor.iconFile ? (
              <Button
                type="button"
                variant="ghost"
                className="w-fit"
                onClick={() => setEditor((prev) => ({ ...prev, iconFile: null }))}
              >
                Bỏ file đã chọn
              </Button>
            ) : null}
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-semibold">Link đến trang con</label>
            <Input
              value={editor.targetHref}
              onChange={(e) => setEditor((prev) => ({ ...prev, targetHref: e.target.value.trim() }))}
              placeholder="/youth/a80"
            />
            <div className="flex flex-wrap gap-2">
              {YOUTH_TARGET_LINK_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setEditor((prev) => ({ ...prev, targetHref: option.value }))}
                >
                  {option.value}
                </Button>
              ))}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setEditor((prev) => ({ ...prev, targetHref: "" }))}
              >
                Coming soon
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-semibold">Trạng thái</label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={editor.launchStatus === "active" ? "default" : "outline"}
                onClick={() => setEditor((prev) => ({ ...prev, launchStatus: "active" }))}
                className={editor.launchStatus === "active" ? "bg-emerald-600 text-white hover:bg-emerald-700" : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"}
              >
                Đang hoạt động
              </Button>
              <Button
                type="button"
                variant={editor.launchStatus === "coming_soon" ? "default" : "outline"}
                onClick={() => setEditor((prev) => ({ ...prev, launchStatus: "coming_soon" }))}
                className={editor.launchStatus === "coming_soon" ? "bg-amber-500 text-white hover:bg-amber-600" : "border-amber-300 text-amber-700 hover:bg-amber-50"}
              >
                Đang phát triển
              </Button>
              <Button
                type="button"
                variant={editor.launchStatus === "ended" ? "default" : "outline"}
                onClick={() => setEditor((prev) => ({ ...prev, launchStatus: "ended" }))}
                className={editor.launchStatus === "ended" ? "bg-red-600 text-white hover:bg-red-700" : "border-red-300 text-red-700 hover:bg-red-50"}
              >
                Đã kết thúc
              </Button>
            </div>
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
            <Button type="button" onClick={save} disabled={saving || uploadingIcon}>
              {saving || uploadingIcon ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Danh sách Mục</CardTitle>
          <div className="flex gap-2">
            {isDragging && (
              <Button type="button" variant="default" onClick={saveOrder} disabled={savingOrder}>
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
            <p className="text-sm text-muted-foreground">Chưa có nội dung.</p>
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
                        <p className="text-sm text-muted-foreground line-clamp-2">{row.subtitle}</p>
                        <div className="flex items-center gap-2">
                          {row.icon_url ? (
                            <Image src={row.icon_url} alt={`${row.name} icon`} width={24} height={24} className="w-6 h-6 rounded object-cover border" />
                          ) : null}
                          <Badge variant="outline">{row.target_href || "Coming soon"}</Badge>
                          <Badge variant="outline" className={getStatusBadgeClass(row.launch_status)}>
                            {row.launch_status === "coming_soon"
                              ? "Đang phát triển"
                              : row.launch_status === "ended"
                                ? "Đã kết thúc"
                                : "Đang hoạt động"}
                          </Badge>
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
