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
  return DEFAULT_SITE_CONFIG
}
