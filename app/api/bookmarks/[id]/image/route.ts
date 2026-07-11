import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { saveImageBuffer, MAX_FAVICON_BYTES, MAX_COVER_BYTES } from "@/lib/uploads";

// Manual favicon/cover upload — overrides whatever was auto-fetched.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await prisma.bookmark.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const form = await req.formData().catch(() => null);
  const type = form?.get("type");
  const file = form?.get("file");

  if ((type !== "favicon" && type !== "cover") || !(file instanceof File)) {
    return NextResponse.json({ error: "Expected form fields: type ('favicon'|'cover'), file" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const maxBytes = type === "favicon" ? MAX_FAVICON_BYTES : MAX_COVER_BYTES;

  let path: string;
  try {
    path = await saveImageBuffer(buf, maxBytes);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload failed" }, { status: 400 });
  }

  const bookmark = await prisma.bookmark.update({
    where: { id },
    data: type === "favicon" ? { faviconPath: path } : { coverImagePath: path },
  });

  return NextResponse.json(bookmark);
}
