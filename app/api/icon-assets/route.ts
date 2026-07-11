import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { saveImageBuffer, MAX_COVER_BYTES } from "@/lib/uploads";

export async function GET() {
  const assets = await prisma.iconAsset.findMany({ orderBy: [{ category: "asc" }, { filename: "asc" }] });
  return NextResponse.json(assets);
}

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const categoryRaw = form?.get("category");

  const category = typeof categoryRaw === "string" ? categoryRaw.trim().slice(0, 60) : "";
  if (!category) {
    return NextResponse.json({ error: "Expected a non-empty 'category' field" }, { status: 400 });
  }
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

  const asset = await prisma.iconAsset.create({
    data: { category, path, filename: file.name.slice(0, 200) },
  });
  return NextResponse.json(asset, { status: 201 });
}

// Bulk-remove a whole category, e.g. after uploading the wrong folder.
export async function DELETE(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category");
  if (!category) {
    return NextResponse.json({ error: "Expected a 'category' query param" }, { status: 400 });
  }
  const { count } = await prisma.iconAsset.deleteMany({ where: { category } });
  return NextResponse.json({ deleted: count });
}
