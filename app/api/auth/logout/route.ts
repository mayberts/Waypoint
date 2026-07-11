import { NextResponse } from "next/server";
import { invalidateAllSessions, SESSION_COOKIE } from "@/lib/auth";

export async function POST() {
  await invalidateAllSessions();
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
