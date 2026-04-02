import { NextResponse } from "next/server";
import { assertAdminRequest } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import { serializeError } from "@/lib/utils";

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authError = assertAdminRequest(req);
    if (authError) return authError;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, message: "Supabase admin client not configured." },
        { status: 500 }
      );
    }

    const { id: rawId } = await context.params;
    const id = String(rawId || "").trim();
    const body = await req.json();

    if (!id) {
      return NextResponse.json({ success: false, message: "Missing comment id." }, { status: 400 });
    }

    if (body?.isPublished === undefined) {
      return NextResponse.json({ success: false, message: "Missing isPublished flag." }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("comments")
      .update({ is_published: Boolean(body.isPublished) })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, message: serializeError(e) }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authError = assertAdminRequest(req);
    if (authError) return authError;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, message: "Supabase admin client not configured." },
        { status: 500 }
      );
    }

    const { id: rawId } = await context.params;
    const id = String(rawId || "").trim();

    if (!id) {
      return NextResponse.json({ success: false, message: "Missing comment id." }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("comments").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, message: serializeError(e) }, { status: 500 });
  }
}
