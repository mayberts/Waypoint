import * as cheerio from "cheerio";
import { safeFetch, readCapped } from "./safe-fetch";

const MAX_HTML_BYTES = 3 * 1024 * 1024; // 3MB
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB

export interface PageMetadata {
  title: string;
  description?: string;
  ogImageUrl?: string;
  faviconUrl?: string;
  domain: string;
}

export async function fetchPageMetadata(url: string): Promise<PageMetadata> {
  const parsed = new URL(url);
  const domain = parsed.hostname;

  const res = await safeFetch(url, { headers: { Accept: "text/html,application/xhtml+xml" } });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("text/html") && !contentType.includes("xml")) {
    return { title: domain, domain };
  }

  const html = (await readCapped(res, MAX_HTML_BYTES)).toString("utf8");
  const $ = cheerio.load(html);
  const baseUrl = res.url;

  const title = $("title").first().text().trim() || domain;

  const description =
    $('meta[name="description"]').attr("content")?.trim() ||
    $('meta[property="og:description"]').attr("content")?.trim() ||
    undefined;

  const ogImageRaw =
    $('meta[property="og:image"]').attr("content") || $('meta[name="twitter:image"]').attr("content");
  const ogImageUrl = ogImageRaw ? resolveUrl(ogImageRaw, baseUrl) : undefined;

  const faviconRaw =
    $('link[rel~="icon"]').first().attr("href") || $('link[rel="apple-touch-icon"]').attr("href");
  const faviconUrl = resolveUrl(faviconRaw || "/favicon.ico", baseUrl);

  return { title, description, ogImageUrl, faviconUrl, domain };
}

function resolveUrl(href: string, base: string): string | undefined {
  try {
    return new URL(href, base).toString();
  } catch {
    return undefined;
  }
}

export async function downloadImage(url: string): Promise<Buffer> {
  const res = await safeFetch(url);
  if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
  return readCapped(res, MAX_IMAGE_BYTES);
}
