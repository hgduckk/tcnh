import { NextResponse } from 'next/server';
import { assertAdminRequest } from '@/lib/adminAuth';
import { readHomeSettings, saveHomeSettings, type HomeSettings } from '@/lib/homeSettings';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const authError = assertAdminRequest(request);
  if (authError) return authError;

  const settings = await readHomeSettings();
  return NextResponse.json(settings, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

export async function POST(request: Request) {
  const authError = assertAdminRequest(request);
  if (authError) return authError;

  try {
    const payload = await request.json();
    const update: Partial<HomeSettings> = {};

    if (payload.homeBannerImage !== undefined) update.homeBannerImage = String(payload.homeBannerImage || '');
    if (payload.homeImageOne !== undefined) update.homeImageOne = String(payload.homeImageOne || '');
    if (payload.homeImageTwo !== undefined) update.homeImageTwo = String(payload.homeImageTwo || '');
    if (payload.homeImageThree !== undefined) update.homeImageThree = String(payload.homeImageThree || '');
    if (payload.youtubeVideoUrl !== undefined) update.youtubeVideoUrl = String(payload.youtubeVideoUrl || '');

    const saved = await saveHomeSettings(update);

    const mismatchKeys = (Object.keys(update) as (keyof HomeSettings)[])
      .filter((key) => String(saved[key] ?? '') !== String(update[key] ?? ''))
      .map(String);

    if (mismatchKeys.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Saved response mismatch after persistence verification',
          mismatchKeys,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(saved);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isInvalidBodyError = /json|body|parse|syntax/i.test(errorMessage);

    return NextResponse.json(
      {
        success: false,
        message: isInvalidBodyError ? 'Invalid request body' : 'Failed to save home settings',
        error: errorMessage,
      },
      { status: isInvalidBodyError ? 400 : 500 }
    );
  }
}
