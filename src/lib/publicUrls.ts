function normalizeHttpUrl(raw: string | undefined | null): string | null {
  const value = String(raw ?? "").trim();
  if (!value) return null;

  if (value.startsWith("http://") || value.startsWith("https://")) return value;

  // Allow setting envs as "example.com" or "example.com/admin"
  if (/^[a-z0-9.-]+(?::\d+)?(\/.*)?$/i.test(value)) {
    return `https://${value}`;
  }

  return null;
}

function getVercelBaseUrl(): string | null {
  const production = normalizeHttpUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  if (production) return production;

  // Vercel provides "VERCEL_URL" without protocol (e.g. "my-app.vercel.app")
  const vercel = normalizeHttpUrl(process.env.VERCEL_URL);
  if (vercel) return vercel;

  // Sometimes users set NEXT_PUBLIC_VERCEL_URL similarly
  const nextPublicVercel = normalizeHttpUrl(process.env.NEXT_PUBLIC_VERCEL_URL);
  if (nextPublicVercel) return nextPublicVercel;

  return null;
}

export function getFrontendUrlString(): string {
  return (
    normalizeHttpUrl(process.env.NEXT_PUBLIC_FRONTEND_URL) ||
    getVercelBaseUrl() ||
    "http://localhost:9002"
  );
}

export function getAdminUrlString(): string {
  return (
    normalizeHttpUrl(process.env.NEXT_PUBLIC_ADMIN_URL) ||
    `${getFrontendUrlString().replace(/\/$/, "")}/admin`
  );
}

export function getMetadataBaseUrl(): URL {
  try {
    return new URL(getFrontendUrlString());
  } catch {
    return new URL("http://localhost:9002");
  }
}
