import { NextResponse } from "next/server";
import { isAccountConfigured } from "@/lib/auth";

export async function GET() {
  return NextResponse.json({ configured: await isAccountConfigured() });
}
