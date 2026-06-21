export type StructureDepartmentRow = {
  id: string;
  name: string;
  short_description: string;
  content: string;
  images: string[];
  is_published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type StructureDepartmentInput = {
  id?: string;
  name: string;
  shortDescription: string;
  content: string;
  images: string[];
  isPublished?: boolean;
  displayOrder?: number;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value.trim());
}

export function normalizeStructureDepartmentInput(input: any): StructureDepartmentInput {
  return {
    id: isUuid(input?.id) ? String(input.id).trim() : undefined,
    name: String(input?.name ?? "").trim(),
    shortDescription: String(input?.shortDescription ?? "").trim(),
    content: String(input?.content ?? "").trim(),
    images: Array.isArray(input?.images)
      ? input.images.map((img: any) => String(img ?? "").trim()).filter((img: string) => img)
      : [],
    isPublished: input?.isPublished === undefined ? true : Boolean(input.isPublished),
    displayOrder:
      Number.isFinite(Number(input?.displayOrder)) && Number(input.displayOrder) >= 0
        ? Number(input.displayOrder)
        : 0,
  };
}

export function structureDepartmentInputToDb(input: StructureDepartmentInput) {
  return {
    name: input.name,
    short_description: input.shortDescription,
    content: input.content,
    images: input.images,
    is_published: input.isPublished !== false,
    display_order: Number.isFinite(input.displayOrder) ? Number(input.displayOrder) : 0,
  };
}
