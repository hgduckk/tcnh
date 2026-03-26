import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

if (!supabase) {
  console.warn('Supabase client is not configured. APIs depending on supabase will be disabled.');
}

// GET - Fetch submissions with optional limit
export async function GET(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  try {
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit');
    const includeTotal = url.searchParams.get('include_total');

    let query = supabase
      .from('submissions')
      .select('*', { count: includeTotal ? 'exact' : 'estimated' })
      .order('created_at', { ascending: false }); // Latest first for mobile

    if (limit) {
      const limitNum = parseInt(limit, 10);
      query = query.limit(limitNum);
    } else {
      query = query.range(0, 4999);
    }

    const { data: submissions, error, count } = await query;

    if (error) {
      console.error('Error fetching submissions:', error);
      return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
    }

    return NextResponse.json({
      total: count,
      submissions
    });
  } catch (error) {
    console.error('Error in GET /api/a80/submissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new submission
export async function POST(request: NextRequest) {
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

    // Handle image upload if present
    if (image && image.size > 0) {
      const fileExt = image.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('submission-images')
        .upload(fileName, image);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        // Continue without image rather than failing the entire submission
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('submission-images')
          .getPublicUrl(fileName);
        imageUrl = publicUrl;
      }
    }

    // Insert submission into database
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
          is_anonymous: isAnonymous
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error inserting submission:', error);
      return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 });
    }

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/a80/submissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}