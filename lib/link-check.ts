import { safeFetch } from "./safe-fetch";

/** Checks whether a URL still resolves to a healthy (2xx) response, following redirects. */
export async function checkLinkAlive(url: string): Promise<boolean> {
  try {
    const res = await safeFetch(url, { method: "HEAD" });
    if (res.status === 405 || res.status === 501) {
      // Some servers reject HEAD outright — fall back to GET, but don't
      // bother reading the body, we only care about the status.
      const getRes = await safeFetch(url, { method: "GET" });
      await getRes.body?.cancel().catch(() => {});
      return getRes.ok;
    }
    await res.body?.cancel().catch(() => {});
    return res.ok;
  } catch {
    return false;
  }
}
