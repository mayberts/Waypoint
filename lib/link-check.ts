import { safeFetch } from "./safe-fetch";

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
    return getRes.ok;
  } catch {
    return false;
  }
}
