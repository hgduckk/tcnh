import { NextResponse } from "next/server";
import { assertAdminRequest } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import {
  mapSchoolMapNodeRow,
  schoolMapNodeInputToDb,
  SCHOOL_MAP_NODE_SELECT_COLUMNS,
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
      .from("school_map_nodes")
      .select(SCHOOL_MAP_NODE_SELECT_COLUMNS)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: (data || []).map(mapSchoolMapNodeRow) });
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
    const payload = schoolMapNodeInputToDb(body);

    if (!payload.name) {
      return NextResponse.json({ success: false, message: "Missing node name." }, { status: 400 });
    }

    if (payload.node_type === "overview") {
      payload.parent_id = null;
    }

    if (id) {
      const { data, error } = await supabaseAdmin
        .from("school_map_nodes")
        .upsert({ ...payload, id }, { onConflict: "id" })
        .select(SCHOOL_MAP_NODE_SELECT_COLUMNS)
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data: mapSchoolMapNodeRow(data) });
    }

    const { data, error } = await supabaseAdmin
      .from("school_map_nodes")
      .insert(payload)
      .select(SCHOOL_MAP_NODE_SELECT_COLUMNS)
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: mapSchoolMapNodeRow(data) });
  } catch (e) {
    return NextResponse.json({ success: false, message: serializeError(e) }, { status: 500 });
  }
}
