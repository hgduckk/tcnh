import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import { ACTIVITY_SELECT_COLUMNS, mapActivityRow } from "@/lib/activities";
import { serializeError } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const LEGACY_ACTIVITY_SELECT_COLUMNS =
  "id, name, description, images, activity_type, is_published, display_order, created_at, updated_at";

export async function GET() {
  try {
    const db = supabaseAdmin ?? supabase;

    if (!db) {
      return NextResponse.json({ success: false, message: "Supabase not configured." }, { status: 500 });
    }

    let { data, error } = await db
      .from("activities")
      .select(ACTIVITY_SELECT_COLUMNS)
      .eq("is_published", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    // Backward compatibility: old DB schema may not include new columns.
    if (error && (error as any)?.code === "42703") {
      const fallback = await db
        .from("activities")
        .select(LEGACY_ACTIVITY_SELECT_COLUMNS)
        .eq("is_published", true)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });

      data = fallback.data;
      error = fallback.error;
    }

    if (error) throw error;

    return NextResponse.json({ success: true, data: (data || []).map(mapActivityRow) }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (e) {
    return NextResponse.json({ success: false, message: serializeError(e) }, { status: 500 });
  }
}
