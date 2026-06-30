import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import sharp from 'sharp';

if (!supabase) {
  console.warn('Supabase client is not configured.');
}

// GET - Lấy danh sách lời chúc (Đã tối ưu hóa Map dữ liệu sạch)
export async function GET(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  try {
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit');
    const includeTotal = url.searchParams.get('include_total');
    const approvedOnly = url.searchParams.get('approved') === 'true';

    let query = supabase
      .from('submissions')
      .select('*', { count: includeTotal ? 'exact' : 'estimated' })
      .order('created_at', { ascending: false });

    // Lọc bài đã duyệt cho trang chủ người dùng công khai
    if (approvedOnly) {
      query = query.eq('status', 'approved');
    }

    if (limit) {
      query = query.limit(parseInt(limit, 10));
    } else {
      query = query.range(0, 4999);
    }

    const { data: submissions, error, count } = await query;

    if (error) {
      console.error('Error fetching submissions:', error);
      return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }

    // Map dữ liệu chuẩn để đồng nhất thuộc tính gửi về Frontend
    const mappedSubmissions = (submissions || []).map(item => ({
      id: item.id,
      name: item.name,
      student_id: item.student_id,
      class_name: item.class_name,
      faculty: item.faculty,
      email: item.email,
      content: item.content,
      image_url: item.image_url,
      is_anonymous: item.is_anonymous,
      status: item.status || 'pending',
      created_at: item.created_at
    }));

    return NextResponse.json({
      total: count,
      submissions: mappedSubmissions
    });
  } catch (error) {
    console.error('Error in GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Sinh viên gửi lời chúc mới
export async function POST(request: NextRequest) {
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const studentId = formData.get('studentId') as string;
    const className = formData.get('className') as string;
    const faculty = formData.get('faculty') as string;
    const email = formData.get('email') as string;
    const content = formData.get('content') as string;
    const isAnonymous = formData.get('isAnonymous') === 'true';
    const image = formData.get('image') as File;

    if (!name || !content) {
      return NextResponse.json({ error: 'Name and content are required' }, { status: 400 });
    }

    let imageUrl: string | null = null;

    if (image && image.size > 0) {
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
      const inputBuffer = Buffer.from(await image.arrayBuffer());
      try {
        const webpBuffer = await sharp(inputBuffer).webp({ quality: 82 }).toBuffer();
        const { error: uploadError } = await supabase.storage
          .from('submission-images')
          .upload(fileName, webpBuffer, { contentType: 'image/webp' });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('submission-images')
            .getPublicUrl(fileName);
          imageUrl = publicUrl;
        }
      } catch (error) {
        console.error('Image processing error:', error);
      }
    }

    const { data: submission, error } = await supabase
      .from('submissions')
      .insert([
        {
          name: isAnonymous ? 'Ẩn danh' : name,
          student_id: isAnonymous ? null : studentId,
          class_name: isAnonymous ? null : className,
          faculty: isAnonymous ? null : faculty,
          email: isAnonymous ? null : email,
          content,
          image_url: imageUrl,
          is_anonymous: isAnonymous,
          status: 'pending' // Mặc định khớp với DB schema
        }
      ])
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 });
    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Cập nhật trạng thái duyệt từ Admin (?id=...)
export async function PATCH(request: NextRequest) {
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const { status } = await request.json();

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('submissions')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Lỗi cập nhật Supabase:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Xóa vĩnh viễn lời chúc từ Admin (?id=...)
export async function DELETE(request: NextRequest) {
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const { error } = await supabase.from('submissions').delete().eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}