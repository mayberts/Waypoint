import { NextRequest, NextResponse } from "next/server";
import { getTrashPurgeSettings, setTrashAutoPurgeEnabled, setTrashRetentionDays, markTrashPurgeRan } from "@/lib/settings";
import { purgeOldTrash } from "@/lib/trash-purge";

export async function GET() {
  const settings = await getTrashPurgeSettings();
  return NextResponse.json({
    trashAutoPurgeEnabled: settings.trashAutoPurgeEnabled,
    trashRetentionDays: settings.trashRetentionDays,
    lastTrashPurgeAt: settings.lastTrashPurgeAt?.toISOString() ?? null,
    lastTrashPurgeCount: settings.lastTrashPurgeCount,
  });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 });
  }

  try {
    const result: Record<string, unknown> = {};
    if (typeof body.trashAutoPurgeEnabled === "boolean") {
      result.trashAutoPurgeEnabled = await setTrashAutoPurgeEnabled(body.trashAutoPurgeEnabled);
    }
    if (typeof body.trashRetentionDays === "number") {
      result.trashRetentionDays = await setTrashRetentionDays(body.trashRetentionDays);
    }

    if (Object.keys(result).length === 0) {
      return NextResponse.json({ error: "No recognized trash-purge fields in body" }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Invalid trash-purge value" }, { status: 400 });
  }
}

// Manual "Purge old items now" — runs immediately using the currently
// configured retention period, rather than waiting for the next scheduler tick.
export async function POST() {
  const settings = await getTrashPurgeSettings();
  const count = await purgeOldTrash(settings.trashRetentionDays);
  await markTrashPurgeRan(count);
  return NextResponse.json({ purgedCount: count });
}
