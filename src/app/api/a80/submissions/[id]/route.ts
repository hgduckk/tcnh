import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

if (!supabase) {
  console.warn('Supabase client is not configured. A80 submission detail APIs will be disabled.');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // First get the submission to check if it has an image
    const { data: submission, error: fetchError } = await supabase
      .from('submissions')
      .select('image_url')
      .eq('id', id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error fetching submission:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch submission' }, { status: 500 });
    }

    // Delete the image from storage if it exists
    if (submission?.image_url) {
      const fileName = submission.image_url.split('/').pop();
      if (fileName) {
        const { error: deleteImageError } = await supabase.storage
          .from('submission-images')
          .remove([fileName]);

        if (deleteImageError) {
          console.error('Error deleting image:', deleteImageError);
          // Continue with submission deletion even if image deletion fails
        }
      }
    }

    // Delete the submission from the database
    const { error: deleteError } = await supabase
      .from('submissions')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting submission:', deleteError);
      return NextResponse.json({ error: 'Failed to delete submission' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Submission deleted successfully' });

  } catch (error) {
    console.error('Error in DELETE /api/a80/submissions/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}