import { randomBytes } from "node:crypto";
import { prisma } from "./db";

function generateToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function getOrCreateApiToken(): Promise<string> {
  const existing = await prisma.settings.findUnique({ where: { id: 1 } });
  if (existing) return existing.apiToken;

  const created = await prisma.settings.create({ data: { id: 1, apiToken: generateToken() } });
  return created.apiToken;
}

export async function regenerateApiToken(): Promise<string> {
  const token = generateToken();
  await prisma.settings.upsert({
    where: { id: 1 },
    update: { apiToken: token },
    create: { id: 1, apiToken: token },
  });
  return token;
}

export async function isValidApiToken(token: string | null): Promise<boolean> {
  if (!token) return false;
  const current = await getOrCreateApiToken();
  return timingSafeEqual(token, current);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
