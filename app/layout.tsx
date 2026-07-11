import type { Metadata } from "next";
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
};

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
      data-theme={colorScheme}
      data-density={density}
      style={{ "--accent": hex, "--accent-strong": hexStrong } as React.CSSProperties}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full h-full">
        <AppDataProvider>{children}</AppDataProvider>
      </body>
    </html>
  );
}
