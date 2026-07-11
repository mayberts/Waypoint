export function Logo({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden>
      <defs>
        <linearGradient id="waypoint-bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0" style={{ stopColor: "var(--accent)" }} />
          <stop offset="1" style={{ stopColor: "var(--accent-strong)" }} />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="92" height="92" rx="22" fill="url(#waypoint-bg)" />
      <path d="M32 26 H68 V76 L50 61 L32 76 Z" fill="#ffffff" />
      <circle cx="50" cy="39" r="6" style={{ fill: "var(--accent-strong)" }} />
    </svg>
  );
}
