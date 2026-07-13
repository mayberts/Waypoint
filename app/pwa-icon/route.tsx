import { NextRequest, NextResponse } from "next/server";
import { ImageResponse } from "next/og";
import { getAccentColor } from "@/lib/settings";
import { accentColorByValue } from "@/lib/accent-colors";
import { waypointLogoSvg } from "@/lib/logo-svg";

// PNG app icons for the web app manifest (manifest icons can't reliably be
// SVG across platforms). ?size=192|512, plus ?maskable=1 for the Android
// adaptive-icon variant, which must fill the whole canvas because the OS
// crops it to its own shape.
export const dynamic = "force-dynamic";

const SIZES = [192, 512];

export async function GET(req: NextRequest) {
  const size = Number(req.nextUrl.searchParams.get("size"));
  const maskable = req.nextUrl.searchParams.get("maskable") === "1";
  if (!SIZES.includes(size)) {
    return NextResponse.json({ error: "size must be 192 or 512" }, { status: 400 });
  }

  const { hex, hexStrong } = accentColorByValue(await getAccentColor());
  const svg = waypointLogoSvg(hex, hexStrong, { fullBleed: maskable });
  const dataUri = `data:image/svg+xml,${encodeURIComponent(svg)}`;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUri} width={size} height={size} alt="" />
      </div>
    ),
    { width: size, height: size }
  );
}
