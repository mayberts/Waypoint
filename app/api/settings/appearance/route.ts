import { NextRequest, NextResponse } from "next/server";
import {
  getAccentColor,
  setAccentColor,
  getColorScheme,
  setColorScheme,
  getDensity,
  setDensity,
  getGridPattern,
  setGridPattern,
  getLandingSettings,
  setLandingSettings,
} from "@/lib/settings";

export async function GET() {
  const [accentColor, colorScheme, density, gridPattern, landing] = await Promise.all([
    getAccentColor(),
    getColorScheme(),
    getDensity(),
    getGridPattern(),
    getLandingSettings(),
  ]);
  return NextResponse.json({ accentColor, colorScheme, density, gridPattern, ...landing });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 });
  }

  try {
    const result: Record<string, unknown> = {};
    if (typeof body.accentColor === "string") result.accentColor = await setAccentColor(body.accentColor);
    if (typeof body.colorScheme === "string") result.colorScheme = await setColorScheme(body.colorScheme);
    if (typeof body.density === "string") result.density = await setDensity(body.density);
    if (typeof body.gridPattern === "string") result.gridPattern = await setGridPattern(body.gridPattern);
    if (typeof body.defaultLandingView === "string") {
      const collectionId = typeof body.defaultLandingCollectionId === "string" ? body.defaultLandingCollectionId : null;
      Object.assign(result, await setLandingSettings(body.defaultLandingView, collectionId));
    }

    if (Object.keys(result).length === 0) {
      return NextResponse.json({ error: "No recognized appearance fields in body" }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Invalid appearance value" }, { status: 400 });
  }
}
