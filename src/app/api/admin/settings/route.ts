import { NextResponse } from 'next/server';
import { readAdminSettings, saveAdminSettings } from '@/lib/adminSettings';
import { assertAdminRequest } from '@/lib/adminAuth';

export async function GET(request: Request) {
  const authError = assertAdminRequest(request);
  if (authError) return authError;

  const settings = await readAdminSettings();
  return NextResponse.json(settings, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}

export async function POST(request: Request) {
  const authError = assertAdminRequest(request);
  if (authError) return authError;

  try {
    const payload = await request.json();
    const allowedKeys = [
      'youtubeVideoId',
      'homepageTitle',
      'homepageDescription',
      'contactFormTitle',
      'contactFormSubtitle',
      'googleSheetId',
      'googleSheetRange',
      'googleSheetRangeContact',
      'googleSheetRangeComments',
    ];

    const update: Record<string, any> = {};
    for (const key of allowedKeys) {
      if (payload[key] !== undefined) {
        update[key] = payload[key];
      }
    }

    const newSettings = await saveAdminSettings(update);
    return NextResponse.json(newSettings);
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Invalid request body', error: String(error) }, { status: 400 });
  }
}
