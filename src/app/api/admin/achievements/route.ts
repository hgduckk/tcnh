import { NextResponse } from "next/server";
import { assertAdminRequest } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import { achievementInputToDb, normalizeAchievementInput } from "@/lib/achievements";
import { serializeError } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const authError = assertAdminRequest(req);
    if (authError) return authError;

    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, message: "Supabase admin client not configured." }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from("achievements")
      .select("id, title, image_url, is_published, display_order, created_at, updated_at")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] });
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
    const normalized = normalizeAchievementInput(body);

    if (!normalized.title) {
      return NextResponse.json({ success: false, message: "Missing title." }, { status: 400 });
    }

    const payload = achievementInputToDb(normalized);

    if (normalized.id) {
      const { data, error } = await supabaseAdmin
        .from("achievements")
        .update(payload)
        .eq("id", normalized.id)
        .select("id, title, image_url, is_published, display_order, created_at, updated_at")
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    const { data, error } = await supabaseAdmin
      .from("achievements")
      .insert(payload)
      .select("id, title, image_url, is_published, display_order, created_at, updated_at")
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (e) {
    return NextResponse.json({ success: false, message: serializeError(e) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const authError = assertAdminRequest(req);
    if (authError) return authError;

    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, message: "Supabase admin client not configured." }, { status: 500 });
    }

    const body = await req.json();
    const orders = Array.isArray(body) ? body : body.orders;

    if (!Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json({ success: false, message: "Invalid orders array." }, { status: 400 });
    }

    // Update display_order for each achievement in the array
    const updates = orders.map((item: any, index: number) => ({
      id: item.id,
      displayOrder: index,
    }));

    // Execute updates sequentially
    for (const { id, displayOrder } of updates) {
      const { error } = await supabaseAdmin
        .from("achievements")
        .update({ display_order: displayOrder })
        .eq("id", id);

      if (error) throw error;
    }

    // Return updated list
    const { data, error: fetchError } = await supabaseAdmin
      .from("achievements")
      .select("id, title, image_url, is_published, display_order, created_at, updated_at")
      .order("display_order", { ascending: true });

    if (fetchError) throw fetchError;

    return NextResponse.json({ success: true, data });
  } catch (e) {
    return NextResponse.json({ success: false, message: serializeError(e) }, { status: 500 });
  }
}
