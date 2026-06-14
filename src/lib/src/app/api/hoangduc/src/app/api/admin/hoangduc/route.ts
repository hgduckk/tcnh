import { NextResponse } from "next/server";
import { assertAdminRequest } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import { mapHoangDucRow, normalizeHoangDucInput, hoangDucInputToDb, HOANG_DUC_SELECT_COLUMNS } from "@/lib/hoangduc";
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
      .from("hoang_duc_items")
      .select(HOANG_DUC_SELECT_COLUMNS)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: (data || []).map(mapHoangDucRow) });
  } catch (e) {
    return NextResponse.json(
      { success: false, message: serializeError(e) },
      { status: 500 }
    );
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
    const normalized = normalizeHoangDucInput(body);

    if (!normalized.name) {
      return NextResponse.json(
        { success: false, message: "Missing name." },
        { status: 400 }
      );
    }

    const payload = {
      ...hoangDucInputToDb(normalized),
      ...(normalized.id ? { id: normalized.id } : {}),
    };

    let result;
    if (normalized.id) {
      result = await supabaseAdmin.from("hoang_duc_items").update(payload).eq("id", normalized.id).select();
    } else {
      result = await supabaseAdmin.from("hoang_duc_items").insert([payload]).select();
    }

    if (result.error) throw result.error;

    return NextResponse.json({
      success: true,
      data: result.data?.[0] ? mapHoangDucRow(result.data[0]) : null,
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, message: serializeError(e) },
      { status: 500 }
    );
  }
}