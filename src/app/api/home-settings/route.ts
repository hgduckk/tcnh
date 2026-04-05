import { NextResponse } from 'next/server';
import { readHomeSettings } from '@/lib/homeSettings';

export async function GET() {
  const settings = await readHomeSettings();

  return NextResponse.json(
    {
      homeImageOne: settings.homeImageOne,
      homeImageTwo: settings.homeImageTwo,
      homeImageThree: settings.homeImageThree,
      youtubeVideoUrl: settings.youtubeVideoUrl,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
