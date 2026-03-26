import { client } from '@/sanity/lib/client'

export interface SiteConfig {
  title: string
  frontendUrl: string
  adminPageUrl: string
  showAdminLink: boolean
  adminLinkLabel: string
}

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  title: 'Đoàn Khoa Tài chính - Ngân hàng',
  frontendUrl: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000',
  adminPageUrl: process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3000/admin',
  showAdminLink: true,
  adminLinkLabel: 'Admin Dashboard',
}

export async function getSiteConfig(): Promise<SiteConfig> {
  try {
    const data = await client.fetch<SiteConfig | null>(`*[_type == "siteConfiguration"][0]{
      title,
      frontendUrl,
      adminPageUrl,
      showAdminLink,
      adminLinkLabel
    }`)

    if (!data) return DEFAULT_SITE_CONFIG
    return {
      ...DEFAULT_SITE_CONFIG,
      ...data,
    }
  } catch (error) {
    console.warn('Could not load site config from Sanity, using default.', error)
    return DEFAULT_SITE_CONFIG
  }
}
