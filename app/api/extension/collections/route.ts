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

  const collections = await prisma.collection.findMany({
    select: { id: true, name: true, parentId: true },
    orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
  });
  return NextResponse.json(collections, { headers: CORS_HEADERS });
}
