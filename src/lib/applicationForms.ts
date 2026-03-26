export const DEPARTMENTS = [
  "Tổ chức - Xây dựng Đoàn",
  "Truyền thông - Kỹ thuật",
  "Tuyên giáo - Sự kiện",
  "Phong trào - Tình nguyện",
] as const;

export type Department = (typeof DEPARTMENTS)[number];

export type IllustrationSlot = "hero" | "personal" | "department" | "footer";

export type ApplicationFormIllustration = {
  id: string; // UUID or local id
  title: string;
  slot: IllustrationSlot;
  url: string;
};

export type ApplicationFormTemplate = {
  id: string;
  name: string;
  open_at: string;
  close_at: string;
  drive_folder_url: string;
  drive_folder_id: string;
  optional_personal_questions: string[]; // length 5
  department_questions: Record<Department, string[]>; // each length 3
  illustrations: ApplicationFormIllustration[];
};

export function normalizeTemplateShape(input: any): ApplicationFormTemplate {
  const optional = Array.isArray(input?.optional_personal_questions) ? input.optional_personal_questions : [];
  const departmentQs = input?.department_questions ?? {};
  const illustrations = Array.isArray(input?.illustrations) ? input.illustrations : [];

  const optionalFixed = Array.from({ length: 5 }).map((_, i) => String(optional[i] ?? ""));

  const deptFixed = {} as Record<Department, string[]>;
  for (const dept of DEPARTMENTS) {
    const arr = Array.isArray((departmentQs as any)?.[dept]) ? (departmentQs as any)[dept] : [];
    deptFixed[dept] = Array.from({ length: 3 }).map((_, i) => String(arr[i] ?? ""));
  }

  return {
    id: String(input?.id ?? ""),
    name: String(input?.name ?? ""),
    open_at: String(input?.open_at ?? ""),
    close_at: String(input?.close_at ?? ""),
    drive_folder_url: String(input?.drive_folder_url ?? ""),
    drive_folder_id: String(input?.drive_folder_id ?? ""),
    optional_personal_questions: optionalFixed,
    department_questions: deptFixed,
    illustrations: illustrations.map((img: any) => ({
      id: String(img?.id ?? ""),
      title: String(img?.title ?? ""),
      slot: (img?.slot as IllustrationSlot) ?? "hero",
      url: String(img?.url ?? ""),
    })),
  };
}

export function defaultDepartmentQuestions(): Record<Department, string[]> {
  return {
    "Tổ chức - Xây dựng Đoàn": ["", "", ""],
    "Truyền thông - Kỹ thuật": ["", "", ""],
    "Tuyên giáo - Sự kiện": ["", "", ""],
    "Phong trào - Tình nguyện": ["", "", ""],
  };
}

export function defaultOptionalPersonalQuestions(): string[] {
  return Array.from({ length: 5 }).map(() => "");
}

