import { NextRequest, NextResponse } from "next/server";
import {
  createAccount,
  createSessionToken,
  getSessionSecret,
  isAccountConfigured,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  if (await isAccountConfigured()) {
    return NextResponse.json({ error: "An account already exists" }, { status: 409 });
  }

  const body = await req.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username : "";
  const password = typeof body?.password === "string" ? body.password : "";

  try {
    await createAccount(username, password);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Setup failed" }, { status: 400 });
  }

  const secret = await getSessionSecret();
  const token = await createSessionToken(secret);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(req));
  return res;
}
