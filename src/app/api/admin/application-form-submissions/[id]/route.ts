import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import { assertAdminRequest } from "@/lib/adminAuth";
import { serializeError } from "@/lib/utils";

const VALID_STATUSES = ["not_selected", "accepted", "undecided", "rejected"] as const;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authError = assertAdminRequest(req);
    if (authError) return authError;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, message: "Supabase admin client not configured." },
        { status: 500 },
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Missing submission ID." },
        { status: 400 },
      );
    }

    const body = await req.json();
    const updateData: Record<string, string> = {};

    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json(
          { success: false, message: "Invalid status value." },
          { status: 400 },
        );
      }
      updateData.status = body.status;
    }

    if (body.standing_committee_comment !== undefined) {
      updateData.standing_committee_comment = String(body.standing_committee_comment);
    }

    if (body.board_comment !== undefined) {
      updateData.board_comment = String(body.board_comment);
    }
  const newFields = [
      'phone_number', 'facebook_link', 'current_address', 
      'transportation', 'health_note', 'strengths_weaknesses', 'special_skills'
    ];

    newFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = String(body[field]);
      }
    });

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, message: "No fields to update." }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("application_form_submissions")
      .update(updateData)
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, message: serializeError(e) }, { status: 500 });
  }
}
