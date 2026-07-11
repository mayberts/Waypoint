import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { saveImageBuffer, MAX_COVER_BYTES } from "@/lib/uploads";

// Custom collection icon upload — stored the same way as bookmark covers.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await prisma.collection.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Expected a multipart form field named 'file'" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());

  let path: string;
  try {
    path = await saveImageBuffer(buf, MAX_COVER_BYTES);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload failed" }, { status: 400 });
  }

  const collection = await prisma.collection.update({ where: { id }, data: { icon: path } });
  return NextResponse.json(collection);
}
