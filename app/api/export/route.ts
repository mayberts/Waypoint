import { NextResponse } from "next/server";
import { buildNetscapeExport } from "@/lib/netscape-export";

export async function GET() {
  const html = await buildNetscapeExport();
  const filename = `waypoint-export-${new Date().toISOString().slice(0, 10)}.html`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
