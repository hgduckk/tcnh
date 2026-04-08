export const SCHOOL_MAP_NODE_TYPES = ["overview", "building", "floor", "room"] as const;
export type SchoolMapNodeType = (typeof SCHOOL_MAP_NODE_TYPES)[number];

export const SCHOOL_MAP_HOTSPOT_ACTIONS = ["navigate", "info"] as const;
export type SchoolMapHotspotAction = (typeof SCHOOL_MAP_HOTSPOT_ACTIONS)[number];

export const SCHOOL_MAP_NODE_SELECT_COLUMNS = [
  "id",
  "parent_id",
  "node_type",
  "name",
  "code",
  "function_text",
  "description",
  "image_url",
  "image_alt",
  "is_published",
  "display_order",
  "created_at",
  "updated_at",
].join(", ");

export const SCHOOL_MAP_HOTSPOT_SELECT_COLUMNS = [
  "id",
  "scene_node_id",
  "target_node_id",
  "label",
  "action_type",
  "x_percent",
  "y_percent",
  "description",
  "is_published",
  "display_order",
  "created_at",
  "updated_at",
].join(", ");

export type SchoolMapNodeRow = {
  id: string;
  parent_id: string | null;
  node_type: SchoolMapNodeType;
  name: string;
  code: string;
  function_text: string;
  description: string;
  image_url: string;
  image_alt: string;
  is_published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type SchoolMapHotspotRow = {
  id: string;
  scene_node_id: string;
  target_node_id: string | null;
  label: string;
  action_type: SchoolMapHotspotAction;
  x_percent: number;
  y_percent: number;
  description: string;
  is_published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

function normalizeNodeType(value: unknown): SchoolMapNodeType {
  if (value === "building" || value === "floor" || value === "room") return value;
  return "overview";
}

function normalizeActionType(value: unknown): SchoolMapHotspotAction {
  return value === "info" ? "info" : "navigate";
}

function normalizePercent(value: unknown, fallback = 50): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed < 0) return 0;
  if (parsed > 100) return 100;
  return Math.round(parsed * 100) / 100;
}

export function mapSchoolMapNodeRow(input: any): SchoolMapNodeRow {
  return {
    id: String(input?.id ?? "").trim(),
    parent_id: input?.parent_id ? String(input.parent_id).trim() : null,
    node_type: normalizeNodeType(input?.node_type),
    name: String(input?.name ?? "").trim(),
    code: String(input?.code ?? "").trim(),
    function_text: String(input?.function_text ?? "").trim(),
    description: String(input?.description ?? "").trim(),
    image_url: String(input?.image_url ?? "").trim(),
    image_alt: String(input?.image_alt ?? "").trim(),
    is_published: Boolean(input?.is_published),
    display_order:
      Number.isFinite(Number(input?.display_order)) && Number(input?.display_order) >= 0
        ? Number(input.display_order)
        : 0,
    created_at: String(input?.created_at ?? ""),
    updated_at: String(input?.updated_at ?? ""),
  };
}

export function mapSchoolMapHotspotRow(input: any): SchoolMapHotspotRow {
  return {
    id: String(input?.id ?? "").trim(),
    scene_node_id: String(input?.scene_node_id ?? "").trim(),
    target_node_id: input?.target_node_id ? String(input.target_node_id).trim() : null,
    label: String(input?.label ?? "").trim(),
    action_type: normalizeActionType(input?.action_type),
    x_percent: normalizePercent(input?.x_percent, 50),
    y_percent: normalizePercent(input?.y_percent, 50),
    description: String(input?.description ?? "").trim(),
    is_published: Boolean(input?.is_published),
    display_order:
      Number.isFinite(Number(input?.display_order)) && Number(input?.display_order) >= 0
        ? Number(input.display_order)
        : 0,
    created_at: String(input?.created_at ?? ""),
    updated_at: String(input?.updated_at ?? ""),
  };
}

export function schoolMapNodeInputToDb(input: any) {
  return {
    parent_id: input?.parentId ? String(input.parentId).trim() : null,
    node_type: normalizeNodeType(input?.nodeType ?? input?.node_type),
    name: String(input?.name ?? "").trim(),
    code: String(input?.code ?? "").trim(),
    function_text: String(input?.functionText ?? input?.function_text ?? "").trim(),
    description: String(input?.description ?? "").trim(),
    image_url: String(input?.imageUrl ?? input?.image_url ?? "").trim(),
    image_alt: String(input?.imageAlt ?? input?.image_alt ?? "").trim(),
    is_published: input?.isPublished === undefined ? true : Boolean(input.isPublished),
    display_order:
      Number.isFinite(Number(input?.displayOrder ?? input?.display_order)) &&
      Number(input?.displayOrder ?? input?.display_order) >= 0
        ? Number(input?.displayOrder ?? input?.display_order)
        : 0,
  };
}

export function schoolMapHotspotInputToDb(input: any) {
  return {
    scene_node_id: String(input?.sceneNodeId ?? input?.scene_node_id ?? "").trim(),
    target_node_id: input?.targetNodeId || input?.target_node_id ? String(input?.targetNodeId ?? input?.target_node_id).trim() : null,
    label: String(input?.label ?? "").trim(),
    action_type: normalizeActionType(input?.actionType ?? input?.action_type),
    x_percent: normalizePercent(input?.xPercent ?? input?.x_percent, 50),
    y_percent: normalizePercent(input?.yPercent ?? input?.y_percent, 50),
    description: String(input?.description ?? "").trim(),
    is_published: input?.isPublished === undefined ? true : Boolean(input.isPublished),
    display_order:
      Number.isFinite(Number(input?.displayOrder ?? input?.display_order)) &&
      Number(input?.displayOrder ?? input?.display_order) >= 0
        ? Number(input?.displayOrder ?? input?.display_order)
        : 0,
  };
}
