import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import { assertAdminRequest } from "@/lib/adminAuth";
import { serializeError } from "@/lib/utils";
import * as XLSX from "xlsx";

const SUBMISSION_SELECT =
  "id, template_id, submitted_at, full_name, birth_date, class_name, student_id, email, gender, photo_url, department, optional_personal_answers, dept_optional_answers, status, standing_committee_comment, board_comment, phone_number, facebook_link, current_address, transportation, health_note, strengths_weaknesses, special_skills";

const BATCH_SIZE = 1000;

// HÀM PARSE ĐA NĂNG: Cân hết mọi kiểu mảng lưu từ Supabase (Mảng Object lẫn mảng Chuỗi thuần)
function parseJsonbAnswers(jsonbData: any): string {
  if (!jsonbData) return "";
  try {
    const arr = typeof jsonbData === "string" ? JSON.parse(jsonbData) : jsonbData;
    if (!Array.isArray(arr)) return "";
    
    return arr.map((item: any, index: number) => {
      if (!item) return "";
      
      // Trường hợp 1: Nếu lưu dạng mảng Object [{question: "...", answer: "..."}]
      if (typeof item === "object") {
        const q = item.question || item.q || `Câu ${index + 1}`;
        const a = item.answer || item.a || "";
        return `${q}: ${a}`;
      }
      
      // Trường hợp 2: Nếu chỉ lưu mảng chuỗi thuần ["Trả lời 1", "Trả lời 2"]
      return `Câu ${index + 1}: ${String(item)}`;
    }).filter(Boolean).join(" \n "); // Phân dòng sạch đẹp trong ô Excel
  } catch (e) {
    return "";
  }
}

async function fetchAllSubmissionsByTemplate(templateId: string) {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client not configured.");
  }

  const allRows: any[] = [];
  let from = 0;

  while (true) {
    const to = from + BATCH_SIZE - 1;
    const { data, error } = await supabaseAdmin
      .from("application_form_submissions")
      .select(SUBMISSION_SELECT)
      .eq("template_id", templateId)
      .order("submitted_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    const rows = data || [];
    allRows.push(...rows);

    if (rows.length < BATCH_SIZE) {
      break;
    }

    from += BATCH_SIZE;
  }

  return allRows;
}

export async function GET(req: Request) {
  try {
    const authError = assertAdminRequest(req);
    if (authError) return authError;

    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, message: "Supabase admin client not configured." }, { status: 500 });
    }

    const url = new URL(req.url);
    const templateId = url.searchParams.get("template_id");

    if (!templateId) {
      return NextResponse.json({ success: false, message: "Missing template_id param" }, { status: 400 });
    }

    const submissions = await fetchAllSubmissionsByTemplate(templateId);

    if (!submissions || submissions.length === 0) {
      return NextResponse.json({ success: false, message: "Không có ứng viên nào trong đợt tuyển này." }, { status: 404 });
    }

    const excelData = submissions.map((item, index) => {
      // ĐỒNG BỘ TRẠNG THÁI: Check phủ đầu hết các kiểu chữ hoa/thường hoặc giá trị thô lưu trong DB
      let statusText = "Chưa chọn";
      const currentStatus = String(item.status || "").toLowerCase().trim();
      
      if (currentStatus === "accepted" || currentStatus === "passed") statusText = "Đồng ý";
      if (currentStatus === "rejected" || currentStatus === "failed") statusText = "Loại";
      if (currentStatus === "undecided" || currentStatus === "pending") statusText = "Xem xét";

      return {
        "STT": index + 1,
        "Mã Đơn": item.id,
        "Họ và Tên": item.full_name || "",
        "MSSV": item.student_id || "",
        "Lớp": item.class_name || "",
        "Ngày Sinh": item.birth_date || "",
        "Giới Tính": item.gender || "",
        "Số Điện Thoại": item.phone_number || "",
        "Email": item.email || "",
        "Link Facebook": item.facebook_link || "",
        "Địa Chỉ Hiện Tại": item.current_address || "",
        "Phương Tiện Di Chuyển": item.transportation || "",
        "Phân Ban Ứng Tuyển": item.department || "",
        "Ưu & Nhược Điểm": item.strengths_weaknesses || "",
        "Kỹ Năng Đặc Biệt": item.special_skills || "",
        "Lưu Ý Sức Khỏe": item.health_note || "",
        
        "Câu Trả Lời Chung (Form)": parseJsonbAnswers(item.optional_personal_answers),
        "Câu Trả Lời Riêng (Theo Ban)": parseJsonbAnswers(item.dept_optional_answers),
        
        "Ý Kiến Ban Thường vụ": item.standing_committee_comment || "",
        "Ý Kiến Ban Chuyên môn": item.board_comment || "",
        "Kết Quả": statusText,
        "Link Ảnh Chân Dung": item.photo_url || "",
        "Thời Gian Nộp Đơn": item.submitted_at ? new Date(item.submitted_at).toLocaleString("vi-VN") : ""
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ứng Viên CTV");

    worksheet["!cols"] = [
      { wch: 6 },  { wch: 10 }, { wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
      { wch: 10 }, { wch: 15 }, { wch: 25 }, { wch: 25 }, { wch: 30 }, { wch: 15 },
      { wch: 20 }, { wch: 35 }, { wch: 35 }, { wch: 20 }, { wch: 50 }, { wch: 50 },
      { wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 30 }, { wch: 20 }
    ];

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=danh_sach_ctv_dot_${templateId}.xlsx`,
      },
    });

  } catch (e) {
    return NextResponse.json({ success: false, message: serializeError(e) }, { status: 500 });
  }
}