import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { serializeError } from '@/lib/utils';

export interface AdminSettings {
  youtubeVideoId: string;
  homepageTitle: string;
  homepageDescription: string;
  contactFormTitle: string;
  contactFormSubtitle: string;
  lastUpdated?: string;
}

const DEFAULT_SETTINGS: AdminSettings = {
  youtubeVideoId: 'dQw4w9WgXcQ',
  homepageTitle: 'Đoàn Khoa Tài chính - Ngân hàng',
  homepageDescription: 'Cùng nhau xây dựng hành trình Thanh niên tươi sáng.',
  contactFormTitle: 'Liên hệ với chúng tôi',
  contactFormSubtitle: 'Nhập thông tin để gửi tin nhắn',
};

const SETTINGS_TABLE = 'admin_settings';
const SETTINGS_ROW_ID = 1;

type AdminSettingsRow = {
  id: number;
  youtube_video_id: string;
  homepage_title: string;
  homepage_description: string;
  contact_form_title: string;
  contact_form_subtitle: string;
  last_updated?: string | null;
};

function rowToSettings(row: Partial<AdminSettingsRow>): AdminSettings {
  return {
    youtubeVideoId: row.youtube_video_id || DEFAULT_SETTINGS.youtubeVideoId,
    homepageTitle: row.homepage_title || DEFAULT_SETTINGS.homepageTitle,
    homepageDescription: row.homepage_description || DEFAULT_SETTINGS.homepageDescription,
    contactFormTitle: row.contact_form_title || DEFAULT_SETTINGS.contactFormTitle,
    contactFormSubtitle: row.contact_form_subtitle || DEFAULT_SETTINGS.contactFormSubtitle,
    lastUpdated: row.last_updated || undefined,
  };
}

function settingsToRow(settings: Partial<AdminSettings>): Partial<AdminSettingsRow> {
  const row: Partial<AdminSettingsRow> = {};
  if (settings.youtubeVideoId !== undefined) row.youtube_video_id = settings.youtubeVideoId;
  if (settings.homepageTitle !== undefined) row.homepage_title = settings.homepageTitle;
  if (settings.homepageDescription !== undefined) row.homepage_description = settings.homepageDescription;
  if (settings.contactFormTitle !== undefined) row.contact_form_title = settings.contactFormTitle;
  if (settings.contactFormSubtitle !== undefined) row.contact_form_subtitle = settings.contactFormSubtitle;
  return row;
}

export async function readAdminSettings(): Promise<AdminSettings> {
  if (!supabaseAdmin) {
    console.warn('Supabase admin client is not configured; using default admin settings.');
    return DEFAULT_SETTINGS;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from(SETTINGS_TABLE)
      .select('*')
      .eq('id', SETTINGS_ROW_ID)
      .maybeSingle();

    if (error) throw error;

    if (!data) return DEFAULT_SETTINGS;

    return rowToSettings(data as Partial<AdminSettingsRow>);
  } catch (error) {
    console.warn('Error reading admin settings from Supabase, using defaults.', serializeError(error));
    return DEFAULT_SETTINGS;
  }
}

export async function saveAdminSettings(settings: Partial<AdminSettings>): Promise<AdminSettings> {
  const merged: AdminSettings = {
    ...(await readAdminSettings()),
    ...settings,
    lastUpdated: new Date().toISOString(),
  };

  if (!supabaseAdmin) {
    console.warn('Supabase admin client is not configured; cannot persist admin settings.');
    return merged;
  }

  const rowPayload: Partial<AdminSettingsRow> = {
    id: SETTINGS_ROW_ID,
    ...settingsToRow(merged),
    last_updated: merged.lastUpdated,
  };

  const { error } = await supabaseAdmin
    .from(SETTINGS_TABLE)
    .upsert(rowPayload, { onConflict: 'id' });

  if (error) {
    console.warn('Error saving admin settings to Supabase:', serializeError(error));
  }

  return merged;
}
