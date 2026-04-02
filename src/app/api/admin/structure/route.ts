import { NextResponse } from "next/server";
import { assertAdminRequest } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import {
  normalizeStructureDepartmentInput,
  structureDepartmentInputToDb,
} from "@/lib/structureDepartments";
import { serializeError } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const authError = assertAdminRequest(req);
    if (authError) return authError;

    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, message: "Supabase admin client not configured." }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from("structure_departments")
      .select("id, name, short_description, content, images, is_published, display_order, created_at, updated_at")
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
    const normalized = normalizeStructureDepartmentInput(body);

    if (!normalized.name) {
      return NextResponse.json({ success: false, message: "Missing department name." }, { status: 400 });
    }

    const payload = {
      ...structureDepartmentInputToDb(normalized),
      ...(normalized.id ? { id: normalized.id } : {}),
    };

    if (normalized.id) {
      const { data, error } = await supabaseAdmin
        .from("structure_departments")
        .upsert(payload, { onConflict: "id" })
        .select("id, name, short_description, content, images, is_published, display_order, created_at, updated_at")
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    const { data, error } = await supabaseAdmin
      .from("structure_departments")
      .insert(payload)
      .select("id, name, short_description, content, images, is_published, display_order, created_at, updated_at")
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

    for (const [index, item] of orders.entries()) {
      const { error } = await supabaseAdmin
        .from("structure_departments")
        .update({ display_order: index })
        .eq("id", item.id);

      if (error) throw error;
    }

    const { data, error } = await supabaseAdmin
      .from("structure_departments")
      .select("id, name, short_description, content, images, is_published, display_order, created_at, updated_at")
      .order("display_order", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (e) {
    return NextResponse.json({ success: false, message: serializeError(e) }, { status: 500 });
  }
}
