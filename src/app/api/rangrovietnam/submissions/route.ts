import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import sharp from 'sharp';

if (!supabase) {
  console.warn('Supabase client is not configured.');
}

// GET - Fetch submissions
export async function GET(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  try {
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit');
    const includeTotal = url.searchParams.get('include_total');
    // Chỉ lấy bài đã duyệt nếu client yêu cầu (dùng cho trang người dùng xem)
    const approvedOnly = url.searchParams.get('approved') === 'true';

    let query = supabase
      .from('submissions')
      .select('*', { count: includeTotal ? 'exact' : 'estimated' })
      .order('created_at', { ascending: false });

    // Lọc theo status nếu là trang hiển thị công khai
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

    return NextResponse.json({
      total: count,
      submissions
    });
  } catch (error) {
    console.error('Error in GET /api/rangrovietnam/submissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new submission
export async function POST(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

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

    // Insert với status = 'pending' để Admin duyệt
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
          status: 'pending' 
        }
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 });
    }

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}