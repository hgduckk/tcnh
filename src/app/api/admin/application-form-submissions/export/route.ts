import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import { assertAdminRequest } from "@/lib/adminAuth";
import { serializeError } from "@/lib/utils";
import * as XLSX from "xlsx";

// Ép đường dẫn luôn truy vấn dữ liệu động mới nhất, bẻ gãy bộ nhớ cache
export const dynamic = 'force-dynamic';

const SUBMISSION_SELECT =
  "id, template_id, submitted_at, full_name, birth_date, class_name, student_id, email, gender, photo_url, department, optional_personal_answers, dept_optional_answers, status, standing_committee_comment, board_comment, phone_number, facebook_link, current_address, transportation, health_note, strengths_weaknesses, special_skills";

const BATCH_SIZE = 1000;

/**
 * HÀM GHÉP ĐÔI CÂU HỎI - CÂU TRẢ LỜI
 * Tự động lọc và ẩn hoàn toàn những câu hỏi ứng viên bỏ trống không trả lời
 * @param jsonbAnswers Mảng câu trả lời của ứng viên (Dữ liệu từ bảng submissions)
 * @param questionList Mảng các câu hỏi gốc dạng string[] (Dữ liệu từ bảng templates)
 */
function parseAnswersWithQuestions(jsonbAnswers: any, questionList: string[] = []): string {
  if (!jsonbAnswers) return "";
  try {
    const answersArr = typeof jsonbAnswers === "string" ? JSON.parse(jsonbAnswers) : jsonbAnswers;
    if (!Array.isArray(answersArr)) return "";

    return answersArr.map((item: any, index: number) => {
      // 1. Lấy nội dung câu trả lời trước để kiểm tra dữ liệu trống
      let answerText = "";
      if (item && typeof item === "object") {
        answerText = item.answer || item.a || "";
      } else {
        answerText = item ? String(item).trim() : "";
      }

      // NẾU KHÔNG CÓ CÂU TRẢ LỜI -> BỎ QUA HOÀN TOÀN, KHÔNG IN RA EXCEL ĐỂ TRÁNH RÁC FILE
      if (!answerText) return null;

      // 2. Lấy nội dung câu hỏi gốc tương ứng từ cấu hình Template của Đức
      const questionText = (questionList && questionList[index]) ? questionList[index].trim() : `Câu ${index + 1}`;
      const finalQuestion = questionText || `Câu ${index + 1}`;

      return `❓ ${finalQuestion}\n➔ Trả lời: ${answerText}`;
    })
    .filter(Boolean) // Quét sạch sành sanh các phần tử null ra khỏi mảng
    .join("\n\n");   // Gộp chuỗi xuống dòng sạch sẽ khi bật cụm Wrap Text trong Excel
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
    // 1. Kiểm tra phân quyền Admin từ Header x-admin-password
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

    // 2. Kéo cấu trúc câu hỏi gốc từ bảng public.application_form_templates
    const { data: templateData } = await supabaseAdmin
      .from("application_form_templates")
      .select("optional_personal_questions, department_questions")
      .eq("id", templateId)
      .single();

    const globalPersonalQuestions: string[] = templateData?.optional_personal_questions || [];
    const rawDeptQuestions: Record<string, string[]> = templateData?.department_questions || {};

    // 3. Quét toàn bộ danh sách đơn nộp của đợt tuyển cụ thể này về
    const submissions = await fetchAllSubmissionsByTemplate(templateId);

    if (!submissions || submissions.length === 0) {
      return NextResponse.json({ success: false, message: "Không có ứng viên nào trong đợt tuyển này." }, { status: 404 });
    }

    // 4. Mapping chuẩn hóa mảng dữ liệu sang cấu trúc cột Excel Tiếng Việt
    const excelData = submissions.map((item, index) => {
      // Đồng bộ hóa trạng thái bất kể DB lưu chữ hoa hay chữ thường thô
      let statusText = "Chưa chọn";
      const currentStatus = String(item.status || "").toLowerCase().trim();
      
      if (currentStatus === "accepted" || currentStatus === "passed") statusText = "Đồng ý";
      if (currentStatus === "rejected" || currentStatus === "failed") statusText = "Loại";
      if (currentStatus === "undecided" || currentStatus === "pending") statusText = "Xem xét";

      // Trích xuất mảng câu hỏi riêng biệt của Phân ban mà ứng viên này ứng tuyển
      const currentDeptName = item.department ? String(item.department).trim() : "";
      const currentDeptQuestions: string[] = rawDeptQuestions[currentDeptName] || [];

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
        
        // Gọi hàm bóc tách cặp Câu hỏi - Câu trả lời real-time đã được dọn dẹp dòng trống
        "Câu Hỏi & Trả Lời Chung": parseAnswersWithQuestions(item.optional_personal_answers, globalPersonalQuestions),
        "Câu Hỏi & Trả Lời Riêng Ban": parseAnswersWithQuestions(item.dept_optional_answers, currentDeptQuestions),
        
        "Ý Kiến Ban Thường vụ": item.standing_committee_comment || "",
        "Ý Kiến Ban Chuyên môn": item.board_comment || "",
        "Kết Quả": statusText,
        "Link Ảnh Chân Dung": item.photo_url || "",
        "Thời Gian Nộp Đơn": item.submitted_at ? new Date(item.submitted_at).toLocaleString("vi-VN") : ""
      };
    });

    // 5. Build cấu trúc file Excel bằng thư viện xlsx
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ứng Viên CTV");

    // Định dạng chiều rộng cố định cho 23 cột chống lỗi vỡ ô chữ
    worksheet["!cols"] = [
      { wch: 6 },  { wch: 10 }, { wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
      { wch: 10 }, { wch: 15 }, { wch: 25 }, { wch: 25 }, { wch: 30 }, { wch: 15 },
      { wch: 20 }, { wch: 35 }, { wch: 35 }, { wch: 20 }, { wch: 70 }, { wch: 70 },
      { wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 30 }, { wch: 20 }
    ];

    // 6. Chuyển đổi dữ liệu workbook sang mảng excel buffer
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

    // 7. Bắn gói dữ liệu luồng byte kèm Header tải file tự động về máy tính admin
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=danh_sach_ctv_dot_${templateId}.xlsx`,
      },
    });

  } catch (e) {
    return NextResponse.json({ success: false, message: "Server gặp sự cố khi xử lý dữ liệu Excel: " + serializeError(e) }, { status: 500 });
  }
}