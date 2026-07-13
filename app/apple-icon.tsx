import { ImageResponse } from "next/og";
import { getAccentColor } from "@/lib/settings";
import { accentColorByValue } from "@/lib/accent-colors";
import { waypointLogoSvg } from "@/lib/logo-svg";

// iOS home-screen icon — full-bleed because iOS applies its own squircle
// mask; a pre-rounded icon would show dark corners inside it.
export const dynamic = "force-dynamic";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const { hex, hexStrong } = accentColorByValue(await getAccentColor());
  const svg = waypointLogoSvg(hex, hexStrong, { fullBleed: true });
  const dataUri = `data:image/svg+xml,${encodeURIComponent(svg)}`;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex" }}>
        <img src={dataUri} width={180} height={180} alt="" />
      </div>
    ),
    size
  );
}
