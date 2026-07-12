/**
 * Normalizes a URL for duplicate comparison. Only lowercases the scheme and
 * host — port, path, query, and fragment are left exactly as parsed, so two
 * bookmarks that share a host but point at different ports (e.g. two
 * self-hosted services on the same LAN IP, 192.168.1.36:8080 vs :9091) are
 * never treated as duplicates. Falls back to a trimmed lowercase string for
 * anything that isn't a parseable URL, so it still groups exact repeats.
 */
export function normalizeUrlForDuplicates(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hostname = parsed.hostname.toLowerCase();
    parsed.protocol = parsed.protocol.toLowerCase();
    return parsed.href;
  } catch {
    return url.trim().toLowerCase();
  }
}
