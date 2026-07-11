// Seeds the built-in Twemoji icon library on first boot. Safe to run on
// every container start — it's a no-op once Settings.iconsSeeded is true.
import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes } from "node:crypto";
import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_DIR = path.join(__dirname, "seed-icons");
const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR || path.join(process.cwd(), "data", "uploads"));

const prisma = new PrismaClient();

async function saveImageBuffer(buf) {
  const hash = createHash("sha256").update(buf).digest("hex").slice(0, 32);
  const filename = `${hash}.png`;
  const filePath = path.join(UPLOADS_DIR, filename);
  await mkdir(UPLOADS_DIR, { recursive: true });
  try {
    await access(filePath);
  } catch {
    await writeFile(filePath, buf);
  }
  return `/uploads/${filename}`;
}

async function main() {
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (settings?.iconsSeeded) {
    console.log(">> icon library already seeded, skipping");
    return;
  }

  const entries = await readdir(SEED_DIR, { withFileTypes: true });
  let count = 0;

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const category = entry.name;
    const dir = path.join(SEED_DIR, category);
    const files = (await readdir(dir)).filter((f) => f.endsWith(".png"));

    for (const filename of files) {
      const buf = await readFile(path.join(dir, filename));
      const iconPath = await saveImageBuffer(buf);
      await prisma.iconAsset.create({ data: { category, path: iconPath, filename } });
      count++;
    }
  }

  if (settings) {
    await prisma.settings.update({ where: { id: 1 }, data: { iconsSeeded: true } });
  } else {
    await prisma.settings.create({
      data: { id: 1, apiToken: randomBytes(24).toString("base64url"), iconsSeeded: true },
    });
  }

  console.log(`>> seeded ${count} built-in icons`);
}

main()
  .catch((err) => {
    console.error(">> icon seeding failed:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
