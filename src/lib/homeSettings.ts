import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { serializeError } from '@/lib/utils';

export interface HomeSettings {
  homeBannerImage: string;
  homeImageOne: string;
  homeImageTwo: string;
  homeImageThree: string;
  youtubeVideoUrl: string;
  lastUpdated?: string;
}

const DEFAULT_HOME_SETTINGS: HomeSettings = {
  homeBannerImage: '',
  homeImageOne: '',
  homeImageTwo: '',
  homeImageThree: '',
  youtubeVideoUrl: '',
};

const HOME_SETTINGS_TABLE = 'home_settings';
const HOME_SETTINGS_ROW_ID = 1;

type HomeSettingsRow = {
  id: number;
  home_banner_image: string;
  home_image_one: string;
  home_image_two: string;
  home_image_three: string;
  home_youtube_url: string;
  last_updated?: string | null;
};

function rowToSettings(row: Partial<HomeSettingsRow>): HomeSettings {
  return {
    homeBannerImage: row.home_banner_image || DEFAULT_HOME_SETTINGS.homeBannerImage,
    homeImageOne: row.home_image_one || DEFAULT_HOME_SETTINGS.homeImageOne,
    homeImageTwo: row.home_image_two || DEFAULT_HOME_SETTINGS.homeImageTwo,
    homeImageThree: row.home_image_three || DEFAULT_HOME_SETTINGS.homeImageThree,
    youtubeVideoUrl: row.home_youtube_url || DEFAULT_HOME_SETTINGS.youtubeVideoUrl,
    lastUpdated: row.last_updated || undefined,
  };
}

function settingsToRow(settings: Partial<HomeSettings>): Partial<HomeSettingsRow> {
  const row: Partial<HomeSettingsRow> = {};
  if (settings.homeBannerImage !== undefined) row.home_banner_image = settings.homeBannerImage;
  if (settings.homeImageOne !== undefined) row.home_image_one = settings.homeImageOne;
  if (settings.homeImageTwo !== undefined) row.home_image_two = settings.homeImageTwo;
  if (settings.homeImageThree !== undefined) row.home_image_three = settings.homeImageThree;
  if (settings.youtubeVideoUrl !== undefined) row.home_youtube_url = settings.youtubeVideoUrl;
  return row;
}

export async function readHomeSettings(): Promise<HomeSettings> {
  if (!supabaseAdmin) {
    console.warn('Supabase admin client is not configured; using default home settings.');
    return DEFAULT_HOME_SETTINGS;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from(HOME_SETTINGS_TABLE)
      .select('*')
      .eq('id', HOME_SETTINGS_ROW_ID)
      .maybeSingle();

    if (error) throw error;
    if (!data) return DEFAULT_HOME_SETTINGS;

    return rowToSettings(data as Partial<HomeSettingsRow>);
  } catch (error) {
    console.warn('Error reading home settings from Supabase, using defaults.', serializeError(error));
    return DEFAULT_HOME_SETTINGS;
  }
}

export async function saveHomeSettings(settings: Partial<HomeSettings>): Promise<HomeSettings> {
  const merged: HomeSettings = {
    ...(await readHomeSettings()),
    ...settings,
    lastUpdated: new Date().toISOString(),
  };

  if (!supabaseAdmin) {
    throw new Error('Supabase admin client is not configured on the server. Missing SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SECRET_KEY.');
  }

  const payload: Partial<HomeSettingsRow> = {
    id: HOME_SETTINGS_ROW_ID,
    ...settingsToRow(merged),
    last_updated: merged.lastUpdated,
  };

  const { error } = await supabaseAdmin
    .from(HOME_SETTINGS_TABLE)
    .upsert(payload, { onConflict: 'id' });

  if (error) {
    throw new Error(`Error saving home settings to Supabase: ${serializeError(error)}`);
  }

  const { data: verifyData, error: verifyError } = await supabaseAdmin
    .from(HOME_SETTINGS_TABLE)
    .select('*')
    .eq('id', HOME_SETTINGS_ROW_ID)
    .maybeSingle();

  if (verifyError) {
    throw new Error(`Saved but failed to verify home settings from Supabase: ${serializeError(verifyError)}`);
  }

  if (!verifyData) {
    throw new Error('Saved but verification failed: row id=1 not found in home_settings.');
  }

  return rowToSettings(verifyData as Partial<HomeSettingsRow>);
}
