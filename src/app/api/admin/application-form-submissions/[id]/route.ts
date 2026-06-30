import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import { assertAdminRequest } from "@/lib/adminAuth";
import { serializeError } from "@/lib/utils";

// Mảng các trạng thái hợp lệ trong hệ thống tuyển CTV của Đức
const VALID_STATUSES = ["not_selected", "accepted", "undecided", "rejected", "pending", "passed", "failed"] as const;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // Đưa việc bóc tách id ra ngoài try/catch để đảm bảo phạm vi biến (scope) an toàn cho cả khối catch
  const { id } = await params;

  try {
    // 1. Kiểm tra xác thực quyền Admin từ Header x-admin-password
    const authError = assertAdminRequest(req);
    if (authError) {
      console.warn("🚨 [Auth Error] Admin PATCH từ chối do sai credentials.");
      return authError;
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, message: "Supabase admin client not configured." },
        { status: 500 },
      );
    }

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Missing submission ID." },
        { status: 400 },
      );
    }

    const body = await req.json();
    const updateData: Record<string, any> = {};

    // 2. Xử lý cập nhật Trạng thái (Status)
    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json(
          { success: false, message: "Invalid status value." },
          { status: 400 },
        );
      }
      updateData.status = body.status;
    }

    // 3. Xử lý cập nhật Nhận xét của Thường trực và Ban Quản lý (Hỗ trợ xóa trắng bằng null)
    if (body.standing_committee_comment !== undefined) {
      updateData.standing_committee_comment = body.standing_committee_comment === null ? null : String(body.standing_committee_comment);
    }

    if (body.board_comment !== undefined) {
      updateData.board_comment = body.board_comment === null ? null : String(body.board_comment);
    }

    // 4. Xử lý cập nhật hàng loạt các trường thông tin cá nhân mới thêm
    const newFields = [
      'phone_number', 'facebook_link', 'current_address', 
      'transportation', 'health_note', 'strengths_weaknesses', 'special_skills'
    ];

    newFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field] === null ? null : String(body[field]);
      }
    });

    // Nếu không có trường nào thay đổi thì chặn lại báo lỗi
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, message: "No fields to update." }, { status: 400 });
    }

    // 5. Thực hiện lệnh UPDATE xuống Database bằng quyền tối cao bypass RLS
    const { error } = await supabaseAdmin
      .from("application_form_submissions")
      .update(updateData)
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (e) {
    // Biến `id` ở đây đã khả dụng hoàn toàn, không lo lỗi biên dịch TypeScript
    console.error(`❌ [Server Error PATCH Submission ${id}]:`, e);
    return NextResponse.json({ success: false, message: serializeError(e) }, { status: 500 });
  }
}