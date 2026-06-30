import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  try {
    // 1. Lấy toàn bộ danh sách lời chúc từ Supabase
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Lỗi lấy dữ liệu xuất file:', error);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

    // 2. Định hình cấu trúc dữ liệu để đưa vào Excel
    const excelData = (submissions || []).map((item, index) => {
      let statusText = 'Chờ duyệt';
      if (item.status === 'approved') statusText = 'Đã duyệt';
      if (item.status === 'rejected') statusText = 'Từ chối';

      return {
        'STT': index + 1,
        'Mã Số': item.id,
        'Họ và Tên': item.name || 'Ẩn danh',
        'MSSV': item.student_id || 'N/A',
        'Lớp': item.class_name || 'N/A',
        'Khoa': item.faculty || 'N/A',
        'Email': item.email || 'N/A',
        'Nội Dung Lời Chúc': item.content || '',
        'Trạng Thái': statusText,
        'Ngày Gửi': item.created_at ? new Date(item.created_at).toLocaleString('vi-VN') : ''
      };
    });

    // 3. Sử dụng thư viện xlsx để khởi tạo Workbook và Worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Lời Chúc');

    // 4. Cấu hình độ rộng các cột tự động hoặc cố định để tránh bị tràn chữ
    worksheet['!cols'] = [
      { wch: 6 },  // STT
      { wch: 10 }, // Mã Số
      { wch: 22 }, // Họ và Tên
      { wch: 12 }, // MSSV
      { wch: 12 }, // Lớp
      { wch: 20 }, // Khoa
      { wch: 25 }, // Email
      { wch: 50 }, // Nội Dung Lời Chúc (Cột này cho rộng hẳn ra để dễ đọc)
      { wch: 15 }, // Trạng Thái
      { wch: 20 }, // Ngày Gửi
    ];

    // 5. Xuất workbook ra định dạng buffer (mảng byte) kiểu xlsx
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    // 6. Trả về file định dạng .xlsx chuẩn cho trình duyệt tải xuống
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=danh_sach_loi_chuc_${Date.now()}.xlsx`,
      },
    });

  } catch (error) {
    console.error('Lỗi server export:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}