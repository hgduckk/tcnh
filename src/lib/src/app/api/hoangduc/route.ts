import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import { mapHoangDucRow, HOANG_DUC_SELECT_COLUMNS } from "@/lib/hoangduc";
import { serializeError } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const db = supabaseAdmin ?? supabase;

    if (!db) {
      return NextResponse.json(
        { success: false, message: "Supabase not configured." },
        { status: 500 }
      );
    }

    const { data, error } = await db
      .from("hoang_duc_items")
      .select(HOANG_DUC_SELECT_COLUMNS)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(
      { success: true, data: (data || []).map(mapHoangDucRow) },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (e) {
    return NextResponse.json(
      { success: false, message: serializeError(e) },
      { status: 500 }
    );
  }
}