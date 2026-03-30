"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useActionState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { useToast } from "@/hooks/use-toast";
import { submitApplication } from "@/app/actions";
import {
  ApplicationFormSubmissionStrictSchema,
  type ApplicationFormState,
} from "@/lib/definitions";
import {
  DEPARTMENTS,
  type Department,
  type IllustrationSlot,
  type ApplicationFormIllustration,
  normalizeTemplateShape,
} from "@/lib/applicationForms";

type ActiveTemplateResponse =
  | {
      success: true;
      status: "active" | "not_started" | "ended";
      now: string;
      template: any;
    }
  | { success: false; message: string };

const initialState: ApplicationFormState = null;

const optionalPersonalKeys = [
  "optionalPersonal1",
  "optionalPersonal2",
  "optionalPersonal3",
  "optionalPersonal4",
  "optionalPersonal5",
] as const;

const deptOptionalKeys = ["deptOptional1", "deptOptional2", "deptOptional3"] as const;

function formatCountdown(diffMs: number) {
  const diff = Math.max(0, diffMs);
  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return { days, hours, minutes, seconds };
}

function IllustrationList({ illustrations }: { illustrations: ApplicationFormIllustration[] }) {
  if (illustrations.length === 0) return null;
  return (
    <div className="space-y-4">
      {illustrations.map((img) => (
        <div key={img.id} className="flex justify-center">
          {/* External images (Drive) => use plain <img> */}
          <img
            src={img.url}
            alt={img.title || "illustration"}
            className="max-w-full h-auto rounded-3xl shadow-md"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}

export function TemplateDrivenApplicationForm() {
  const { toast } = useToast();
  const [state, formAction] = useActionState(submitApplication, initialState);
  const [isPending, startTransition] = useTransition();

  const [template, setTemplate] = useState<any | null>(null);
  const [status, setStatus] = useState<"loading" | "active" | "not_started" | "ended">("loading");

  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    // Only update every 5 seconds to reduce rerenders and memory pressure
    const t = setInterval(() => setNowMs(Date.now()), 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/forms/active", { cache: "no-store" });
        const data = (await res.json()) as ActiveTemplateResponse;
        if (!mounted) return;
        if ("success" in data && data.success) {
          setTemplate(data.template ? normalizeTemplateShape(data.template) : null);
          setStatus(data.status);
        } else {
          setTemplate(null);
          setStatus("ended");
        }
      } catch {
        setTemplate(null);
        setStatus("ended");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const targetDate = useMemo(() => {
    if (!template) return null;
    if (status === "active") return new Date(template.close_at);
    if (status === "not_started") return new Date(template.open_at);
    return null;
  }, [template, status]);

  const countdown = useMemo(() => {
    if (!targetDate) return null;
    return formatCountdown(targetDate.getTime() - nowMs);
  }, [nowMs, targetDate]);

  const defaultValues = useMemo(() => {
    return {
      templateId: template?.id ?? "",
      fullName: "",
      birthDate: "",
      className: "",
      studentId: "",
      email: "",
      gender: undefined,
      department: undefined,
      photo: undefined,
      optionalPersonal1: "",
      optionalPersonal2: "",
      optionalPersonal3: "",
      optionalPersonal4: "",
      optionalPersonal5: "",
      deptOptional1: "",
      deptOptional2: "",
      deptOptional3: "",
    };
  }, [template?.id]);

  const form = useForm<z.infer<typeof ApplicationFormSubmissionStrictSchema>>({
    resolver: zodResolver(ApplicationFormSubmissionStrictSchema),
    defaultValues,
    mode: "onChange",
  });

  useEffect(() => {
    if (!template?.id) return;
    form.reset({
      ...defaultValues,
      templateId: template.id,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template?.id]);

  const selectedDepartment = form.watch("department") as Department | undefined;

  const deptQuestions = useMemo(() => {
    if (!template || !selectedDepartment) return null;
    const qs = template.department_questions?.[selectedDepartment];
    if (!qs) return null;
    return qs;
  }, [template, selectedDepartment]);

  const heroIllustrations = useMemo(() => {
    if (!template) return [];
    return (template.illustrations || []).filter((i: any) => i.slot === "hero");
  }, [template]);

  const personalIllustrations = useMemo(() => {
    if (!template) return [];
    return (template.illustrations || []).filter((i: any) => i.slot === "personal");
  }, [template]);

  const deptIllustrations = useMemo(() => {
    if (!template) return [];
    return (template.illustrations || []).filter((i: any) => i.slot === "department");
  }, [template]);

  const onSubmit = async (data: z.infer<typeof ApplicationFormSubmissionStrictSchema>) => {
    const formData = new FormData();
    formData.append("templateId", data.templateId);
    formData.append("fullName", data.fullName);
    formData.append("birthDate", data.birthDate);
    formData.append("className", data.className);
    formData.append("studentId", data.studentId);
    formData.append("email", data.email);
    formData.append("gender", data.gender);
    formData.append("department", data.department);

    formData.append("photo", data.photo as File);

    formData.append("optionalPersonal1", data.optionalPersonal1 || "");
    formData.append("optionalPersonal2", data.optionalPersonal2 || "");
    formData.append("optionalPersonal3", data.optionalPersonal3 || "");
    formData.append("optionalPersonal4", data.optionalPersonal4 || "");
    formData.append("optionalPersonal5", data.optionalPersonal5 || "");

    formData.append("deptOptional1", data.deptOptional1 || "");
    formData.append("deptOptional2", data.deptOptional2 || "");
    formData.append("deptOptional3", data.deptOptional3 || "");

    startTransition(() => {
      formAction(formData);
    });
  };

  useEffect(() => {
    if (!state?.message) return;
    if (state.issues && state.issues.length > 0) {
      toast({ title: "Lỗi xác thực", description: state.message, variant: "destructive" });
    } else {
      toast({ title: "Thành công!", description: state.message });
      form.reset();
    }
  }, [state, toast, form]);

  return (
    <div>
      <div className="text-center mb-6">
        {status === "loading" && <p className="text-gray-600">Đang tải...</p>}

        {status === "not_started" && countdown && (
          <p className="text-1xl md:text-2xl font-nunito font-semibold text-red-600">
            Mở đơn sau: {countdown.days} ngày {countdown.hours} giờ {countdown.minutes} phút{" "}
            {countdown.seconds} giây
          </p>
        )}

        {status === "active" && countdown && (
          <p className="text-1xl md:text-2xl font-nunito font-semibold text-green-600">
            Còn {countdown.days} ngày {countdown.hours} giờ {countdown.minutes} phút {countdown.seconds} giây
          </p>
        )}

        {status === "ended" && (
          <p className="text-1xl md:text-2xl font-nunito font-semibold text-gray-500">Đã kết thúc vòng 1</p>
        )}
      </div>

      {status === "active" && template && (
        <div className="space-y-6">
          <IllustrationList illustrations={heroIllustrations} />
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {personalIllustrations.length > 0 && (
                <div className="my-6">
                  <IllustrationList illustrations={personalIllustrations} />
                </div>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">{template.name || "Đơn đăng ký ứng tuyển"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Họ và Tên *</FormLabel>
                          <FormControl>
                            <Input {...field} className="bg-[#45973c]/10 focus:bg-[#45973c]/20 border-gray-300 focus:border-[#45973c]" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="birthDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ngày sinh *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} className="bg-[#45973c]/10 focus:bg-[#45973c]/20 border-gray-300 focus:border-[#45973c]" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="className"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lớp *</FormLabel>
                          <FormControl>
                            <Input {...field} className="bg-[#45973c]/10 focus:bg-[#45973c]/20 border-gray-300 focus:border-[#45973c]" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="studentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>MSSV *</FormLabel>
                          <FormControl>
                            <Input {...field} className="bg-[#45973c]/10 focus:bg-[#45973c]/20 border-gray-300 focus:border-[#45973c]" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} className="bg-[#45973c]/10 focus:bg-[#45973c]/20 border-gray-300 focus:border-[#45973c]" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Giới tính *</FormLabel>
                          <FormControl>
                            <Input
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(e.target.value)}
                              list="gender-options"
                              placeholder="Nam/Nữ/Khác"
                              className="bg-[#45973c]/10 focus:bg-[#45973c]/20 border-gray-300 focus:border-[#45973c]"
                            />
                          </FormControl>
                          <datalist id="gender-options">
                            <option value="Nam" />
                            <option value="Nữ" />
                            <option value="Khác" />
                          </datalist>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="photo"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Ảnh cá nhân * </FormLabel>
                          <FormControl>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => field.onChange(e.target.files?.[0])}
                              className="bg-[#45973c]/10 focus:bg-[#45973c]/20 border-gray-300 focus:border-[#45973c]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Các câu hỏi cá nhân (tùy chọn)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const label = template.optional_personal_questions?.[i] || `Câu hỏi ${i + 1}`;
                        const key = optionalPersonalKeys[i];
                        return (
                          <FormField
                            key={key}
                            control={form.control}
                            name={key}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{label || `Câu hỏi ${i + 1}`}</FormLabel>
                                <FormControl>
                                  <Textarea
                                    rows={3}
                                    {...field}
                                    className="bg-[#45973c]/10 focus:bg-[#45973c]/20 border-gray-300 focus:border-[#45973c]"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Chọn ban *</h3>
                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                            >
                              {DEPARTMENTS.map((dept) => (
                                <FormItem
                                  key={dept}
                                  className="flex items-center space-x-2 border rounded-lg p-3 bg-white"
                                >
                                  <RadioGroupItem
                                    value={dept}
                                    className="text-[#45973c] border-[#45973c] focus:ring-[#45973c]"
                                  />
                                  <FormLabel className="m-0 font-normal">{dept}</FormLabel>
                                </FormItem>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {selectedDepartment && deptQuestions && (
                    <div className="space-y-4">
                      {deptIllustrations.length > 0 && <IllustrationList illustrations={deptIllustrations} />}
                      <h3 className="text-lg font-semibold">Câu hỏi theo ban (tùy chọn)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Array.from({ length: 3 }).map((_, i) => {
                          const label = deptQuestions?.[i] || `Câu hỏi theo ban ${i + 1}`;
                          const key = deptOptionalKeys[i];
                          return (
                            <FormField
                              key={key}
                              control={form.control}
                              name={key}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{label || `Câu hỏi ${i + 1}`}</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      rows={3}
                                      {...field}
                                      className="bg-[#45973c]/10 focus:bg-[#45973c]/20 border-gray-300 focus:border-[#45973c]"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      size="lg"
                      disabled={form.formState.isSubmitting || isPending}
                      className="bg-[#45973c] hover:bg-[#357a2e] text-white"
                    >
                      {form.formState.isSubmitting || isPending ? "Đang gửi..." : "SUBMIT"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>
      )}

      {status !== "active" && state?.message && (
        <Alert className="mt-8">
          <AlertTitle>Thông báo</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

