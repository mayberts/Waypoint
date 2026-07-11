import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { importNetscapeHtml } from "@/lib/netscape-import";

const MAX_IMPORT_BYTES = 20 * 1024 * 1024; // 20MB

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const parentId = form?.get("parentId");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Expected a multipart form field named 'file'" }, { status: 400 });
  }
  if (file.size > MAX_IMPORT_BYTES) {
    return NextResponse.json({ error: `File exceeds ${MAX_IMPORT_BYTES} byte limit` }, { status: 400 });
  }

  const targetParentId = typeof parentId === "string" && parentId ? parentId : null;
  if (targetParentId) {
    const collection = await prisma.collection.findUnique({ where: { id: targetParentId } });
    if (!collection) return NextResponse.json({ error: "Target collection not found" }, { status: 404 });
  }

  const html = await file.text();
  const result = await importNetscapeHtml(html, targetParentId);

  return NextResponse.json(result);
}
