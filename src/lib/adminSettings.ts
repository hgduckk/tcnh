import fs from 'fs';
import path from 'path';

export interface AdminSettings {
  youtubeVideoId: string;
  homepageTitle: string;
  homepageDescription: string;
  contactFormTitle: string;
  contactFormSubtitle: string;
  googleSheetId: string;
  googleSheetRange: string;
  googleSheetRangeContact: string;
  googleSheetRangeComments: string;
  lastUpdated?: string;
}

const SETTINGS_FILENAME = 'admin-settings.json';
const DEFAULT_SETTINGS: AdminSettings = {
  youtubeVideoId: 'dQw4w9WgXcQ',
  homepageTitle: 'Đoàn Khoa Tài chính - Ngân hàng',
  homepageDescription: 'Cùng nhau xây dựng hành trình Thanh niên tươi sáng.',
  contactFormTitle: 'Liên hệ với chúng tôi',
  contactFormSubtitle: 'Nhập thông tin để gửi tin nhắn',
  googleSheetId: process.env.GOOGLE_SHEET_ID || 'your_google_sheet_id_here',
  googleSheetRange: process.env.GOOGLE_SHEET_RANGE || 'Sheet1!A:Z',
  googleSheetRangeContact: process.env.GOOGLE_SHEET_RANGE_CONTACT || 'Contact!A:D',
  googleSheetRangeComments: process.env.GOOGLE_SHEET_RANGE_COMMENTS || 'Comments!A:F',
};

const getSettingsPath = () => path.join(process.cwd(), SETTINGS_FILENAME);

export async function readAdminSettings(): Promise<AdminSettings> {
  const filePath = getSettingsPath();

  try {
    const json = await fs.promises.readFile(filePath, 'utf8');
    const parsed = JSON.parse(json);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    };
  } catch (error) {
    // If file does not exist, create with defaults
    if ((error as any)?.code === 'ENOENT') {
      await saveAdminSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    console.warn('Error reading admin settings, using defaults. ', error);
    return DEFAULT_SETTINGS;
  }
}

export async function saveAdminSettings(settings: Partial<AdminSettings>): Promise<AdminSettings> {
  const filePath = getSettingsPath();
  const current = await readAdminSettings();
  const merged = {
    ...current,
    ...settings,
    lastUpdated: new Date().toISOString(),
  };
  await fs.promises.writeFile(filePath, JSON.stringify(merged, null, 2), 'utf8');
  return merged;
}
