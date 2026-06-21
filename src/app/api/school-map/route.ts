import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import {
  mapSchoolMapHotspotRow,
  mapSchoolMapNodeRow,
  SCHOOL_MAP_HOTSPOT_SELECT_COLUMNS,
  SCHOOL_MAP_NODE_SELECT_COLUMNS,
} from "@/lib/schoolMap";
import { serializeError } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const db = supabaseAdmin ?? supabase;

    if (!db) {
      return NextResponse.json({ success: false, message: "Supabase not configured." }, { status: 500 });
    }

    const [nodesRes, hotspotsRes] = await Promise.all([
      db
        .from("school_map_nodes")
        .select(SCHOOL_MAP_NODE_SELECT_COLUMNS)
        .eq("is_published", true)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false }),
      db
        .from("school_map_hotspots")
        .select(SCHOOL_MAP_HOTSPOT_SELECT_COLUMNS)
        .eq("is_published", true)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false }),
    ]);

    if (nodesRes.error) throw nodesRes.error;
    if (hotspotsRes.error) throw hotspotsRes.error;

    return NextResponse.json(
      {
        success: true,
        data: {
          nodes: (nodesRes.data || []).map(mapSchoolMapNodeRow),
          hotspots: (hotspotsRes.data || []).map(mapSchoolMapHotspotRow),
        },
      },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (e) {
    return NextResponse.json({ success: false, message: serializeError(e) }, { status: 500 });
  }
}
