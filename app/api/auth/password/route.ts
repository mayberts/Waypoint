import { NextRequest, NextResponse } from "next/server";
import { changePassword } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  try {
    await changePassword(currentPassword, newPassword);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to change password" }, { status: 400 });
  }
}
