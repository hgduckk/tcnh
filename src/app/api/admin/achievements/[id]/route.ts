import { NextResponse } from "next/server";
import { assertAdminRequest } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import { serializeError } from "@/lib/utils";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const authError = assertAdminRequest(req);
    if (authError) return authError;

    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, message: "Supabase admin client not configured." }, { status: 500 });
    }

    const id = String(params.id || "").trim();
    if (!id) {
      return NextResponse.json({ success: false, message: "Missing achievement id." }, { status: 400 });
    }

    // Delete image from Storage (ignore if doesn't exist)
    await supabaseAdmin.storage
      .from("achievements")
      .remove([`${id}/image.webp`])
      .catch(() => {
        // Silently ignore if file doesn't exist
      });

    // Delete record from database
    const { error } = await supabaseAdmin.from("achievements").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, message: serializeError(e) }, { status: 500 });
  }
}
