// Định nghĩa các cột cần lấy từ DB
export const RANGRO_SELECT_COLUMNS = [
  "id",
  "name",
  "student_id",
  "class_name",
  "faculty",
  "email",
  "content",
  "image_url",
  "is_anonymous",
  "status", // Đã cập nhật từ is_approved sang status
  "created_at",
].join(", ");

// Type chuẩn cho TypeScript
export type RangRoVietNamRow = {
  id: string;
  name: string;
  studentId: string | null;
  className: string | null;
  faculty: string | null;
  email: string | null;
  content: string;
  imageUrl: string | null;
  isAnonymous: boolean;
  status: 'approved' | 'pending' | 'rejected'; // Cập nhật Type
  createdAt: string;
};

// Hàm map: chuyển Snake Case (DB) -> Camel Case (Code)
export function mapRangRoVietNamRow(input: any): RangRoVietNamRow {
  return {
    id: String(input?.id ?? ""),
    name: input?.is_anonymous ? "Ẩn danh" : String(input?.name ?? "Không tên").trim(),
    studentId: input?.student_id ? String(input.student_id).trim() : null,
    className: input?.class_name ? String(input.class_name).trim() : null,
    faculty: input?.faculty ? String(input.faculty).trim() : null,
    email: input?.email ? String(input.email).trim() : null,
    content: String(input?.content ?? "").trim(),
    imageUrl: input?.image_url ? String(input.image_url).trim() : null,
    isAnonymous: Boolean(input?.is_anonymous),
    // Map status, mặc định là 'pending'
    status: (input?.status as any) === 'approved' ? 'approved' : 
            (input?.status as any) === 'rejected' ? 'rejected' : 'pending',
    createdAt: String(input?.created_at ?? ""),
  };
}