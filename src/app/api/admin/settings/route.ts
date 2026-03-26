import { NextResponse } from 'next/server';
import { readAdminSettings, saveAdminSettings } from '@/lib/adminSettings';

export async function GET() {
  const settings = await readAdminSettings();
  return NextResponse.json(settings);
}

export async function POST(request: Request) {
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
