// Shared with Edge middleware: use Web Crypto instead of Node-only APIs.
async function digest(value: string) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

export async function loginVersion() {
  const { LOGIN_USER, LOGIN_PASSWORD, AUTH_SECRET } = process.env;
  if (!LOGIN_USER?.trim() || !LOGIN_PASSWORD || LOGIN_PASSWORD.length < 12 || !AUTH_SECRET) return null;
  const bytes = await digest(JSON.stringify([LOGIN_USER.trim(), LOGIN_PASSWORD, AUTH_SECRET]));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sameSecret(left: string, right: string) {
  const [a, b] = await Promise.all([digest(left), digest(right)]);
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  return difference === 0;
}

// Single-owner application: cap attempts per process, without trusting proxy IP headers.
// Multi-instance deployments should also enforce a shared proxy/service rate limit.
export function createLoginVerifier() {
  let windowStart = 0;
  let attempts = 0;
  return async (credentials: Partial<Record<string, unknown>>) => {
    if (!await loginVersion()) return null;
    const now = Date.now();
    if (now - windowStart >= 5 * 60 * 1000) { windowStart = now; attempts = 0; }
    if (attempts >= 10) return null;
    attempts++;
    if (typeof credentials.username !== "string" || typeof credentials.password !== "string" ||
        credentials.username.length > 200 || credentials.password.length > 1024) return null;
    const [userMatches, passwordMatches] = await Promise.all([
      sameSecret(credentials.username.trim(), process.env.LOGIN_USER!.trim()),
      sameSecret(credentials.password, process.env.LOGIN_PASSWORD!),
    ]);
    if (!userMatches || !passwordMatches) return null;
    attempts = 0;
    return { id: "wallet-owner", name: process.env.LOGIN_USER!.trim() };
  };
}
