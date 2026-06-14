export type PartnerRow = {
  id: string;
  name: string;
  logo_url: string;
  is_published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type PartnerInput = {
  id?: string;
  name: string;
  logoUrl: string;
  isPublished?: boolean;
  displayOrder?: number;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value.trim());
}

export function normalizePartnerInput(input: any): PartnerInput {
  return {
    id: isUuid(input?.id) ? String(input.id).trim() : undefined,
    name: String(input?.name ?? "").trim(),
    logoUrl: String(input?.logoUrl ?? "").trim(),
    isPublished: input?.isPublished === undefined ? true : Boolean(input.isPublished),
    displayOrder:
      Number.isFinite(Number(input?.displayOrder)) && Number(input.displayOrder) >= 0
        ? Number(input.displayOrder)
        : 0,
  };
}

export function partnerInputToDb(input: PartnerInput) {
  return {
    name: input.name,
    logo_url: input.logoUrl,
    is_published: input.isPublished !== false,
    display_order: Number.isFinite(input.displayOrder) ? Number(input.displayOrder) : 0,
  };
}
