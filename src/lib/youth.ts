export const YOUTH_SELECT_COLUMNS =
  "id, name, subtitle, icon_url, target_href, launch_status, is_published, display_order, created_at, updated_at";

export const YOUTH_LAUNCH_STATUSES = ["active", "coming_soon", "ended"] as const;
export type YouthLaunchStatus = (typeof YOUTH_LAUNCH_STATUSES)[number];

export type YouthRow = {
  id: string;
  name: string;
  subtitle: string;
  icon_url: string;
  target_href: string;
  launch_status: YouthLaunchStatus;
  is_published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type YouthInput = {
  id?: string;
  name: string;
  subtitle?: string;
  iconUrl?: string;
  targetHref?: string;
  launchStatus?: YouthLaunchStatus;
  isPublished?: boolean;
  displayOrder?: number;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const YOUTH_TARGET_LINK_OPTIONS = [
  { value: "/youth/a80", label: "Rang Ro Viet Nam" },
  { value: "/youth/school-map", label: "UEL Campus Map" },
  { value: "/youth/document-format", label: "The Thuc Van Ban" },
];

function normalizeLaunchStatus(value: unknown): YouthLaunchStatus {
  if (value === "ended") return "ended";
  return value === "coming_soon" ? "coming_soon" : "active";
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value.trim());
}

export function mapYouthRow(input: any): YouthRow {
  return {
    id: String(input?.id ?? "").trim(),
    name: String(input?.name ?? "").trim(),
    subtitle: String(input?.subtitle ?? "").trim(),
    icon_url: String(input?.icon_url ?? "").trim(),
    target_href: String(input?.target_href ?? "").trim(),
    launch_status: normalizeLaunchStatus(input?.launch_status),
    is_published: Boolean(input?.is_published),
    display_order:
      Number.isFinite(Number(input?.display_order)) && Number(input.display_order) >= 0
        ? Number(input.display_order)
        : 0,
    created_at: String(input?.created_at ?? ""),
    updated_at: String(input?.updated_at ?? ""),
  };
}

export function normalizeYouthInput(input: any): YouthInput {
  return {
    id: isUuid(input?.id) ? String(input.id).trim() : undefined,
    name: String(input?.name ?? "").trim(),
    subtitle: String(input?.subtitle ?? "").trim(),
    iconUrl: String(input?.iconUrl ?? input?.icon_url ?? "").trim(),
    targetHref: String(input?.targetHref ?? input?.target_href ?? "").trim(),
    launchStatus: normalizeLaunchStatus(input?.launchStatus ?? input?.launch_status),
    isPublished: input?.isPublished === undefined ? true : Boolean(input.isPublished),
    displayOrder:
      Number.isFinite(Number(input?.displayOrder)) && Number(input.displayOrder) >= 0
        ? Number(input.displayOrder)
        : 0,
  };
}

export function youthInputToDb(input: YouthInput) {
  return {
    name: input.name,
    subtitle: String(input.subtitle ?? "").trim(),
    icon_url: String(input.iconUrl ?? "").trim(),
    target_href: String(input.targetHref ?? "").trim(),
    launch_status: normalizeLaunchStatus(input.launchStatus),
    is_published: input.isPublished !== false,
    display_order: Number.isFinite(input.displayOrder) ? Number(input.displayOrder) : 0,
  };
}
