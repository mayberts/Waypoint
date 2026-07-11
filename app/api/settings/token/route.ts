import { NextResponse } from "next/server";
import { getOrCreateApiToken, regenerateApiToken } from "@/lib/settings";

export async function GET() {
  const token = await getOrCreateApiToken();
  return NextResponse.json({ token });
}

export async function POST() {
  const token = await regenerateApiToken();
  return NextResponse.json({ token });
}
