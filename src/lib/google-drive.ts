import { google, drive_v3 } from "googleapis";
import fs from "fs";
import { Readable } from "stream";

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
  const stream = Readable.from(buffer);

  try {
    // Shared Drive compatibility: verify the folder can be reached by service account.
    const folderMeta = await client.files.get({
      fileId: folderId,
      fields: "id,name,driveId,capabilities(canAddChildren,canEdit)",
      supportsAllDrives: true,
    });

    if (!folderMeta.data.driveId) {
      throw new Error(
        "Target folder is not in a Shared Drive. Service accounts cannot upload reliably to personal My Drive due to storage quota limits."
      );
    }

    const createRes = await client.files.create({
      requestBody: {
        name: filename,
        parents: [folderId],
      },
      media: {
        mimeType,
        body: stream,
      },
      fields: "id,webViewLink",
      supportsAllDrives: true,
    });

    const driveFileId = String(createRes.data.id);
    const url = createRes.data.webViewLink || `https://drive.google.com/file/d/${driveFileId}/view`;

    // Best-effort: make it readable (admin may need to share the folder with service account too).
    try {
      await client.permissions.create({
        fileId: driveFileId,
        requestBody: { role: "reader", type: "anyone" },
        supportsAllDrives: true,
      });
    } catch {
      // If permission fails (common), we still return webViewLink; your folder/file must be publicly accessible.
    }

    return { url, driveFileId };
  } catch (e: any) {
    const message = String(e?.message || e);
    const code = e?.code;

    if (code === 403 && message.toLowerCase().includes("storage quota")) {
      throw new Error(
        "Google Drive upload blocked: service-account storage quota is unavailable. Use a Shared Drive folder and ensure the folder itself belongs to the Shared Drive, then grant the service account access."
      );
    }

    throw e;
  }
}

export async function checkGoogleDriveConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    const client = await getDriveClient();
    const about = await client.about.get({ fields: "user(emailAddress,displayName)" });
    const email = about.data.user?.emailAddress || "service-account";
    return { ok: true, message: `Google Drive connected (${email})` };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, message };
  }
}

