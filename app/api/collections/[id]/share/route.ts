import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Regenerates too, so re-POSTing an already-shared collection rotates the
// link — same "old links stop working" guarantee as the API token.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await prisma.collection.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const shareSlug = randomBytes(9).toString("base64url");
  const collection = await prisma.collection.update({ where: { id }, data: { shareSlug } });
  return NextResponse.json(collection);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await prisma.collection.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const collection = await prisma.collection.update({ where: { id }, data: { shareSlug: null } });
  return NextResponse.json(collection);
}
