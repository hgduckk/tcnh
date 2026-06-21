import { z } from 'zod';
import { DEPARTMENTS, type Department } from './applicationForms';

export const ContactFormSchema = z.object({
  name: z.string().min(2, { message: "Tên phải có ít nhất 2 ký tự." }),
  email: z.string().email({ message: "Vui lòng nhập một địa chỉ email hợp lệ." }),
  message: z.string().min(10, { message: "Tin nhắn phải có ít nhất 10 ký tự." }),
});

export type ContactFormState = {
  message: string;
  fields?: Record<string, string>;
  issues?: string[];
} | null;


export const CommentFormSchema = z.object({
  name: z.string().optional().nullable(),
  comment: z.string().min(5, { message: "Bình luận phải có ít nhất 5 ký tự." }),
  parentId: z.string().optional().nullable(),
  isAnonymous: z.boolean().default(false),
});

export type CommentFormState = {
  message: string;
  isSafe?: boolean;
  reason?: string;
  fields?: Record<string, string>;
  issues?: string[];
} | null;

export type Comment = {
  id: string;
  name: string | null;
  comment: string;
  avatar: string | null;
  isAnonymous: boolean;
  createdAt: string;
  parentId: string | null;
  replies?: Comment[];
};

// Raw comment type from Supabase
export type SupabaseComment = {
  id: string;
  name: string | null;
  comment: string;
  avatar: string | null;
  is_anonymous: boolean;
  created_at: string;
  parent_id: string | null;
};

const departmentEnum = z.enum(DEPARTMENTS as unknown as [string, string, string, string]);
const genderEnum = z.enum(["Nam", "Nữ", "Khác"] as const);

// Loose schema for client-side typing/build compatibility:
// - Accepts BOTH legacy keys (current ApplicationForm) and new template-driven keys.
// - Real validation happens in `ApplicationFormSubmissionStrictSchema`.
export const ApplicationFormSchema = z.object({
  // New template-driven keys
  templateId: z.string().optional(),
  fullName: z.string().min(2).optional(),
  birthDate: z.string().optional(),
  className: z.string().optional(),
  studentId: z.string().optional(),
  email: z.string().email().optional(),
  gender: genderEnum.optional(),
  department: departmentEnum.optional(),
  photo: z.any().optional(),

  optionalPersonal1: z.string().optional(),
  optionalPersonal2: z.string().optional(),
  optionalPersonal3: z.string().optional(),
  optionalPersonal4: z.string().optional(),
  optionalPersonal5: z.string().optional(),

  deptOptional1: z.string().optional(),
  deptOptional2: z.string().optional(),
  deptOptional3: z.string().optional(),

  // Legacy keys still present in the current UI (safe to keep optional)
  schoolEmail: z.string().email().optional(),
  phone: z.string().optional(),
  facebookLink: z.string().url().optional(),
  currentAddress: z.string().optional(),
  transport: z.string().optional(),
  healthIssues: z.string().optional(),
  strengthsWeaknesses: z.string().optional(),
  specialSkills: z.string().optional(),
  portraitPhoto: z.any().optional(),
  impression: z.string().optional(),
  experience: z.string().optional(),
  extrovert: z.string().optional(),
  teamwork: z.string().optional(),
  deptQuestion1: z.string().optional(),
  deptQuestion2: z.string().optional(),
});

// Strict schema for the server action (only new template-driven submissions should pass).
export const ApplicationFormSubmissionStrictSchema = z.object({
  templateId: z.string().min(1, "Missing templateId"),

  fullName: z.string().min(2, "Tên phải có ít nhất 2 ký tự."),
  birthDate: z.string().min(1, "Ngày sinh không hợp lệ."),
  className: z.string().min(1, "Lớp không hợp lệ."),
  studentId: z.string().min(1, "MSSV không hợp lệ."),
  email: z.string().email("Email không hợp lệ."),
  gender: genderEnum,
  department: departmentEnum,

  // Photo is optional. If provided, it must be a File-like object with arrayBuffer().
  photo: z
    .any()
    .optional()
    .refine((v) => v == null || typeof (v as any).arrayBuffer === "function", {
      message: "Invalid photo file.",
    }),

  optionalPersonal1: z.string().optional(),
  optionalPersonal2: z.string().optional(),
  optionalPersonal3: z.string().optional(),
  optionalPersonal4: z.string().optional(),
  optionalPersonal5: z.string().optional(),

  deptOptional1: z.string().optional(),
  deptOptional2: z.string().optional(),
  deptOptional3: z.string().optional(),
});

export type ApplicationFormState = {
  message: string;
  issues?: string[];
  fields?: Record<string, string>;
} | null;
