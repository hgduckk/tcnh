export const ACTIVITY_TYPES = ["category", "program"] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const DEFAULT_ACTIVITY_TYPE: ActivityType = "program";

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  category: "Chuyên mục",
  program: "Chương trình",
};

export const ACTIVITY_SELECT_COLUMNS =
  "id, name, description, images, activity_type, is_published, display_order, created_at, updated_at";

export type ActivityRow = {
  id: string;
  name: string;
  description: string;
  images: string[];
  activity_type: ActivityType;
  is_published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type ActivityInput = {
  id?: string;
  name: string;
  description: string;
  images: string[];
  activityType?: ActivityType;
  isPublished?: boolean;
  displayOrder?: number;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeActivityType(value: unknown): ActivityType {
  return value === "category" ? "category" : DEFAULT_ACTIVITY_TYPE;
}

function normalizeImages(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((img: unknown) => String(img ?? "").trim()).filter((img: string) => img)
    : [];
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value.trim());
}

export function mapActivityRow(input: any): ActivityRow {
  return {
    id: String(input?.id ?? "").trim(),
    name: String(input?.name ?? "").trim(),
    description: String(input?.description ?? "").trim(),
    images: normalizeImages(input?.images),
    activity_type: normalizeActivityType(input?.activity_type),
    is_published: Boolean(input?.is_published),
    display_order:
      Number.isFinite(Number(input?.display_order)) && Number(input.display_order) >= 0
        ? Number(input.display_order)
        : 0,
    created_at: String(input?.created_at ?? ""),
    updated_at: String(input?.updated_at ?? ""),
  };
}

export function normalizeActivityInput(input: any): ActivityInput {
  return {
    id: isUuid(input?.id) ? String(input.id).trim() : undefined,
    name: String(input?.name ?? "").trim(),
    description: String(input?.description ?? "").trim(),
    images: normalizeImages(input?.images),
    activityType: normalizeActivityType(input?.activityType ?? input?.activity_type),
    isPublished: input?.isPublished === undefined ? true : Boolean(input.isPublished),
    displayOrder:
      Number.isFinite(Number(input?.displayOrder)) && Number(input.displayOrder) >= 0
        ? Number(input.displayOrder)
        : 0,
  };
}

export function activityInputToDb(input: ActivityInput) {
  return {
    name: input.name,
    description: input.description,
    images: input.images,
    activity_type: normalizeActivityType(input.activityType),
    is_published: input.isPublished !== false,
    display_order: Number.isFinite(input.displayOrder) ? Number(input.displayOrder) : 0,
  };
}
