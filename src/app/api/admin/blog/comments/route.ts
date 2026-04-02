import { NextResponse } from "next/server";
import { assertAdminRequest } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import {
  BLOG_COMMENT_SELECT_COLUMNS,
  mapBlogCommentRow,
  normalizeBlogCommentInput,
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
      .from("comments")
      .select(BLOG_COMMENT_SELECT_COLUMNS)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: (data || []).map(mapBlogCommentRow) });
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
    const input = normalizeBlogCommentInput(body);

    if (!input.comment) {
      return NextResponse.json({ success: false, message: "Missing comment content." }, { status: 400 });
    }

    if (!input.parentId) {
      return NextResponse.json({ success: false, message: "Missing parent comment id." }, { status: 400 });
    }

    const payload = {
      name: String(body?.name || "Admin").trim() || "Admin",
      comment: input.comment,
      parent_id: input.parentId,
      is_anonymous: false,
      author_role: "admin",
      is_published: true,
    };

    const { data, error } = await supabaseAdmin
      .from("comments")
      .insert(payload)
      .select(BLOG_COMMENT_SELECT_COLUMNS)
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: mapBlogCommentRow(data) });
  } catch (e) {
    return NextResponse.json({ success: false, message: serializeError(e) }, { status: 500 });
  }
}
