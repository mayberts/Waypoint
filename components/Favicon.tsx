import { faviconFallbackColor } from "@/lib/favicon-color";

export function Favicon({
  faviconPath,
  domain,
  size = 16,
  className = "",
}: {
  faviconPath: string | null;
  domain: string | null;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`shrink-0 rounded overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      {faviconPath ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={faviconPath} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full" style={{ background: faviconFallbackColor(domain) }} />
      )}
    </div>
  );
}
