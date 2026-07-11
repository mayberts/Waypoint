import { randomBytes, scryptSync, timingSafeEqual as nodeTimingSafeEqual } from "node:crypto";
import { prisma } from "./db";

const SESSION_COOKIE = "waypoint_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export { SESSION_COOKIE };

/** `secure` only in production — dev/test runs over plain http://localhost, which
 *  browsers refuse to attach Secure cookies to. Behind a TLS-terminating reverse
 *  proxy in production, the browser's connection is genuinely HTTPS either way. */
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_TTL_MS / 1000,
};

function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

function verifyPasswordHash(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const candidate = scryptSync(password, salt, expected.length);
  if (candidate.length !== expected.length) return false;
  return nodeTimingSafeEqual(candidate, expected);
}

export async function isAccountConfigured(): Promise<boolean> {
  const existing = await prisma.settings.findUnique({ where: { id: 1 } });
  return !!existing?.authUsername && !!existing?.authPasswordHash;
}

export async function createAccount(username: string, password: string): Promise<void> {
  if (await isAccountConfigured()) {
    throw new Error("An account already exists");
  }
  if (username.trim().length < 1) throw new Error("Username is required");
  if (password.length < 8) throw new Error("Password must be at least 8 characters");

  await prisma.settings.upsert({
    where: { id: 1 },
    update: { authUsername: username.trim(), authPasswordHash: hashPassword(password) },
    create: {
      id: 1,
      apiToken: randomBytes(24).toString("base64url"),
      authUsername: username.trim(),
      authPasswordHash: hashPassword(password),
    },
  });
}

export async function verifyCredentials(username: string, password: string): Promise<boolean> {
  const existing = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!existing?.authUsername || !existing?.authPasswordHash) return false;
  if (username.trim() !== existing.authUsername) return false;
  return verifyPasswordHash(password, existing.authPasswordHash);
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const existing = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!existing?.authUsername || !existing?.authPasswordHash) {
    throw new Error("No account configured");
  }
  if (!verifyPasswordHash(currentPassword, existing.authPasswordHash)) {
    throw new Error("Current password is incorrect");
  }
  if (newPassword.length < 8) throw new Error("Password must be at least 8 characters");

  await prisma.settings.update({ where: { id: 1 }, data: { authPasswordHash: hashPassword(newPassword) } });
}

export async function getSessionSecret(): Promise<string> {
  const existing = await prisma.settings.findUnique({ where: { id: 1 } });
  if (existing?.sessionSecret) return existing.sessionSecret;

  const secret = randomBytes(32).toString("hex");
  await prisma.settings.upsert({
    where: { id: 1 },
    update: { sessionSecret: secret },
    create: { id: 1, apiToken: randomBytes(24).toString("base64url"), sessionSecret: secret },
  });
  return secret;
}

/** Rotates the session-signing secret, invalidating every existing session cookie. */
export async function invalidateAllSessions(): Promise<void> {
  const secret = randomBytes(32).toString("hex");
  await prisma.settings.upsert({
    where: { id: 1 },
    update: { sessionSecret: secret },
    create: { id: 1, apiToken: randomBytes(24).toString("base64url"), sessionSecret: secret },
  });
}

function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return toHex(sig);
}

export async function createSessionToken(secret: string): Promise<string> {
  const expires = Date.now() + SESSION_TTL_MS;
  const signature = await hmacHex(secret, String(expires));
  return `${expires}.${signature}`;
}

export async function verifySessionToken(token: string | undefined, secret: string): Promise<boolean> {
  if (!token) return false;
  const [expiresRaw, signature] = token.split(".");
  if (!expiresRaw || !signature) return false;
  const expires = Number(expiresRaw);
  if (!Number.isFinite(expires) || Date.now() > expires) return false;

  const expected = await hmacHex(secret, expiresRaw);
  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return mismatch === 0;
}
