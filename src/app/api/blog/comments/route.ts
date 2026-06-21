import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import {
  BLOG_COMMENT_SELECT_COLUMNS,
  mapBlogCommentRow,
  normalizeBlogCommentInput,
} from "@/lib/blog";
import { serializeError } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CommentNode = ReturnType<typeof mapBlogCommentRow> & { replies: CommentNode[] };

function toCommentTree(rows: ReturnType<typeof mapBlogCommentRow>[]): CommentNode[] {
  const map = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  for (const row of rows) {
    map.set(row.id, { ...row, replies: [] });
  }

  for (const row of rows) {
    const current = map.get(row.id);
    if (!current) continue;

    if (row.parent_id) {
      const parent = map.get(row.parent_id);
      if (parent) {
        parent.replies.push(current);
      }
      continue;
    }

    roots.push(current);
  }

  for (const root of roots) {
    root.replies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  roots.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return roots;
}

export async function GET() {
  try {
    const db = supabaseAdmin ?? supabase;

    if (!db) {
      return NextResponse.json({ success: false, message: "Supabase not configured." }, { status: 500 });
    }

    const { data, error } = await db
      .from("comments")
      .select(BLOG_COMMENT_SELECT_COLUMNS)
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const mapped = (data || []).map(mapBlogCommentRow);
    return NextResponse.json({ success: true, data: toCommentTree(mapped) });
  } catch (e) {
    return NextResponse.json({ success: false, message: serializeError(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const db = supabaseAdmin ?? supabase;

    if (!db) {
      return NextResponse.json({ success: false, message: "Supabase not configured." }, { status: 500 });
    }

    const body = await req.json();
    const input = normalizeBlogCommentInput(body);

    if (!input.comment) {
      return NextResponse.json({ success: false, message: "Missing comment content." }, { status: 400 });
    }

    if (!input.isAnonymous && !input.name) {
      return NextResponse.json({ success: false, message: "Missing commenter name." }, { status: 400 });
    }

    const payload = {
      name: input.isAnonymous ? null : input.name || null,
      comment: input.comment,
      parent_id: input.parentId || null,
      is_anonymous: Boolean(input.isAnonymous),
      author_role: "user",
      is_published: true,
    };

    const { data, error } = await db
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
