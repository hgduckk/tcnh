import { google } from 'googleapis';
import fs from 'fs';
import { readAdminSettings } from '@/lib/adminSettings';

// Prefer credentials from BASE64 JSON when available to avoid newline/escaping issues
function normalizePrivateKey(maybeKey?: string) {
  if (!maybeKey) return undefined;
  // If the key is quoted (e.g., "-----BEGIN...END PRIVATE KEY-----\n"), strip surrounding quotes
  const stripped = maybeKey.startsWith('"') && maybeKey.endsWith('"')
    ? maybeKey.slice(1, -1)
    : maybeKey;
  // Replace escaped newlines with real newlines
  const withNewlines = stripped.replace(/\\n/g, '\n').replace(/\r\n/g, '\n');
  // Ensure it ends with a newline (some providers trim the trailing newline)
  return withNewlines.endsWith('\n') ? withNewlines : withNewlines + '\n';
}

function normalizeSpreadsheetId(maybeSpreadsheetId?: string) {
  const trimmed = (maybeSpreadsheetId || '').trim();
  if (!trimmed) return '';

  const urlMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch?.[1]) {
    return urlMatch[1];
  }

  return trimmed;
}

function getRangeSheetName(range: string) {
  return range.includes('!') ? range.split('!')[0] : range;
}

async function getSheetConfig() {
  const settings = await readAdminSettings();
  const spreadsheetId = normalizeSpreadsheetId(settings.googleSheetId || process.env.GOOGLE_SHEET_ID || '');
  return {
    spreadsheetId,
    range: settings.googleSheetRange || process.env.GOOGLE_SHEET_RANGE || 'Sheet1!A:J',
    contactRange:
      settings.googleSheetRangeContact || process.env.GOOGLE_SHEET_RANGE_CONTACT || 'Contact!A:D',
    commentsRange:
      settings.googleSheetRangeComments || process.env.GOOGLE_SHEET_RANGE_COMMENTS || 'Comments!A:F',
  };
}

// Khởi tạo Google Sheets API client
// Các nguồn credentials được ưu tiên theo thứ tự:
// 1) GOOGLE_SERVICE_ACCOUNT_KEY_JSON (toàn bộ file JSON)
// 2) GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 (toàn bộ file JSON ở dạng base64)
// 3) GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY

type ServiceAccountCreds = {
  client_email: string;
  private_key: string;
};

type ResolvedCredsMeta = {
  source: 'GOOGLE_SERVICE_ACCOUNT_KEY_JSON' | 'GOOGLE_SERVICE_ACCOUNT_JSON_BASE64' | 'GOOGLE_SERVICE_ACCOUNT_KEY_FILE' | 'GOOGLE_CLIENT_EMAIL/GOOGLE_PRIVATE_KEY';
  projectId?: string;
};

let resolvedCredsMeta: ResolvedCredsMeta | undefined;

let resolvedCreds: ServiceAccountCreds | undefined;

// 1) Direct JSON
const directJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON;
if (directJson) {
  try {
    const parsed = JSON.parse(directJson);
    if (parsed.client_email && parsed.private_key) {
      resolvedCreds = {
        client_email: String(parsed.client_email),
        private_key: normalizePrivateKey(String(parsed.private_key)) as string,
      };
      resolvedCredsMeta = {
        source: 'GOOGLE_SERVICE_ACCOUNT_KEY_JSON',
        projectId: parsed.project_id ? String(parsed.project_id) : undefined,
      };
      console.log('Using Google Sheets credentials from GOOGLE_SERVICE_ACCOUNT_KEY_JSON.');
    }
  } catch (e) {
    console.warn('Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY_JSON. Will try other credential sources.');
  }
}

// 2) Base64 JSON
if (!resolvedCreds) {
  const base64Json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 || process.env.GOOGLE_SERVICE_ACCOUNT_BASE64;
  if (base64Json) {
    try {
      const jsonString = Buffer.from(base64Json, 'base64').toString('utf8');
      const parsed = JSON.parse(jsonString);
      if (parsed.client_email && parsed.private_key) {
        resolvedCreds = {
          client_email: String(parsed.client_email),
          private_key: normalizePrivateKey(String(parsed.private_key)) as string,
        };
        resolvedCredsMeta = {
          source: 'GOOGLE_SERVICE_ACCOUNT_JSON_BASE64',
          projectId: parsed.project_id ? String(parsed.project_id) : undefined,
        };
        console.log('Using Google Sheets credentials from GOOGLE_SERVICE_ACCOUNT_JSON_BASE64.');
      }
    } catch (e) {
      console.warn('Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON_BASE64. Will try other credential sources.');
    }
  }
}

