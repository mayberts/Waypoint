import { NextResponse } from "next/server";
import { buildBackup } from "@/lib/backup-export";

export async function GET() {
  const backup = await buildBackup();
  const filename = `waypoint-backup-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(backup), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
