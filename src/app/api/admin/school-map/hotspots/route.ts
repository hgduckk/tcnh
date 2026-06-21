import { NextResponse } from "next/server";
import { assertAdminRequest } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import {
  mapSchoolMapHotspotRow,
  schoolMapHotspotInputToDb,
  SCHOOL_MAP_HOTSPOT_SELECT_COLUMNS,
} from "@/lib/schoolMap";
import { serializeError } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const authError = assertAdminRequest(req);
    if (authError) return authError;

    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, message: "Supabase admin client not configured." }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from("school_map_hotspots")
      .select(SCHOOL_MAP_HOTSPOT_SELECT_COLUMNS)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: (data || []).map(mapSchoolMapHotspotRow) });
  } catch (e) {
    return NextResponse.json({ success: false, message: serializeError(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authError = assertAdminRequest(req);
    if (authError) return authError;

    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, message: "Supabase admin client not configured." }, { status: 500 });
    }

    const body = await req.json();
    const id = String(body?.id || "").trim();
    const payload = schoolMapHotspotInputToDb(body);

    if (!payload.scene_node_id) {
      return NextResponse.json({ success: false, message: "Missing scene node." }, { status: 400 });
    }

    const { data: sceneNode, error: sceneNodeError } = await supabaseAdmin
      .from("school_map_nodes")
      .select("id, image_url")
      .eq("id", payload.scene_node_id)
      .single();

    if (sceneNodeError) throw sceneNodeError;

    if (!String(sceneNode?.image_url || "").trim()) {
      return NextResponse.json(
        { success: false, message: "Scene must include an image before creating hotspots." },
        { status: 400 }
      );
    }

    if (!payload.label) {
      return NextResponse.json({ success: false, message: "Missing hotspot label." }, { status: 400 });
    }

    if (payload.action_type === "navigate" && !payload.target_node_id) {
      return NextResponse.json({ success: false, message: "Navigate hotspot must include target node." }, { status: 400 });
    }

    if (payload.action_type === "info" && !payload.description) {
      return NextResponse.json({ success: false, message: "Info hotspot must include description." }, { status: 400 });
    }

    if (id) {
      const { data, error } = await supabaseAdmin
        .from("school_map_hotspots")
        .upsert({ ...payload, id }, { onConflict: "id" })
        .select(SCHOOL_MAP_HOTSPOT_SELECT_COLUMNS)
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data: mapSchoolMapHotspotRow(data) });
    }

    const { data, error } = await supabaseAdmin
      .from("school_map_hotspots")
      .insert(payload)
      .select(SCHOOL_MAP_HOTSPOT_SELECT_COLUMNS)
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: mapSchoolMapHotspotRow(data) });
  } catch (e) {
    return NextResponse.json({ success: false, message: serializeError(e) }, { status: 500 });
  }
}
