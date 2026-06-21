import { NextResponse } from 'next/server'
import { getSiteConfig } from '@/lib/siteConfig'

export async function GET() {
  const config = await getSiteConfig()
  return NextResponse.json(config, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  })
}