// 3) Key file
if (!resolvedCreds) {
  const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;
  if (keyFile) {
    try {
      const raw = fs.readFileSync(keyFile, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed.client_email && parsed.private_key) {
        resolvedCreds = {
          client_email: String(parsed.client_email),
          private_key: normalizePrivateKey(String(parsed.private_key)) as string,
        };
        resolvedCredsMeta = {
          source: 'GOOGLE_SERVICE_ACCOUNT_KEY_FILE',
          projectId: parsed.project_id ? String(parsed.project_id) : undefined,
        };
        console.log('Using Google Sheets credentials from GOOGLE_SERVICE_ACCOUNT_KEY_FILE.');
      }
    } catch (e) {
      console.warn('Failed to read GOOGLE_SERVICE_ACCOUNT_KEY_FILE. Will try other credential sources.');
    }
  }
}

// 4) Raw env pair
if (!resolvedCreds) {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const normalizedPrivateKey = normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY);
  const isEnvCredsValid = Boolean(
    clientEmail &&
    normalizedPrivateKey &&
    normalizedPrivateKey.includes('BEGIN PRIVATE KEY') &&
    normalizedPrivateKey.includes('END PRIVATE KEY') &&
    clientEmail.includes('@') &&
    clientEmail.endsWith('.gserviceaccount.com')
  );
  if (clientEmail || process.env.GOOGLE_PRIVATE_KEY) {
    if (!isEnvCredsValid) {
      console.warn('Env credentials detected but invalid. No credentials available.');
    } else {
      resolvedCreds = {
        client_email: clientEmail as string,
        private_key: normalizedPrivateKey as string,
      };
      resolvedCredsMeta = {
        source: 'GOOGLE_CLIENT_EMAIL/GOOGLE_PRIVATE_KEY',
      };
      console.log('Using Google Sheets credentials from environment variables.');
    }
  }
}

let sheets: ReturnType<typeof google.sheets> | null = null;

if (!resolvedCreds) {
  console.warn('No valid Google Sheets credentials found. Google Sheets write/read operations will be disabled.');
} else {
  const metaMsg = `${resolvedCredsMeta?.source || 'unknown-source'}${resolvedCredsMeta?.projectId ? ` (project_id=${resolvedCredsMeta.projectId})` : ''}`;
  console.log(`Google Sheets credential source resolved: ${metaMsg}`);
  const auth = new google.auth.GoogleAuth({
    credentials: resolvedCreds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  sheets = google.sheets({ version: 'v4', auth });
}

function formatGoogleSheetsReadError(
  error: unknown,
  context?: {
    spreadsheetId?: string;
    range?: string;
  }
): Error {
  const err = error as any;
  const code = err?.code ?? err?.status;
  const rawMessage = String(err?.message || err || 'Unknown Google Sheets error');

  const apiDisabledMatch = rawMessage.match(/project\s+(\d+)/i);
  const disabledProjectNumber = apiDisabledMatch?.[1];
  const looksLikeApiDisabled =
    code === 403 &&
    (/has not been used in project/i.test(rawMessage) || /is disabled/i.test(rawMessage));

  if (looksLikeApiDisabled) {
    const projectHint = disabledProjectNumber
      ? `project number ${disabledProjectNumber}`
      : 'the active Google Cloud project';
    const sourceHint = resolvedCredsMeta
      ? `Credential source: ${resolvedCredsMeta.source}${resolvedCredsMeta.projectId ? ` (project_id=${resolvedCredsMeta.projectId})` : ''}.`
      : 'Credential source could not be determined.';

    return new Error(
      `Google Sheets API is disabled for ${projectHint}. Enable sheets.googleapis.com in Google Cloud Console and retry in a few minutes. ${sourceHint}`
    );
  }

  if (code === 404 || /Requested entity was not found/i.test(rawMessage)) {
    const rangeHint = context?.range ? ` Range: ${context.range}.` : '';
    const spreadsheetHint = context?.spreadsheetId
      ? ` Spreadsheet ID: ${context.spreadsheetId}.`
      : '';
    const sheetNameHint = context?.range
      ? ` Expected tab: ${getRangeSheetName(context.range)}.`
      : '';

    return new Error(
      `Google Sheet not found or not accessible.${spreadsheetHint}${rangeHint}${sheetNameHint} Check that the spreadsheet ID is correct, the service account has been shared on that spreadsheet, and the tab name in the range exists exactly.`
    );
  }

  return new Error(`Failed to read from Google Sheet: ${rawMessage}`);
}

export interface ApplicationData {
  fullName: string;
  birthDate: string;
  gender: string;
  studentId: string;
  className: string;
  schoolEmail: string;
  phone: string;
  facebookLink: string;
  currentAddress: string;
  transport: string;
  healthIssues: string;
  strengthsWeaknesses: string;
  specialSkills: string;
  
  impression: string;
  experience: string;
  extrovert: string;
  teamwork: string;
  department: string;
  deptQuestion1: string;
  deptQuestion2: string;
}

export interface ContactData {
  name: string;
  email: string;
  message: string;
}

export interface CommentData {
  name: string;
  comment: string;
  parentId?: number;
  isAnonymous: boolean;
  timestamp: string;
}

export async function appendApplicationToSheet(applicationData: ApplicationData) {
  try {
    const config = await getSheetConfig();
    const spreadsheetId = config.spreadsheetId;
    const range = config.range;

    if (!spreadsheetId || spreadsheetId === 'demo_sheet_id_replace_with_real_one' || spreadsheetId === 'your_google_sheet_id_here') {
      console.warn('Google Sheets not configured properly. Data would be saved to:', applicationData);
      return { success: false, message: 'Google Sheets chưa được cấu hình: thiếu GOOGLE_SHEET_ID' };
    }

    // Chuẩn bị dữ liệu để ghi vào sheet
    const values = [
      [
        new Date().toLocaleString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: "Asia/Ho_Chi_Minh" }),
        applicationData.fullName,
        applicationData.birthDate,
        applicationData.gender,
        applicationData.studentId,
        applicationData.className,
        applicationData.schoolEmail,
        applicationData.phone,
        applicationData.facebookLink,
        applicationData.currentAddress,
        applicationData.transport,
        applicationData.healthIssues,
        applicationData.strengthsWeaknesses,
        applicationData.specialSkills,
        
        applicationData.impression,
        applicationData.experience,
        applicationData.extrovert,
        applicationData.teamwork,
        applicationData.department,
        applicationData.deptQuestion1,
        applicationData.deptQuestion2,
      ]
    ];

    if (!sheets) {
      console.warn('Google Sheets client not initialized.');
      return { success: false, message: 'Google Sheets client not initialized' };
    }

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    });

    console.log('Data appended successfully:', response.data);
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
    return { success: true, message: 'Data written to Google Sheet successfully', sheetUrl };

  } catch (error) {
    console.error('Error writing to Google Sheet:', error);
    throw new Error(`Failed to write to Google Sheet: ${error}`);
  }
}

