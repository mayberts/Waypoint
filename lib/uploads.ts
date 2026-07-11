import { createHash } from "node:crypto";
import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";

export const UPLOADS_DIR = path.resolve(
  process.env.UPLOADS_DIR || path.join(/* turbopackIgnore: true */ process.cwd(), "data", "uploads")
);

export const MAX_FAVICON_BYTES = 2 * 1024 * 1024; // 2MB
export const MAX_COVER_BYTES = 10 * 1024 * 1024; // 10MB

interface Sniffed {
  ext: string;
  contentType: string;
}

/** Identify an image by magic bytes rather than trusting a client-supplied content-type. */
export function sniffImageType(buf: Buffer): Sniffed | null {
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { ext: "png", contentType: "image/png" };
  }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { ext: "jpg", contentType: "image/jpeg" };
  }
  if (buf.length >= 6 && buf.toString("ascii", 0, 6) === "GIF87a") return { ext: "gif", contentType: "image/gif" };
  if (buf.length >= 6 && buf.toString("ascii", 0, 6) === "GIF89a") return { ext: "gif", contentType: "image/gif" };
  if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    return { ext: "webp", contentType: "image/webp" };
  }
  if (buf.length >= 4 && buf[0] === 0x00 && buf[1] === 0x00 && buf[2] === 0x01 && buf[3] === 0x00) {
    return { ext: "ico", contentType: "image/x-icon" };
  }
  // SVG is text; sniff the first non-whitespace bytes for an <svg or <?xml declaration.
  const head = buf.subarray(0, 512).toString("utf8").trimStart().toLowerCase();
  if (head.startsWith("<svg") || (head.startsWith("<?xml") && head.includes("<svg"))) {
    return { ext: "svg", contentType: "image/svg+xml" };
  }
  return null;
}

/** Save an image buffer content-addressed by its sha256 hash; returns the public /uploads path. */
export async function saveImageBuffer(buf: Buffer, maxBytes: number): Promise<string> {
  if (buf.length === 0) throw new Error("Empty file");
  if (buf.length > maxBytes) throw new Error(`File exceeds ${maxBytes} byte limit`);

  const sniffed = sniffImageType(buf);
  if (!sniffed) throw new Error("File is not a recognized image type");

  const hash = createHash("sha256").update(buf).digest("hex").slice(0, 32);
  const filename = `${hash}.${sniffed.ext}`;
  const filePath = path.join(UPLOADS_DIR, filename);

  await mkdir(UPLOADS_DIR, { recursive: true });
  try {
    await access(filePath);
  } catch {
    await writeFile(filePath, buf);
  }

  return `/uploads/${filename}`;
}

const EXT_CONTENT_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  ico: "image/x-icon",
  svg: "image/svg+xml",
};

export function contentTypeForExt(ext: string): string {
  return EXT_CONTENT_TYPES[ext.toLowerCase()] || "application/octet-stream";
}
