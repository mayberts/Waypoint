// The Waypoint logo as an SVG string, shared by the favicon route and the
// PWA icon routes so the mark only exists in one place.
//
// fullBleed: background covers the whole canvas with no rounded corners —
// for icons where the platform applies its own mask (iOS home screen,
// Android maskable icons), which would otherwise show seams around our
// pre-rounded rect.
export function waypointLogoSvg(hex: string, hexStrong: string, { fullBleed = false } = {}): string {
  const background = fullBleed
    ? `<rect width="100" height="100" fill="url(#waypoint-bg)"/>`
    : `<rect x="4" y="4" width="92" height="92" rx="22" fill="url(#waypoint-bg)"/>`;

  return `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="waypoint-bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${hex}"/>
      <stop offset="1" stop-color="${hexStrong}"/>
    </linearGradient>
  </defs>
  ${background}
  <path d="M32 26 H68 V76 L50 61 L32 76 Z" fill="#ffffff"/>
  <circle cx="50" cy="39" r="6" fill="${hexStrong}"/>
</svg>`;
}
