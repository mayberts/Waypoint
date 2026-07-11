import { getAccentColor } from "@/lib/settings";
import { accentColorByValue } from "@/lib/accent-colors";

export const dynamic = "force-dynamic";
export const size = { width: 100, height: 100 };
export const contentType = "image/svg+xml";

export default async function Icon() {
  const { hex, hexStrong } = accentColorByValue(await getAccentColor());

  const svg = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="waypoint-bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${hex}"/>
      <stop offset="1" stop-color="${hexStrong}"/>
    </linearGradient>
  </defs>
  <rect x="4" y="4" width="92" height="92" rx="22" fill="url(#waypoint-bg)"/>
  <path d="M32 26 H68 V76 L50 61 L32 76 Z" fill="#ffffff"/>
  <circle cx="50" cy="39" r="6" fill="${hexStrong}"/>
</svg>`;

  return new Response(svg, { headers: { "Content-Type": contentType } });
}
