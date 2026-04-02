import { NextResponse } from "next/server";
import { assertAdminRequest } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import { serializeError } from "@/lib/utils";

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authError = assertAdminRequest(req);
    if (authError) return authError;

    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, message: "Supabase admin client not configured." }, { status: 500 });
    }

    const { id: rawId } = await context.params;
    const id = String(rawId || "").trim();
    if (!id) {
      return NextResponse.json({ success: false, message: "Missing activity id." }, { status: 400 });
    }

    // Delete all images from Storage for this activity (ignore if doesn't exist)
    try {
      const { data: files } = await supabaseAdmin.storage
        .from("activities")
        .list(id);

      if (files && files.length > 0) {
        const filePaths = files.map(f => `${id}/${f.name}`);
        await supabaseAdmin.storage
          .from("activities")
          .remove(filePaths);
      }
    } catch {
      // Silently ignore if folder doesn't exist
    }

    // Delete record from database
    const { error } = await supabaseAdmin.from("activities").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, message: serializeError(e) }, { status: 500 });
  }
}
