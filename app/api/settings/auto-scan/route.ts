import { NextRequest, NextResponse } from "next/server";
import { getAutoScanSettings, setAutoScanEnabled, setAutoScanIntervalHours } from "@/lib/settings";

export async function GET() {
  const settings = await getAutoScanSettings();
  return NextResponse.json({
    autoScanEnabled: settings.autoScanEnabled,
    autoScanIntervalHours: settings.autoScanIntervalHours,
    lastAutoScanAt: settings.lastAutoScanAt?.toISOString() ?? null,
  });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 });
  }

  try {
    const result: Record<string, unknown> = {};
    if (typeof body.autoScanEnabled === "boolean") result.autoScanEnabled = await setAutoScanEnabled(body.autoScanEnabled);
    if (typeof body.autoScanIntervalHours === "number") {
      result.autoScanIntervalHours = await setAutoScanIntervalHours(body.autoScanIntervalHours);
    }

    if (Object.keys(result).length === 0) {
      return NextResponse.json({ error: "No recognized auto-scan fields in body" }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Invalid auto-scan value" }, { status: 400 });
  }
}
