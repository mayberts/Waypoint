import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, getSessionSecret, verifySessionToken } from "@/lib/auth";

// /manifest.webmanifest and the PWA icons must be public: browsers fetch the
// manifest (and the icons it references) without sending cookies, so gating
// them behind the session would break installability.
const PUBLIC_PATHS = ["/login", "/icon", "/manifest.webmanifest", "/pwa-icon"];
// /share/ and /api/share/ back the shareable-collection-link feature — the
// slug itself is the credential. /uploads/ is opened up too, since favicon
// and cover images referenced by a shared collection need to load for
// visitors who never log in; filenames are content-hashed, not enumerable.
const PUBLIC_PREFIXES = ["/api/auth/", "/api/extension/", "/_next/", "/share/", "/api/share/", "/uploads/", "/apple-icon"];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const secret = await getSessionSecret();
  const valid = await verifySessionToken(token, secret);

  if (valid) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", req.url);
  // Include the query string, not just the path — /quick-save?url=... (the
  // share-target landing page) is meaningless without it, so a share
  // arriving while logged out would otherwise survive the login roundtrip
  // with no URL left to save.
  if (pathname !== "/") loginUrl.searchParams.set("next", pathname + req.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
