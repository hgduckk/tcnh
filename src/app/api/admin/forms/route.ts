import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import { DEPARTMENTS, type Department } from "@/lib/applicationForms";
import { assertAdminRequest } from "@/lib/adminAuth";
import { serializeError } from "@/lib/utils";
import { Resend } from "resend"; // 🌟 Import Resend

// Khởi tạo Resend bằng Key tối mật
const resend = new Resend(process.env.RESEND_API_KEY);

export const dynamic = "force-dynamic";

function normalizeDepartmentQuestions(input: any): Record<Department, string[]> {
  const out = {} as Record<Department, string[]>;
  for (const dept of DEPARTMENTS) {
    const arr = input?.[dept];
    const fixed = Array.from({ length: 3 }).map((_, i) => String(arr?.[i] ?? ""));
    out[dept] = fixed;
  }
  return out;
}

// ==========================================
// 1. GET - LẤY DANH SÁCH FORM ĐỢT TUYỂN
// ==========================================
export async function GET(req: Request) {
  try {
    const authError = assertAdminRequest(req);
    if (authError) return authError;

    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, message: "Supabase admin client not configured." }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from("application_form_templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] });
  } catch (e) {
    return NextResponse.json({ success: false, message: serializeError(e) }, { status: 500 });
  }
}

// ==========================================
// 2. POST - TẠO MỚI HOẶC CẬP NHẬT FORM (CÓ BẮN MAIL BÁO ADMIN)
// ==========================================
export async function POST(req: Request) {
  try {
    const authError = assertAdminRequest(req);
    if (authError) return authError;

    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, message: "Supabase admin client not configured." }, { status: 500 });
    }

    const body = await req.json();
    const {
      id,
      name,
      openAt,
      closeAt,
      optionalPersonalQuestions,
      departmentQuestions,
      illustrations,
      classOptions,
    } = body || {};

    if (!name || !openAt || !closeAt) {
      return NextResponse.json({ success: false, message: "Missing required fields." }, { status: 400 });
    }

    const optionalQs = Array.from({ length: 5 }).map((_, i) => String(optionalPersonalQuestions?.[i] ?? ""));
    const deptQs = normalizeDepartmentQuestions(departmentQuestions);
    const classOpts = Array.isArray(classOptions) ? (classOptions as unknown[]).map(String).filter(Boolean) : [];

    const openIso = new Date(String(openAt)).toISOString();
    const closeIso = new Date(String(closeAt)).toISOString();

    const payload = {
      id: id ? String(id) : undefined,
      name: String(name),
      open_at: openIso,
      close_at: closeIso,
      optional_personal_questions: optionalQs,
      department_questions: deptQs,
      illustrations: Array.isArray(illustrations) ? illustrations : [],
      class_options: classOpts,
    };

    let isEdit = !!id;
    let finalData: any = null;

    // Trường hợp: Cập nhật form cũ (Edit)
    if (id) {
      const { data, error } = await supabaseAdmin
        .from("application_form_templates")
        .update({
          name: payload.name,
          open_at: payload.open_at,
          close_at: payload.close_at,
          optional_personal_questions: payload.optional_personal_questions,
          department_questions: payload.department_questions,
          illustrations: payload.illustrations,
          class_options: payload.class_options,
        })
        .eq("id", String(id))
        .select("*")
        .single();

      if (error) throw error;
      finalData = data;

      // Lưu snapshot lịch sử
      supabaseAdmin
        .from("application_form_template_history")
        .insert({ template_id: data.id, action: "updated", snapshot: data })
        .then(({ error: histErr }) => {
          if (histErr) console.warn("History insert failed:", histErr.message);
        });
    } else {
      // Trường hợp: Tạo form hoàn toàn mới (Create)
      const { data, error } = await supabaseAdmin
        .from("application_form_templates")
        .insert({
          name: payload.name,
          open_at: payload.open_at,
          close_at: payload.close_at,
          optional_personal_questions: payload.optional_personal_questions,
          department_questions: payload.department_questions,
          illustrations: payload.illustrations,
          class_options: payload.class_options,
        })
        .select("*")
        .single();

      if (error) throw error;
      finalData = data;

      // Lưu snapshot lịch sử
      supabaseAdmin
        .from("application_form_template_history")
        .insert({ template_id: data.id, action: "created", snapshot: data })
        .then(({ error: histErr }) => {
          if (histErr) console.warn("History insert failed:", histErr.message);
        });
    }

    // 🌟 3. TỰ ĐỘNG GỬI MAIL NO-REPLY BÁO CÁO CHO BAN TỔ CHỨC ĐOÀN KHOA
    try {
      await resend.emails.send({
        from: 'Hệ thống Quản trị <no-reply@dktcnh.id.vn>',
        to: ['hoangduc100307@gmail.com'], // Gửi về hòm thư tổng điều hành của BTC
        subject: `[Hệ thống] ${isEdit ? 'Cập nhật' : 'Khởi tạo'} thành công form đợt tuyển: ${payload.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #cbd5e1; border-radius: 8px;">
            <h3 style="color: #1e3a8a;">THÔNG BÁO CẬP NHẬT BIỂU MẪU</h3>
            <p>Xin chào Ban Dự án,</p>
            <p>Hệ thống vừa ghi nhận một thao tác thay đổi cấu trúc đợt tuyển dụng từ trang Admin:</p>
            <ul>
              <li><strong>Tên đợt tuyển:</strong> ${payload.name}</li>
              <li><strong>Hành động:</strong> ${isEdit ? 'Cập nhật nội dung form' : 'Tạo mới form hoàn toàn'}</li>
              <li><strong>Thời gian mở đơn:</strong> ${new Date(payload.open_at).toLocaleString('vi-VN')}</li>
              <li><strong>Thời gian đóng đơn:</strong> ${new Date(payload.close_at).toLocaleString('vi-VN')}</li>
            </ul>
            <p style="color: #64748b; font-size: 12px; margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
              * Thao tác được ghi nhận realtime trên hệ thống dktcnh.id.vn.
            </p>
          </div>
        `
      });
    } catch (mailErr) {
      console.error("Lỗi gửi mail thông báo Admin:", mailErr);
    }

    return NextResponse.json({ success: true, data: finalData });
  } catch (e) {
    return NextResponse.json({ success: false, message: serializeError(e) }, { status: 500 });
  }
}