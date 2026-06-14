export type AchievementRow = {
  id: string;
  title: string;
  image_url: string;
  is_published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type AchievementInput = {
  id?: string;
  title: string;
  imageUrl: string;
  isPublished?: boolean;
  displayOrder?: number;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value.trim());
}

export function normalizeAchievementInput(input: any): AchievementInput {
  return {
    id: isUuid(input?.id) ? String(input.id).trim() : undefined,
    title: String(input?.title ?? "").trim(),
    imageUrl: String(input?.imageUrl ?? "").trim(),
    isPublished: input?.isPublished === undefined ? true : Boolean(input.isPublished),
    displayOrder:
      Number.isFinite(Number(input?.displayOrder)) && Number(input.displayOrder) >= 0
        ? Number(input.displayOrder)
        : 0,
  };
}

export function achievementInputToDb(input: AchievementInput) {
  return {
    title: input.title,
    image_url: input.imageUrl,
    is_published: input.isPublished !== false,
    display_order: Number.isFinite(input.displayOrder) ? Number(input.displayOrder) : 0,
  };
}
