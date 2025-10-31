// Simple in-memory cache for Backblaze B2 authorize_account response
// This reduces repeated calls to b2_authorize_account and helps avoid transaction cap issues.

type B2Auth = {
  authorizationToken: string;
  apiUrl: string;
  downloadUrl: string;
  [key: string]: unknown;
};

let cached: { data: B2Auth; expiresAt: number } | null = null;

const DEFAULT_TTL_MS = (() => {
  // default to ~23 hours to be conservative (Backblaze tokens are long-lived)
  return 23 * 60 * 60 * 1000;
})();

export async function getB2Auth(): Promise<B2Auth> {
  const now = Date.now();
  const envTtl = process.env.B2_AUTH_TTL_MS ? parseInt(process.env.B2_AUTH_TTL_MS, 10) : NaN;
  const ttl = Number.isFinite(envTtl) ? envTtl : DEFAULT_TTL_MS;

  if (cached && cached.expiresAt > now) return cached.data;

  const keyId = process.env.B2_KEY_ID || process.env.NEXT_PUBLIC_B2_KEY_ID;
  const appKey = process.env.B2_APPLICATION_KEY || process.env.NEXT_PUBLIC_B2_APPLICATION_KEY;

  if (!keyId || !appKey) {
    const err = new Error("Missing Backblaze credentials in environment variables") as Error & { status?: number; body?: unknown };
    err.status = 500;
    throw err;
  }

  const res = await fetch("https://api.backblazeb2.com/b2api/v2/b2_authorize_account", {
    headers: {
      Authorization: "Basic " + Buffer.from(`${keyId}:${appKey}`).toString("base64"),
    },
  });

  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      body = await res.text().catch(() => null);
    }

    const err = new Error("B2 authorize failed") as Error & { status?: number; body?: unknown };
    err.status = res.status;
    err.body = body;
    throw err;
  }

  const data = await res.json();

  if (!data.authorizationToken || !data.apiUrl || !data.downloadUrl) {
    const err = new Error("Authorization response missing expected fields") as Error & { status?: number; body?: unknown };
    err.status = 502;
    err.body = data;
    throw err;
  }

  cached = { data, expiresAt: Date.now() + ttl };
  return data as B2Auth;
}

export function clearB2AuthCache() {
  cached = null;
}
