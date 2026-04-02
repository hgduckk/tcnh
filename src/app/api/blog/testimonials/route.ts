import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import { mapTestimonialRow, TESTIMONIAL_SELECT_COLUMNS } from "@/lib/blog";
import { serializeError } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const db = supabaseAdmin ?? supabase;

    if (!db) {
      return NextResponse.json({ success: false, message: "Supabase not configured." }, { status: 500 });
    }

    const { data, error } = await db
      .from("alumni_testimonials")
      .select(TESTIMONIAL_SELECT_COLUMNS)
      .eq("is_published", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(
      { success: true, data: (data || []).map(mapTestimonialRow) },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (e) {
    return NextResponse.json({ success: false, message: serializeError(e) }, { status: 500 });
  }
}