export async function appendContactToSheet(contactData: ContactData) {
  try {
    const config = await getSheetConfig();
    const spreadsheetId = config.spreadsheetId;
    const range = config.contactRange;

    if (!spreadsheetId || spreadsheetId === 'demo_sheet_id_replace_with_real_one' || spreadsheetId === 'your_google_sheet_id_here') {
      console.warn('Google Sheets not configured properly. Data would be saved to:', contactData);
      return { success: false, message: 'Google Sheets chưa được cấu hình: thiếu GOOGLE_SHEET_ID' };
    }

    // Chuẩn bị dữ liệu để ghi vào sheet
    const values = [
      [
        new Date().toISOString(), // Timestamp
        contactData.name,
        contactData.email,
        contactData.message,
      ]
    ];

    if (!sheets) {
      console.warn('Google Sheets client not initialized.');
      return { success: false, message: 'Google Sheets client not initialized' };
    }

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    });

    console.log('Contact data appended successfully:', response.data);
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
    return { success: true, message: 'Contact data written to Google Sheet successfully', sheetUrl };

  } catch (error) {
    console.error('Error writing contact data to Google Sheet:', error);
    throw new Error(`Failed to write contact data to Google Sheet: ${error}`);
  }
}

export async function getSheetData(limit: number = 500) {
  try {
    const config = await getSheetConfig();
    const spreadsheetId = config.spreadsheetId;
    const range = config.range;

    if (!spreadsheetId || spreadsheetId === 'demo_sheet_id_replace_with_real_one') {
      console.warn('Google Sheets not configured properly. Returning demo data.');
      return [
        ['Timestamp', 'Họ và Tên', 'Email', 'Phone', 'Facebook', 'Lý do', 'Kỳ vọng', 'Tình huống', 'Ban'],
        ['2024-01-01T00:00:00.000Z', 'Demo User', 'demo@example.com', '0123456789', 'https://facebook.com/demo', 'Demo reason', 'Demo expectation', 'Demo situation', 'Demo department']
      ];
    }

    if (!sheets) {
      console.warn('Google Sheets client not initialized. Returning demo data.');
      return [
        ['Timestamp', 'Họ và Tên', 'Email', 'Phone', 'Facebook', 'Lý do', 'Kỳ vọng', 'Tình huống', 'Ban'],
        ['2024-01-01T00:00:00.000Z', 'Demo User', 'demo@example.com', '0123456789', 'https://facebook.com/demo', 'Demo reason', 'Demo expectation', 'Demo situation', 'Demo department']
      ];
    }

    // Apply row limit to prevent memory exhaustion: fetch with limit (header + data rows)
    // E.g., limit=500 means header + 499 data rows
    const rangeWithLimit = `${range.split('!')[0]}!A1:Z${limit}`;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: rangeWithLimit,
    });

    return response.data.values || [];
  } catch (error) {
    console.error('Error reading from Google Sheet:', error);
    throw formatGoogleSheetsReadError(error, { spreadsheetId, range: rangeWithLimit });
  }
}

