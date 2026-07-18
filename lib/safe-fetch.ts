import dns from "node:dns/promises";
import { Agent as UndiciAgent } from "undici";

const DEFAULT_TIMEOUT_MS = 8000;

// Reused across requests (an Agent owns a connection pool) — only used when
// a caller opts into allowInsecureTls.
const insecureTlsDispatcher = new UndiciAgent({ connect: { rejectUnauthorized: false } });

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) return null;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function inRange(ip: number, base: string, bits: number): boolean {
  const baseInt = ipv4ToInt(base);
  if (baseInt === null) return false;
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ip & mask) === (baseInt & mask);
}

// Best-effort block of private/loopback/link-local/metadata ranges. Not a hard
// security boundary (DNS can still change between check and fetch) but stops
// naive SSRF against internal services when a user pastes an untrusted URL.
function isDisallowedIp(address: string): boolean {
  if (address.includes(":")) {
    const lower = address.toLowerCase();
    if (lower === "::1") return true;
    if (lower.startsWith("fe80:") || lower.startsWith("fc") || lower.startsWith("fd")) return true;
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isDisallowedIp(mapped[1]);
    return false;
  }

  const ip = ipv4ToInt(address);
  if (ip === null) return true; // unparsable -> reject

  return (
    inRange(ip, "0.0.0.0", 8) ||
    inRange(ip, "10.0.0.0", 8) ||
    inRange(ip, "100.64.0.0", 10) ||
    inRange(ip, "127.0.0.0", 8) ||
    inRange(ip, "169.254.0.0", 16) ||
    inRange(ip, "172.16.0.0", 12) ||
    inRange(ip, "192.0.0.0", 24) ||
    inRange(ip, "192.168.0.0", 16) ||
    inRange(ip, "198.18.0.0", 15) ||
    inRange(ip, "224.0.0.0", 4)
  );
}

async function assertPublicHost(hostname: string) {
  let addresses: string[];
  try {
    addresses = (await dns.lookup(hostname, { all: true })).map((a) => a.address);
  } catch {
    throw new Error(`Could not resolve host: ${hostname}`);
  }
  if (addresses.length === 0 || addresses.some(isDisallowedIp)) {
    throw new Error(`Refusing to fetch non-public host: ${hostname}`);
  }
}

export class ResponseTooLargeError extends Error {}

export interface SafeFetchOptions {
  // Skip the private/loopback/link-local IP block. Waypoint is a self-hosted,
  // single-user, auth-gated app whose owner routinely bookmarks their own LAN
  // services (Radarr, a router UI, etc.), so link-liveness checks — which
  // only read a status code and never parse or store the response body —
  // need to reach those addresses. Fetches that parse or store body content
  // (metadata/favicon fetch) must leave this off.
  allowPrivate?: boolean;
  // Skip TLS certificate verification. Self-hosted admin UIs (a UniFi
  // controller, a NAS, etc.) very commonly serve a self-signed certificate,
  // which a browser accepts with a one-time click-through but Node's fetch
  // rejects outright. Same reasoning as allowPrivate: link checks only read
  // a status code, so there's no content to be tricked by. Leave this off
  // for fetches that parse or store body content.
  allowInsecureTls?: boolean;
}

/**
 * fetch() wrapped with SSRF guards (public-IP-only by default, http/https
 * only) and a hard timeout. Use for any request to a URL the user supplied.
 */
export async function safeFetch(url: string, init?: RequestInit, options?: SafeFetchOptions): Promise<Response> {
  const parsed = new URL(url);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Unsupported protocol: ${parsed.protocol}`);
  }
  if (!options?.allowPrivate) await assertPublicHost(parsed.hostname);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const res = await fetch(parsed, {
      ...init,
      redirect: "follow",
      signal: controller.signal,
      headers: {
        // A self-identifying bot UA gets flat-out 403'd by Cloudflare and
        // similar WAFs on plenty of otherwise-live sites (GitLab, Udemy,
        // Claude.ai all do this) — every fetch here is either the user's own
        // bookmark or metadata for a page they explicitly saved, not mass
        // crawling, so identifying as an ordinary browser is the pragmatic
        // choice. Won't help against JS-challenge/fingerprinting bot
        // defenses, which no plain HTTP request can pass.
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        ...init?.headers,
      },
      // `dispatcher` is a Node/undici-specific fetch extension not present in
      // the DOM RequestInit typings that this project's tsconfig uses.
      ...(options?.allowInsecureTls ? ({ dispatcher: insecureTlsDispatcher } as RequestInit) : {}),
    });
    // fetch() follows redirects internally; re-validate the final host so a
    // redirect chain can't be used to reach a private address.
    if (!options?.allowPrivate) await assertPublicHost(new URL(res.url).hostname);
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

/** Read a response body into a Buffer, aborting once maxBytes is exceeded. */
export async function readCapped(res: Response, maxBytes: number): Promise<Buffer> {
  const reader = res.body?.getReader();
  if (!reader) return Buffer.from(await res.arrayBuffer());

  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new ResponseTooLargeError(`Response exceeded ${maxBytes} bytes`);
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}
