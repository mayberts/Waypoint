import { prisma } from "./db";

export async function resolveTagIds(names: string[]): Promise<string[]> {
  const clean = Array.from(new Set(names.map((n) => n.trim().toLowerCase()).filter(Boolean)));
  if (clean.length === 0) return [];

  const tags = await Promise.all(
    clean.map((name) => prisma.tag.upsert({ where: { name }, update: {}, create: { name } }))
  );
  return tags.map((t) => t.id);
}
