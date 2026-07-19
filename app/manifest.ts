import type { MetadataRoute } from "next";
import { getColorScheme } from "@/lib/settings";

// Web app manifest — makes Waypoint installable as a PWA (home-screen icon,
// standalone window, splash screen). Dynamic because the splash/background
// colors follow the configured color scheme, which lives in the database.
export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const scheme = await getColorScheme();
  // "auto" can't be resolved here (no client to ask) — use the dark palette,
  // matching the server-side fallback the root layout uses for the same case.
  const light = scheme === "light";

  return {
    name: "Waypoint",
    short_name: "Waypoint",
    description: "A self-hosted bookmark manager with collections and custom favicons.",
    start_url: "/",
    display: "standalone",
    // theme_color paints the installed app's title bar — matches the sidebar
    // (surface-0); background_color is the splash screen behind the icon —
    // matches the main page background (surface-1).
    theme_color: light ? "#fafafa" : "#0a0a0a",
    background_color: light ? "#ffffff" : "#171717",
    icons: [
      { src: "/pwa-icon?size=192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon?size=512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon?size=192&maskable=1", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/pwa-icon?size=512&maskable=1", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Lets Waypoint appear in the OS share sheet once installed — sharing a
    // link from any other app (Safari, Twitter, Reddit, …) opens /quick-save
    // prefilled, instead of needing to copy-paste the URL in by hand. GET is
    // enough since we only ever receive text/url, never files.
    share_target: {
      action: "/quick-save",
      method: "GET",
      params: { title: "title", text: "text", url: "url" },
    },
  };
}
