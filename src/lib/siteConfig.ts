import { getAdminUrlString, getFrontendUrlString } from "@/lib/publicUrls"

export interface SiteConfig {
  title: string
  frontendUrl: string
  adminPageUrl: string
  showAdminLink: boolean
  adminLinkLabel: string
}

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  title: 'Đoàn Khoa Tài chính - Ngân hàng',
  frontendUrl: getFrontendUrlString(),
  adminPageUrl: getAdminUrlString(),
  showAdminLink: true,
  adminLinkLabel: 'Admin Dashboard',
}

export async function getSiteConfig(): Promise<SiteConfig> {
  return DEFAULT_SITE_CONFIG
}
