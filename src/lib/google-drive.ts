import { google, drive_v3 } from "googleapis";
import fs from "fs";

type ServiceAccountCreds = {
  client_email: string;
  private_key: string;
};

function normalizePrivateKey(maybeKey?: string) {
  if (!maybeKey) return undefined;
  // If the key is quoted (e.g., "-----BEGIN...END PRIVATE KEY-----\n"), strip surrounding quotes
  const stripped =
    maybeKey.startsWith('"') && maybeKey.endsWith('"') ? maybeKey.slice(1, -1) : maybeKey;
  // Replace escaped newlines with real newlines
  const withNewlines = stripped.replace(/\\n/g, "\n").replace(/\r\n/g, "\n");
  return withNewlines.endsWith("\n") ? withNewlines : withNewlines + "\n";
}

async function resolveServiceAccountCreds(): Promise<ServiceAccountCreds | undefined> {
  // Prefer direct JSON
  const directJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON;
  if (directJson) {
    try {
      const parsed = JSON.parse(directJson);
      if (parsed.client_email && parsed.private_key) {
        return {
          client_email: String(parsed.client_email),
          private_key: normalizePrivateKey(String(parsed.private_key)) as string,
        };
      }
    } catch {
      // ignore
    }
  }

  // Base64 JSON
  const base64Json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64;
  if (base64Json) {
    try {
      const jsonString = Buffer.from(base64Json, "base64").toString("utf8");
      const parsed = JSON.parse(jsonString);
      if (parsed.client_email && parsed.private_key) {
        return {
          client_email: String(parsed.client_email),
          private_key: normalizePrivateKey(String(parsed.private_key)) as string,
        };
      }
    } catch {
      // ignore
    }
  }

  // Key file
  const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;
  if (keyFile) {
    try {
      const raw = await fs.promises.readFile(keyFile, "utf8");
      const parsed = JSON.parse(raw);
      if (parsed.client_email && parsed.private_key) {
        return {
          client_email: String(parsed.client_email),
          private_key: normalizePrivateKey(String(parsed.private_key)) as string,
        };
      }
    } catch {
      // ignore
    }
  }

  // Raw env pair
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const normalizedPrivateKey = normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY);
  if (
    clientEmail &&
    normalizedPrivateKey &&
    normalizedPrivateKey.includes("BEGIN PRIVATE KEY") &&
    normalizedPrivateKey.includes("END PRIVATE KEY") &&
    clientEmail.includes("@") &&
    clientEmail.endsWith(".gserviceaccount.com")
  ) {
    return {
      client_email: clientEmail,
      private_key: normalizedPrivateKey,
    };
  }

  return undefined;
}

let drive: drive_v3.Drive | null = null;

async function getDriveClient() {
  if (drive) return drive;

  const creds = await resolveServiceAccountCreds();
  if (!creds) {
    throw new Error(
      "Google Drive credentials not found. Set GOOGLE_SERVICE_ACCOUNT_KEY_JSON or GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 or GOOGLE_SERVICE_ACCOUNT_KEY_FILE (or GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY)."
    );
  }

  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  drive = google.drive({ version: "v3", auth });
  return drive;
}

export function extractDriveFolderId(input: string): string | null {
  const trimmed = (input || "").trim();
  if (!trimmed) return null;

  // If it looks like an id already
  if (/^[a-zA-Z0-9_-]{10,}$/.test(trimmed)) return trimmed;

  // Typical URLs:
  // https://drive.google.com/drive/folders/<id>
  // https://drive.google.com/open?id=<id>
  const m =
    trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);

  return m?.[1] ?? null;
}

export async function uploadFileToDrive(params: {
  folderId: string;
  filename: string;
  mimeType: string;
  buffer: Buffer;
}): Promise<{ url: string; driveFileId: string }> {
  const { folderId, filename, mimeType, buffer } = params;
  const client = await getDriveClient();

  const createRes = await client.files.create({
    requestBody: {
      name: filename,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: buffer,
    },
    fields: "id,webViewLink",
  });

  const driveFileId = String(createRes.data.id);
  const url = createRes.data.webViewLink || "";

  // Best-effort: make it readable (admin may need to share the folder with service account too).
  try {
    await client.permissions.create({
      fileId: driveFileId,
      requestBody: { role: "reader", type: "anyone" },
    });
  } catch {
    // If permission fails (common), we still return webViewLink; your folder/file must be publicly accessible.
  }

  return { url, driveFileId };
}

