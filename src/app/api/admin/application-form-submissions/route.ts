import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import { assertAdminRequest } from "@/lib/adminAuth";
import { serializeError } from "@/lib/utils";

// ÉP NEXT.JS LUÔN TRUY VẤN DỮ LIỆU ĐỘNG, BẺ GÃY HOÀN TOÀN CƠ CHẾ CACHE LÌ LỢM CỦA LOCAL
export const dynamic = "force-dynamic";

const SUBMISSION_SELECT =
  "id, template_id, submitted_at, full_name, birth_date, class_name, student_id, email, gender, photo_url, department, optional_personal_answers, dept_optional_answers, status, standing_committee_comment, board_comment, phone_number, facebook_link, current_address, transportation, health_note, strengths_weaknesses, special_skills";
const BATCH_SIZE = 1000;

async function fetchAllApplicationSubmissions() {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client not configured.");
  }

  const allRows: any[] = [];
  let from = 0;
  let total = 0;

  while (true) {
    const to = from + BATCH_SIZE - 1;
    const { data, error, count } = await supabaseAdmin
      .from("application_form_submissions")
      .select(SUBMISSION_SELECT, { count: from === 0 ? "exact" : undefined })
      .order("submitted_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    if (typeof count === "number") {
      total = count;
    }

    const rows = data || [];
    allRows.push(...rows);

    if (rows.length < BATCH_SIZE) {
      break;
    }

    from += BATCH_SIZE;
  }

  return {
    data: allRows,
    total: total || allRows.length,
  };
}

export async function GET(req: Request) {
  try {
    // 1. Kiểm tra xác thực quyền Admin từ Header x-admin-password
    const authError = assertAdminRequest(req);
    if (authError) {
      console.warn("🚨 [Auth Error] Yêu cầu lấy danh sách ứng viên bị từ chối do sai mật khẩu.");
      return authError;
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, message: "Supabase admin client not configured." }, { status: 500 });
    }

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const pageSize = Math.min(Math.max(1, parseInt(url.searchParams.get("pageSize") || "50", 10)), 500);
    const includeAll = url.searchParams.get("includeAll") === "true";

    // Trường hợp lấy toàn bộ không phân trang
    if (includeAll) {
      const result = await fetchAllApplicationSubmissions();

      return NextResponse.json({
        success: true,
        data: result.data,
        total: result.total,
        page: 1,
        pageSize: result.data.length,
        totalPages: 1,
      });
    }

    // Trường hợp lấy có phân trang (Mặc định hiển thị trên bảng Dashboard)
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabaseAdmin
      .from("application_form_submissions")
      .select(SUBMISSION_SELECT, { count: "exact" })
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
    console.error("❌ [Server Error GET Submissions]:", e);
    return NextResponse.json({ success: false, message: serializeError(e) }, { status: 500 });
  }
}