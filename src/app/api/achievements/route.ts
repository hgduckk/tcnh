import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { serializeError } from "@/lib/utils";

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json({ success: false, message: "Supabase not configured." }, { status: 500 });
    }

    const { data, error } = await supabase
      .from("achievements")
      .select("id, title, image_url, is_published, display_order, created_at, updated_at")
      .eq("is_published", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] }, {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
      },
    });
  } catch (e) {
    return NextResponse.json({ success: false, message: serializeError(e) }, { status: 500 });
  }
}
