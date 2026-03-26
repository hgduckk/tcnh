import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";

export async function GET(req: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, message: "Supabase admin client not configured." }, { status: 500 });
    }

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const pageSize = Math.min(Math.max(1, parseInt(url.searchParams.get("pageSize") || "50", 10)), 100);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabaseAdmin
      .from("application_form_submissions")
      .select(
        "id, template_id, submitted_at, full_name, birth_date, class_name, student_id, email, gender, department, photo_url, optional_personal_answers, dept_optional_answers",
        { count: "exact" }
      )
      .order("submitted_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return NextResponse.json({
      success: true,
      data: data || [],
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (e) {
    return NextResponse.json({ success: false, message: String(e) }, { status: 500 });
  }
}

