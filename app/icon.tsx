import { getAccentColor } from "@/lib/settings";
import { accentColorByValue } from "@/lib/accent-colors";
import { waypointLogoSvg } from "@/lib/logo-svg";

export const dynamic = "force-dynamic";
export const size = { width: 100, height: 100 };
export const contentType = "image/svg+xml";

export default async function Icon() {
  const { hex, hexStrong } = accentColorByValue(await getAccentColor());
  return new Response(waypointLogoSvg(hex, hexStrong), { headers: { "Content-Type": contentType } });
}
