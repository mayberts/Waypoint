import { NextRequest, NextResponse } from "next/server";
import { getAccentColor, setAccentColor } from "@/lib/settings";

export async function GET() {
  const accentColor = await getAccentColor();
  return NextResponse.json({ accentColor });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const value = typeof body?.accentColor === "string" ? body.accentColor : null;
  if (!value) {
    return NextResponse.json({ error: "Expected an 'accentColor' field" }, { status: 400 });
  }

  try {
    const accentColor = await setAccentColor(value);
    return NextResponse.json({ accentColor });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Invalid accent color" }, { status: 400 });
  }
}
