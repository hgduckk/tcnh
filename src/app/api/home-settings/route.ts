import { NextResponse } from 'next/server';
import { readHomeSettings } from '@/lib/homeSettings';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const settings = await readHomeSettings();

  return NextResponse.json(
    {
      homeBannerImage: settings.homeBannerImage,
      homeImageOne: settings.homeImageOne,
      homeImageTwo: settings.homeImageTwo,
      homeImageThree: settings.homeImageThree,
      youtubeVideoUrl: settings.youtubeVideoUrl,
      lastUpdated: settings.lastUpdated,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
