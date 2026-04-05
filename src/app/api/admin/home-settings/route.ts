import { NextResponse } from 'next/server';
import { assertAdminRequest } from '@/lib/adminAuth';
import { readHomeSettings, saveHomeSettings } from '@/lib/homeSettings';

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
    const update: Record<string, string> = {};

    if (payload.homeImageOne !== undefined) update.homeImageOne = String(payload.homeImageOne || '');
    if (payload.homeImageTwo !== undefined) update.homeImageTwo = String(payload.homeImageTwo || '');
    if (payload.homeImageThree !== undefined) update.homeImageThree = String(payload.homeImageThree || '');
    if (payload.youtubeVideoUrl !== undefined) update.youtubeVideoUrl = String(payload.youtubeVideoUrl || '');

    const saved = await saveHomeSettings(update);
    return NextResponse.json(saved);
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Invalid request body', error: String(error) }, { status: 400 });
  }
}
