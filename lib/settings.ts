import { randomBytes } from "node:crypto";
import { prisma } from "./db";
import { ACCENT_COLORS, DEFAULT_ACCENT_COLOR } from "./accent-colors";

export const COLOR_SCHEMES = ["dark", "light"] as const;
export const DENSITIES = ["comfortable", "compact"] as const;
export const GRID_PATTERNS = ["none", "dots", "grid", "diagonal"] as const;
export type ColorScheme = (typeof COLOR_SCHEMES)[number];
export type Density = (typeof DENSITIES)[number];
export type GridPattern = (typeof GRID_PATTERNS)[number];

async function upsertSetting(field: "accentColor" | "colorScheme" | "density" | "gridPattern", value: string) {
  await prisma.settings.upsert({
    where: { id: 1 },
    update: { [field]: value },
    create: { id: 1, apiToken: randomBytes(24).toString("base64url"), [field]: value },
  });
}

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

export async function getAccentColor(): Promise<string> {
  const existing = await prisma.settings.findUnique({ where: { id: 1 } });
  return existing?.accentColor ?? DEFAULT_ACCENT_COLOR;
}

export async function setAccentColor(value: string): Promise<string> {
  if (!ACCENT_COLORS.some((c) => c.value === value)) {
    throw new Error("Unknown accent color");
  }
  await upsertSetting("accentColor", value);
  return value;
}

export async function getColorScheme(): Promise<ColorScheme> {
  const existing = await prisma.settings.findUnique({ where: { id: 1 } });
  return (existing?.colorScheme as ColorScheme) ?? "dark";
}

export async function setColorScheme(value: string): Promise<ColorScheme> {
  if (!COLOR_SCHEMES.includes(value as ColorScheme)) {
    throw new Error("Unknown color scheme");
  }
  await upsertSetting("colorScheme", value);
  return value as ColorScheme;
}

export async function getDensity(): Promise<Density> {
  const existing = await prisma.settings.findUnique({ where: { id: 1 } });
  return (existing?.density as Density) ?? "comfortable";
}

export async function setDensity(value: string): Promise<Density> {
  if (!DENSITIES.includes(value as Density)) {
    throw new Error("Unknown density");
  }
  await upsertSetting("density", value);
  return value as Density;
}

export async function getGridPattern(): Promise<GridPattern> {
  const existing = await prisma.settings.findUnique({ where: { id: 1 } });
  return (existing?.gridPattern as GridPattern) ?? "none";
}

export async function setGridPattern(value: string): Promise<GridPattern> {
  if (!GRID_PATTERNS.includes(value as GridPattern)) {
    throw new Error("Unknown grid pattern");
  }
  await upsertSetting("gridPattern", value);
  return value as GridPattern;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
