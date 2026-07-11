import { NextRequest, NextResponse } from "next/server";
import { isValidApiToken } from "./settings";
import { CORS_HEADERS } from "./cors";

/** Returns an error response if the request's bearer token is missing/invalid, else null. */
export async function requireApiToken(req: NextRequest): Promise<NextResponse | null> {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!(await isValidApiToken(token))) {
    return NextResponse.json({ error: "Invalid or missing API token" }, { status: 401, headers: CORS_HEADERS });
  }
  return null;
}
