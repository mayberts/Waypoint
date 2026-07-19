import { NextRequest, NextResponse } from "next/server";
import { restoreBackup, UnsupportedBackupVersionError } from "@/lib/backup-restore";
import type { BackupData } from "@/lib/backup-export";

// Generous relative to the Netscape import's 20MB cap: a full backup embeds
// every favicon, cover image, and custom icon library asset as base64, not
// just favicons, so a large personal library's file is legitimately bigger.
const MAX_BACKUP_BYTES = 500 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Expected a multipart form field named 'file'" }, { status: 400 });
  }
  if (file.size > MAX_BACKUP_BYTES) {
    return NextResponse.json({ error: `File exceeds ${MAX_BACKUP_BYTES} byte limit` }, { status: 400 });
  }

  let data: BackupData;
  try {
    data = JSON.parse(await file.text());
  } catch {
    return NextResponse.json({ error: "File is not valid JSON" }, { status: 400 });
  }

  try {
    const result = await restoreBackup(data);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof UnsupportedBackupVersionError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
