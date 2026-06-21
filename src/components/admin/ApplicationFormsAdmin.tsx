"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Trash2 } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

import {
  DEPARTMENTS,
  type Department,
  type ApplicationFormIllustration,
  type IllustrationSlot,
  defaultDepartmentQuestions,
  defaultOptionalPersonalQuestions,
} from "@/lib/applicationForms";

type TemplateRow = {
  id: string;
  name: string;
  open_at: string;
  close_at: string;
};

function isoToDatetimeLocal(iso: string): string {
  // datetime-local expects "YYYY-MM-DDTHH:mm"
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

function datetimeLocalToIso(value: string): string {
  // Interpret datetime-local as local time and convert to ISO.
  const d = new Date(value);
  return d.toISOString();
}

export function ApplicationFormsAdmin({ adminPassword }: { adminPassword: string }) {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Builder fields
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [name, setName] = useState("Đơn đăng ký ứng tuyển");
  const [openAt, setOpenAt] = useState<string>("");
  const [closeAt, setCloseAt] = useState<string>("");

  const [optionalPersonalQuestions, setOptionalPersonalQuestions] = useState<string[]>(
    defaultOptionalPersonalQuestions()
  );
  const [departmentQuestions, setDepartmentQuestions] = useState<Record<Department, string[]>>(
    defaultDepartmentQuestions()
  );
  const [illustrations, setIllustrations] = useState<ApplicationFormIllustration[]>([]);

  const [classOptions, setClassOptions] = useState<string[]>([]);
  const [classOptionInput, setClassOptionInput] = useState("");
  const [uploadSlot, setUploadSlot] = useState<IllustrationSlot>("hero");
  const [uploading, setUploading] = useState(false);

  const authHeaders = useMemo(() => {
    return { "x-admin-password": adminPassword };
  }, [adminPassword]);

  const refreshTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/forms", { headers: authHeaders });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setTemplates(json.data || []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTemplate = async (id: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/admin/forms/${id}`, { headers: authHeaders });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      const t = json.data;

      setTemplateId(t.id);
      setName(t.name || "");
      setOpenAt(isoToDatetimeLocal(t.open_at));
      setCloseAt(isoToDatetimeLocal(t.close_at));
      setOptionalPersonalQuestions(
        Array.from({ length: 5 }).map((_, i) => String(t.optional_personal_questions?.[i] ?? ""))
      );
      setDepartmentQuestions(defaultDepartmentQuestions());
      for (const dept of DEPARTMENTS) {
        const arr = t.department_questions?.[dept] ?? [];
        setDepartmentQuestions((prev) => ({
          ...prev,
          [dept]: Array.from({ length: 3 }).map((_, i) => String(arr?.[i] ?? "")),
        }));
      }

      setIllustrations(
        Array.isArray(t.illustrations)
          ? t.illustrations.map((img: any) => ({
              id: String(img.id ?? img.driveFileId ?? ""),
              title: String(img.title ?? ""),
              slot: (img.slot as IllustrationSlot) ?? "hero",
              url: String(img.url ?? ""),
            }))
          : []
      );
      setClassOptions(Array.isArray(t.class_options) ? (t.class_options as unknown[]).map(String).filter(Boolean) : []);
    } catch (e) {
      setError(String(e));
    }
  };

  const resetBuilder = () => {
    setTemplateId(null);
    setName("Đơn đăng ký ứng tuyển");
    setOpenAt("");
    setCloseAt("");
    setOptionalPersonalQuestions(defaultOptionalPersonalQuestions());
    setDepartmentQuestions(defaultDepartmentQuestions());
    setIllustrations([]);
    setClassOptions([]);
    setClassOptionInput("");
  };

  const saveTemplate = async () => {
    setError(null);
    // basic check
    if (!name.trim()) return setError("Vui lòng nhập tên form.");
    if (!openAt || !closeAt) return setError("Vui lòng nhập thời gian mở/đóng đơn.");

    const payload = {
      id: templateId ?? undefined,
      name,
      openAt: datetimeLocalToIso(openAt),
      closeAt: datetimeLocalToIso(closeAt),
      optionalPersonalQuestions,
      departmentQuestions,
      illustrations,
      classOptions,
    };

    try {
      const res = await fetch("/api/admin/forms", {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      await res.json();
      await refreshTemplates();
      alert("Lưu form thành công.");
    } catch (e) {
      setError(String(e));
    }
  };

  const uploadImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("slot", uploadSlot);
        fd.append("title", file.name);

        const res = await fetch("/api/admin/forms/upload-image", {
          method: "POST",
          headers: authHeaders,
          body: fd,
        });
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        if (json?.success && json?.image) {
          setIllustrations((prev) => [...prev, json.image]);
        }
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setUploading(false);
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

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Danh sách forms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p>Đang tải...</p>
            ) : templates.length === 0 ? (
              <p>Chưa có form nào.</p>
            ) : (
              <div className="space-y-3">
                {templates.map((t) => (
                  <div key={t.id} className="border rounded-lg p-3">
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Thời gian mở: {formatDateTime(t.open_at)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Thời gian đóng: {formatDateTime(t.close_at)}
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="mt-2 w-full"
                      onClick={() => loadTemplate(t.id)}
                    >
                      Edit
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Button type="button" variant="outline" className="w-full" onClick={resetBuilder}>
              Tạo mới
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{templateId ? "Chỉnh sửa form" : "Thiết kế form mới"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3">
              <label className="font-semibold">Tên form</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="font-semibold">Mở đơn</label>
                <Input type="datetime-local" value={openAt} onChange={(e) => setOpenAt(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="font-semibold">Đóng đơn</label>
                <Input type="datetime-local" value={closeAt} onChange={(e) => setCloseAt(e.target.value)} />
              </div>
            </div>

            {/* Class options */}
            <div className="space-y-3">
              <h3 className="font-semibold">Lớp</h3>
              <p className="text-sm text-muted-foreground">Nhập từng lớp rồi nhấn Enter hoặc nút &ldquo;+&rdquo; để thêm. Nếu để trống là điền text.</p>
              <div className="flex gap-2">
                <Input
                  value={classOptionInput}
                  onChange={(e) => setClassOptionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const val = classOptionInput.trim();
                      if (val && !classOptions.includes(val)) {
                        setClassOptions((prev) => [...prev, val]);
                      }
                      setClassOptionInput("");
                    }
                  }}
                  placeholder="Ví dụ: K22414"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const val = classOptionInput.trim();
                    if (val && !classOptions.includes(val)) {
                      setClassOptions((prev) => [...prev, val]);
                    }
                    setClassOptionInput("");
                  }}
                >
                  +
                </Button>
              </div>
              {classOptions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {classOptions.map((cls) => (
                    <div key={cls} className="flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full px-3 py-1 text-sm">
                      <span>{cls}</span>
                      <button
                        type="button"
                        onClick={() => setClassOptions((prev) => prev.filter((c) => c !== cls))}
                        className="ml-1 text-blue-400 hover:text-red-500 transition-colors font-bold leading-none"
                        aria-label={`Xóa ${cls}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Ảnh minh họa (tuỳ chọn)</h3>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="md:col-span-1">
                  <label className="font-semibold text-sm">Slot hiển thị</label>
                  <Select value={uploadSlot} onValueChange={(v) => setUploadSlot(v as IllustrationSlot)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn slot" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hero">Hero</SelectItem>
                      <SelectItem value="personal">Câu hỏi cá nhân</SelectItem>
                      <SelectItem value="department">Theo ban</SelectItem>
                      <SelectItem value="footer">Footer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <label className="font-semibold text-sm">Upload ảnh lên Supabase</label>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => uploadImages(e.target.files)}
                    disabled={uploading}
                  />
                </div>
              </div>

              {illustrations.length > 0 && (
                <div className="flex flex-wrap gap-4">
                  {illustrations.map((img) => (
                    <div key={img.id} className="border rounded-lg p-2 w-48">
                      {img.url && (
                        <img
                          src={img.url}
                          alt={img.title || "image"}
                          className="w-full h-28 object-cover rounded-md"
                        />
                      )}
                      <p className="text-xs font-medium mt-2 truncate">{img.title || img.id}</p>
                      <p className="text-xs text-muted-foreground capitalize">{img.slot}</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="mt-2 w-full"
                        onClick={() => setIllustrations((prev) => prev.filter((x) => x.id !== img.id))}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Xóa
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Câu hỏi cá nhân (5 câu - tuỳ chọn)</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <label className="text-sm font-semibold">Câu {i + 1}</label>
                    <Textarea
                      rows={3}
                      value={optionalPersonalQuestions[i] ?? ""}
                      onChange={(e) => {
                        const next = [...optionalPersonalQuestions];
                        next[i] = e.target.value;
                        setOptionalPersonalQuestions(next);
                      }}
                      placeholder={`Nhập nội dung câu hỏi ${i + 1}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Câu hỏi theo ban (mỗi ban 3 câu - tuỳ chọn)</h3>
              <div className="space-y-4">
                {DEPARTMENTS.map((dept) => (
                  <div key={dept} className="border rounded-lg p-4">
                    <p className="font-semibold mb-3">{dept}</p>
                    <div className="grid gap-3 md:grid-cols-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Textarea
                          key={i}
                          rows={3}
                          value={departmentQuestions[dept]?.[i] ?? ""}
                          onChange={(e) => {
                            setDepartmentQuestions((prev) => ({
                              ...prev,
                              [dept]: Array.from({ length: 3 }).map((__, idx) =>
                                idx === i ? e.target.value : prev[dept]?.[idx] ?? ""
                              ),
                            }));
                          }}
                          placeholder={`Câu ${i + 1} (${dept})`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={resetBuilder}>
                Reset
              </Button>
              <Button type="button" onClick={saveTemplate}>
                Lưu Form
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

