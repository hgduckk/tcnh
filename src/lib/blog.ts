export type UserRole = "user" | "admin";

export type AlumniTestimonialRow = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  positions: string[];
  message: string;
  is_published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type AlumniTestimonialInput = {
  id?: string;
  fullName: string;
  avatarUrl?: string;
  positions: string[];
  message: string;
  isPublished?: boolean;
  displayOrder?: number;
};

export type BlogCommentRow = {
  id: string;
  name: string | null;
  comment: string;
  parent_id: string | null;
  is_anonymous: boolean;
  author_role: UserRole;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type BlogCommentInput = {
  name?: string;
  comment: string;
  parentId?: string;
  isAnonymous?: boolean;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value.trim());
}

function toStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
}

export const TESTIMONIAL_SELECT_COLUMNS =
  "id, full_name, avatar_url, positions, message, is_published, display_order, created_at, updated_at";

export function mapTestimonialRow(input: any): AlumniTestimonialRow {
  return {
    id: String(input?.id ?? ""),
    full_name: String(input?.full_name ?? ""),
    avatar_url: input?.avatar_url ? String(input.avatar_url) : null,
    positions: toStringArray(input?.positions),
    message: String(input?.message ?? ""),
    is_published: Boolean(input?.is_published),
    display_order: Number.isFinite(Number(input?.display_order)) ? Number(input.display_order) : 0,
    created_at: String(input?.created_at ?? ""),
    updated_at: String(input?.updated_at ?? ""),
  };
}

export function normalizeTestimonialInput(input: any): AlumniTestimonialInput {
  const positions = Array.isArray(input?.positions)
    ? toStringArray(input.positions)
    : String(input?.positions ?? "")
        .split(/\r?\n/)
        .map((v) => v.trim())
        .filter(Boolean);

  return {
    id: isUuid(input?.id) ? String(input.id).trim() : undefined,
    fullName: String(input?.fullName ?? input?.full_name ?? "").trim(),
    avatarUrl: String(input?.avatarUrl ?? input?.avatar_url ?? "").trim() || undefined,
    positions,
    message: String(input?.message ?? "").trim(),
    isPublished: input?.isPublished === undefined ? true : Boolean(input.isPublished),
    displayOrder:
      Number.isFinite(Number(input?.displayOrder)) && Number(input.displayOrder) >= 0
        ? Number(input.displayOrder)
        : 0,
  };
}

export function testimonialInputToDb(input: AlumniTestimonialInput) {
  return {
    full_name: input.fullName,
    avatar_url: input.avatarUrl || null,
    positions: input.positions,
    message: input.message,
    is_published: input.isPublished !== false,
    display_order: Number.isFinite(input.displayOrder) ? Number(input.displayOrder) : 0,
  };
}

export const BLOG_COMMENT_SELECT_COLUMNS =
  "id, name, comment, parent_id, is_anonymous, author_role, is_published, created_at, updated_at";

export function mapBlogCommentRow(input: any): BlogCommentRow {
  return {
    id: String(input?.id ?? ""),
    name: input?.name ? String(input.name) : null,
    comment: String(input?.comment ?? ""),
    parent_id: input?.parent_id ? String(input.parent_id) : null,
    is_anonymous: Boolean(input?.is_anonymous),
    author_role: input?.author_role === "admin" ? "admin" : "user",
    is_published: Boolean(input?.is_published),
    created_at: String(input?.created_at ?? ""),
    updated_at: String(input?.updated_at ?? ""),
  };
}

export function normalizeBlogCommentInput(input: any): BlogCommentInput {
  return {
    name: String(input?.name ?? "").trim() || undefined,
    comment: String(input?.comment ?? "").trim(),
    parentId: isUuid(input?.parentId ?? input?.parent_id)
      ? String(input?.parentId ?? input?.parent_id).trim()
      : undefined,
    isAnonymous: Boolean(input?.isAnonymous ?? input?.is_anonymous),
  };
}
