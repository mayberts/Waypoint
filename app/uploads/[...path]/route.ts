import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { UPLOADS_DIR, contentTypeForExt } from "@/lib/uploads";

const SAFE_FILENAME = /^[a-f0-9]{32}\.(png|jpg|jpeg|gif|webp|ico|svg)$/;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  const filename = segments.join("/");

  if (segments.length !== 1 || !SAFE_FILENAME.test(filename)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const uploadsDir = path.resolve(UPLOADS_DIR);
  const filePath = path.resolve(uploadsDir, filename);
  if (path.dirname(filePath) !== uploadsDir) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const buf = await readFile(filePath);
    const ext = filename.split(".").pop()!;
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": contentTypeForExt(ext),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
