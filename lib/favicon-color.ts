export function faviconFallbackColor(domain: string | null): string {
  if (!domain) return "#525252";
  let hash = 0;
  for (let i = 0; i < domain.length; i++) hash = (hash * 31 + domain.charCodeAt(i)) >>> 0;
  const hue = hash % 360;
  return `hsl(${hue} 45% 40%)`;
}
