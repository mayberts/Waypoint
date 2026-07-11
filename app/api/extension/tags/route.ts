import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiToken } from "@/lib/extension-auth";
import { CORS_HEADERS, corsPreflight } from "@/lib/cors";

export async function OPTIONS() {
  return corsPreflight();
}

export async function GET(req: NextRequest) {
  const authError = await requireApiToken(req);
  if (authError) return authError;

  const tags = await prisma.tag.findMany({ select: { name: true }, orderBy: { name: "asc" } });
  return NextResponse.json(tags.map((t) => t.name), { headers: CORS_HEADERS });
}
