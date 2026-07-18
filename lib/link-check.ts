import { safeFetch } from "./safe-fetch";

// A WAF/bot gate (Cloudflare and similar) rejecting an automated request
// with 401/403/429 is far more often true of *this checker specifically*
// than of the page actually being gone — a real visitor's browser loads it
// fine. These status codes also key off TLS/HTTP fingerprinting a spoofed
// User-Agent header can't fix, so treating them as "broken" would flag
// plenty of perfectly live sites. Anything else non-2xx (404, 410, 5xx,
// a network error) is trusted as genuinely broken.
const AMBIGUOUS_STATUSES = new Set([401, 403, 429]);

/** Checks whether a URL still resolves to a healthy (2xx) response, following redirects. */
export async function checkLinkAlive(url: string): Promise<boolean> {
  // Private/LAN addresses and self-signed certificates are both allowed here
  // (unlike metadata/favicon fetch): Waypoint is single-user and auth-gated,
  // and its owner routinely bookmarks their own internal services (a NAS UI,
  // Radarr, a UniFi controller — commonly self-signed) that a browser
  // accepts with a one-time click-through. Only the status code is read —
  // the body is always discarded — so there's no content to parse or store.
  const opts = { allowPrivate: true, allowInsecureTls: true };
  try {
    const res = await safeFetch(url, { method: "HEAD" }, opts);
    await res.body?.cancel().catch(() => {});
    if (res.ok) return true;
    // Bot-protection/WAF layers (Cloudflare and similar) commonly reject HEAD
    // specifically — via 403, 404, or "Method Not Allowed" — while GET works
    // fine, so any non-2xx HEAD result gets one GET retry before giving up.
    const getRes = await safeFetch(url, { method: "GET" }, opts);
    await getRes.body?.cancel().catch(() => {});
    return getRes.ok || AMBIGUOUS_STATUSES.has(getRes.status);
  } catch {
    return false;
  }
}
