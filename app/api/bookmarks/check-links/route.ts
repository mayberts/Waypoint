import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { countUncheckedLinksSince, checkLinksBatch } from "@/lib/scan-jobs";

const querySchema = z.object({ since: z.coerce.number().int() });

export async function GET(req: NextRequest) {
  const parsed = querySchema.safeParse({ since: req.nextUrl.searchParams.get("since") ?? Date.now() });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const remaining = await countUncheckedLinksSince(new Date(parsed.data.since));
  return NextResponse.json({ remaining });
}

const bodySchema = z.object({
  since: z.number().int(),
  limit: z.number().int().min(1).max(50).default(20),
});

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const result = await checkLinksBatch(new Date(parsed.data.since), parsed.data.limit);
  return NextResponse.json(result);
}
