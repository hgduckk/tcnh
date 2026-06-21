import { NextResponse } from "next/server";
import { assertAdminRequest } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import {
  mapTestimonialRow,
  normalizeTestimonialInput,
  testimonialInputToDb,
  TESTIMONIAL_SELECT_COLUMNS,
} from "@/lib/blog";
import { serializeError } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const authError = assertAdminRequest(req);
    if (authError) return authError;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, message: "Supabase admin client not configured." },
        { status: 500 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("alumni_testimonials")
      .select(TESTIMONIAL_SELECT_COLUMNS)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: (data || []).map(mapTestimonialRow) });
  } catch (e) {
    return NextResponse.json({ success: false, message: serializeError(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authError = assertAdminRequest(req);
    if (authError) return authError;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, message: "Supabase admin client not configured." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const normalized = normalizeTestimonialInput(body);

    if (!normalized.fullName) {
      return NextResponse.json({ success: false, message: "Missing full name." }, { status: 400 });
    }

    if (!normalized.message) {
      return NextResponse.json({ success: false, message: "Missing testimonial message." }, { status: 400 });
    }

    const payload = {
      ...testimonialInputToDb(normalized),
      ...(normalized.id ? { id: normalized.id } : {}),
    };

    if (normalized.id) {
      const { data, error } = await supabaseAdmin
        .from("alumni_testimonials")
        .upsert(payload, { onConflict: "id" })
        .select(TESTIMONIAL_SELECT_COLUMNS)
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data: mapTestimonialRow(data) });
    }

    const { data, error } = await supabaseAdmin
      .from("alumni_testimonials")
      .insert(payload)
      .select(TESTIMONIAL_SELECT_COLUMNS)
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: mapTestimonialRow(data) });
  } catch (e) {
    return NextResponse.json({ success: false, message: serializeError(e) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const authError = assertAdminRequest(req);
    if (authError) return authError;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, message: "Supabase admin client not configured." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const orders = Array.isArray(body) ? body : body.orders;

    if (!Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json({ success: false, message: "Invalid orders array." }, { status: 400 });
    }

    for (const [index, item] of orders.entries()) {
      const id = String(item?.id || "").trim();
      if (!id) continue;

      const { error } = await supabaseAdmin
        .from("alumni_testimonials")
        .update({ display_order: index })
        .eq("id", id);

      if (error) throw error;
    }

    const { data, error } = await supabaseAdmin
      .from("alumni_testimonials")
      .select(TESTIMONIAL_SELECT_COLUMNS)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: (data || []).map(mapTestimonialRow) });
  } catch (e) {
    return NextResponse.json({ success: false, message: serializeError(e) }, { status: 500 });
  }
}
