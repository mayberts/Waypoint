import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createBookmark, CollectionNotFoundError } from "@/lib/create-bookmark";
import { requireApiToken } from "@/lib/extension-auth";
import { CORS_HEADERS, corsPreflight } from "@/lib/cors";

export async function OPTIONS() {
  return corsPreflight();
}

const schema = z.object({
  url: z.string().trim().url(),
  title: z.string().trim().max(500).optional(),
  note: z.string().trim().max(5000).optional(),
  collectionId: z.string().nullable().optional(),
  tags: z.array(z.string().trim().max(50)).max(50).optional(),
});

export async function POST(req: NextRequest) {
  const authError = await requireApiToken(req);
  if (authError) return authError;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400, headers: CORS_HEADERS });
  }

  try {
    const bookmark = await createBookmark(parsed.data);
    return NextResponse.json(bookmark, { status: 201, headers: CORS_HEADERS });
  } catch (err) {
    if (err instanceof CollectionNotFoundError) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404, headers: CORS_HEADERS });
    }
    throw err;
  }
}
