import { NextResponse } from "next/server";
import { assertAdminRequest } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import { mapYouthRow, normalizeYouthInput, youthInputToDb, YOUTH_SELECT_COLUMNS } from "@/lib/youth";
import { serializeError } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const authError = assertAdminRequest(req);
    if (authError) return authError;

    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, message: "Supabase admin client not configured." }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from("youth_items")
      .select(YOUTH_SELECT_COLUMNS)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: (data || []).map(mapYouthRow) });
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
    const normalized = normalizeYouthInput(body);

    if (!normalized.name) {
      return NextResponse.json({ success: false, message: "Missing youth item name." }, { status: 400 });
    }

    if (normalized.targetHref && !normalized.targetHref.startsWith("/youth")) {
      return NextResponse.json({ success: false, message: "targetHref must start with /youth" }, { status: 400 });
    }

    if (normalized.launchStatus === "active" && !normalized.targetHref) {
      return NextResponse.json(
        { success: false, message: "Active item must include targetHref." },
        { status: 400 }
      );
    }

    const payload = {
      ...youthInputToDb(normalized),
      ...(normalized.id ? { id: normalized.id } : {}),
    };

    if (normalized.id) {
      const { data, error } = await supabaseAdmin
        .from("youth_items")
        .upsert(payload, { onConflict: "id" })
        .select(YOUTH_SELECT_COLUMNS)
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data: mapYouthRow(data) });
    }

    const { data, error } = await supabaseAdmin
      .from("youth_items")
      .insert(payload)
      .select(YOUTH_SELECT_COLUMNS)
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: mapYouthRow(data) });
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

    for (const [index, item] of orders.entries()) {
      const { error } = await supabaseAdmin
        .from("youth_items")
        .update({ display_order: index })
        .eq("id", item.id);

      if (error) throw error;
    }

    const { data, error } = await supabaseAdmin
      .from("youth_items")
      .select(YOUTH_SELECT_COLUMNS)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: (data || []).map(mapYouthRow) });
  } catch (e) {
    return NextResponse.json({ success: false, message: serializeError(e) }, { status: 500 });
  }
}
