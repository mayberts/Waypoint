import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppDataProvider } from "@/components/providers";
import { getAccentColor, getColorScheme, getDensity } from "@/lib/settings";
import { accentColorByValue } from "@/lib/accent-colors";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Waypoint",
  description: "A self-hosted bookmark manager with collections and custom favicons.",
  appleWebApp: {
    capable: true,
    title: "Waypoint",
    statusBarStyle: "default",
  },
};

// theme-color meta — colors the browser/OS chrome (installed-PWA title bar,
// Android status bar) to match the sidebar (surface-0) in the active theme.
export async function generateViewport(): Promise<Viewport> {
  const scheme = await getColorScheme();
  if (scheme === "auto") {
    return {
      themeColor: [
        { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
        { media: "(prefers-color-scheme: light)", color: "#fafafa" },
      ],
    };
  }
  return { themeColor: scheme === "light" ? "#fafafa" : "#0a0a0a" };
}

// The layout reads appearance settings from the database on every request
// (to avoid a flash of the wrong theme/accent color); force-dynamic keeps
// Next.js from trying to prerender it at build time, when no database is
// reachable yet (migrations run at container start, not during the build).
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [accentColor, colorScheme, density] = await Promise.all([getAccentColor(), getColorScheme(), getDensity()]);
  const { hex, hexStrong } = accentColorByValue(accentColor);

  return (
    <html
      lang="en"
      // "auto" can't be resolved on the server (it has no idea what the
      // visitor's OS preference is) — fall back to the app's dark default
      // here; the inline script below overwrites it before first paint.
      // suppressHydrationWarning: React would otherwise flag that mismatch
      // once it hydrates — this is the documented, intentional case for it.
      suppressHydrationWarning
      data-theme={colorScheme === "auto" ? "dark" : colorScheme}
      data-density={density}
      style={{ "--accent": hex, "--accent-strong": hexStrong } as React.CSSProperties}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full h-full">
        {colorScheme === "auto" && (
          // Synchronous + first in <body>, so it runs (and blocks paint)
          // before any styled content renders — no flash of the wrong theme.
          <script
            dangerouslySetInnerHTML={{
              __html:
                "(function(){try{document.documentElement.setAttribute('data-theme',window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');}catch(e){}})();",
            }}
          />
        )}
        <AppDataProvider>{children}</AppDataProvider>
      </body>
    </html>
  );
}