export async function appendCommentToSheet(commentData: CommentData) {
  try {
    const config = await getSheetConfig();
    const spreadsheetId = config.spreadsheetId;
    const range = config.commentsRange;

    if (!spreadsheetId || spreadsheetId === 'demo_sheet_id_replace_with_real_one' || spreadsheetId === 'your_google_sheet_id_here') {
      console.warn('Google Sheets not configured properly. Data would be saved to:', commentData);
      return { success: false, message: 'Google Sheets chưa được cấu hình: thiếu GOOGLE_SHEET_ID' };
    }

    const values = [
      [
        commentData.timestamp,
        commentData.isAnonymous ? 'Ẩn danh' : commentData.name,
        commentData.comment,
        commentData.parentId || '',
        commentData.isAnonymous.toString(),
        commentData.name,
      ]
    ];

    if (!sheets) {
      console.warn('Google Sheets client not initialized.');
      return { success: false, message: 'Google Sheets client not initialized' };
    }

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    });

    console.log('Comment data appended successfully:', response.data);
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
    return { success: true, message: 'Comment data written to Google Sheet successfully', sheetUrl };

  } catch (error) {
    console.error('Error writing comment data to Google Sheet:', error);
    throw new Error(`Failed to write comment data to Google Sheet: ${error}`);
  }
}

export async function getCommentsFromSheet(): Promise<CommentData[]> {
  try {
    const config = await getSheetConfig();
    const spreadsheetId = config.spreadsheetId;
    const range = config.commentsRange;

    if (!spreadsheetId || spreadsheetId === 'demo_sheet_id_replace_with_real_one') {
      console.warn('Google Sheets not configured properly. Returning demo data.');
      return [];
    }

    if (!sheets) {
      console.warn('Google Sheets client not initialized. Returning demo data.');
      return [];
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];
    if (rows.length <= 1) return []; // Skip header row

    return rows.slice(1).map((row, index) => ({
      name: row[5] || 'Ẩn danh', // Actual name
      comment: row[2] || '',
      parentId: row[3] ? parseInt(row[3]) : undefined,
      isAnonymous: row[4] === 'true',
      timestamp: row[0] || new Date().toISOString(),
    }));

  } catch (error) {
    console.error('Error reading comments from Google Sheet:', error);
    return [];
  }
}

// ------------------------------------------------------------------
// Template-driven submission writer (primary storage for /apply forms)
// Columns written: timestamp | templateId | fullName | birthDate |
//   className | studentId | email | gender | department | photoUrl |
//   personalAns1-5 | deptAns1-3
// ------------------------------------------------------------------

export interface TemplateSubmissionData {
  templateId: string;
  fullName: string;
  birthDate: string;
  className: string;
  studentId: string;
  email: string;
  gender: string;
  department: string;
  photoUrl: string;
  optionalPersonalAnswers: string[];
  deptOptionalAnswers: string[];
}

export async function appendSubmissionToSheet(
  data: TemplateSubmissionData
): Promise<{ success: boolean; message: string }> {
  try {
    const config = await getSheetConfig();
    const { spreadsheetId } = config;

    if (
      !spreadsheetId ||
      spreadsheetId === 'demo_sheet_id_replace_with_real_one' ||
      spreadsheetId === 'your_google_sheet_id_here'
    ) {
      return { success: false, message: 'Google Sheets chưa được cấu hình: thiếu GOOGLE_SHEET_ID' };
    }

    if (!sheets) {
      return { success: false, message: 'Google Sheets client not initialized' };
    }

    const row = [
      new Date().toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Ho_Chi_Minh' }),
      data.templateId,
      data.fullName,
      data.birthDate,
      data.className,
      data.studentId,
      data.email,
      data.gender,
      data.department,
      data.photoUrl,
      ...Array.from({ length: 5 }, (_, i) => data.optionalPersonalAnswers[i] ?? ''),
      ...Array.from({ length: 3 }, (_, i) => data.deptOptionalAnswers[i] ?? ''),
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: config.range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [row] },
    });

    return { success: true, message: 'Đơn ứng tuyển đã được ghi vào Google Sheets' };
  } catch (error) {
    console.error('Error writing submission to Google Sheet:', error);
    return { success: false, message: error instanceof Error ? error.message : String(error) };
  }
}
