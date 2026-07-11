import type { CSSProperties } from "react";

export interface GridPatternOption {
  value: string;
  label: string;
  category: "Fundamental" | "Structural" | "Ambient" | "Refractive";
  style: CSSProperties;
}

export const GRID_PATTERN_OPTIONS: GridPatternOption[] = [
  // Fundamental
  { value: "none", label: "None", category: "Fundamental", style: {} },
  {
    value: "dots",
    label: "Dots",
    category: "Fundamental",
    style: {
      backgroundImage: "radial-gradient(var(--border-strong) 1px, transparent 1px)",
      backgroundSize: "20px 20px",
    },
  },
  {
    value: "cross",
    label: "Cross",
    category: "Fundamental",
    style: {
      backgroundImage:
        "linear-gradient(var(--border-strong) 1px, transparent 1px), linear-gradient(90deg, var(--border-strong) 1px, transparent 1px)",
      backgroundSize: "8px 24px, 24px 8px",
      backgroundPosition: "center, center",
      backgroundRepeat: "repeat",
    },
  },
  {
    value: "terminal",
    label: "Terminal",
    category: "Fundamental",
    style: { backgroundImage: "repeating-linear-gradient(0deg, var(--border) 0px, var(--border) 1px, transparent 1px, transparent 8px)" },
  },
  {
    value: "millimeter",
    label: "Millimeter",
    category: "Fundamental",
    style: {
      backgroundImage:
        "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px), linear-gradient(var(--border-strong) 1px, transparent 1px), linear-gradient(90deg, var(--border-strong) 1px, transparent 1px)",
      backgroundSize: "8px 8px, 8px 8px, 40px 40px, 40px 40px",
    },
  },

  // Structural
  {
    value: "blueprint",
    label: "Blueprint",
    category: "Structural",
    style: {
      backgroundImage:
        "linear-gradient(color-mix(in srgb, var(--accent) 35%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--accent) 35%, transparent) 1px, transparent 1px)",
      backgroundSize: "32px 32px",
      backgroundColor: "color-mix(in srgb, var(--accent) 6%, transparent)",
    },
  },
  {
    value: "brushed",
    label: "Brushed",
    category: "Structural",
    style: { backgroundImage: "repeating-linear-gradient(115deg, var(--border) 0px, var(--border) 1px, transparent 1px, transparent 3px)" },
  },
  {
    value: "scanlines",
    label: "Scanlines",
    category: "Structural",
    style: { backgroundImage: "repeating-linear-gradient(0deg, var(--border-strong) 0px, var(--border-strong) 1px, transparent 1px, transparent 3px)" },
  },
  {
    value: "vinyl",
    label: "Vinyl",
    category: "Structural",
    style: {
      backgroundImage: "repeating-radial-gradient(circle at center, var(--border) 0px, var(--border) 1px, transparent 1px, transparent 6px)",
    },
  },
  {
    value: "carbon",
    label: "Carbon",
    category: "Structural",
    style: {
      backgroundImage:
        "repeating-linear-gradient(45deg, var(--border) 0px, var(--border) 1px, transparent 1px, transparent 6px), repeating-linear-gradient(-45deg, var(--border) 0px, var(--border) 1px, transparent 1px, transparent 6px)",
    },
  },
  {
    value: "perforated",
    label: "Perforated",
    category: "Structural",
    style: {
      backgroundImage: "radial-gradient(var(--border-strong) 1px, transparent 1px)",
      backgroundSize: "10px 10px",
    },
  },

  // Ambient
  {
    value: "aurora",
    label: "Aurora",
    category: "Ambient",
    style: {
      backgroundImage:
        "radial-gradient(ellipse 60% 40% at 20% 20%, color-mix(in srgb, var(--accent) 25%, transparent), transparent 60%), radial-gradient(ellipse 50% 40% at 80% 60%, color-mix(in srgb, var(--accent-strong) 20%, transparent), transparent 60%)",
    },
  },
  {
    value: "horizon",
    label: "Horizon",
    category: "Ambient",
    style: { backgroundImage: "linear-gradient(to top, color-mix(in srgb, var(--accent) 18%, transparent), transparent 55%)" },
  },
  {
    value: "glow",
    label: "Glow",
    category: "Ambient",
    style: { backgroundImage: "radial-gradient(circle at 50% 30%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 60%)" },
  },
  {
    value: "mesh",
    label: "Mesh",
    category: "Ambient",
    style: {
      backgroundImage:
        "radial-gradient(circle at 15% 25%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 45%), radial-gradient(circle at 85% 20%, color-mix(in srgb, var(--accent-strong) 16%, transparent), transparent 45%), radial-gradient(circle at 50% 85%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 45%)",
    },
  },
  {
    value: "elevation",
    label: "Elevation",
    category: "Ambient",
    style: { backgroundImage: "radial-gradient(ellipse at center, transparent 50%, color-mix(in srgb, var(--border-strongest) 25%, transparent) 100%)" },
  },

  // Refractive
  {
    value: "prism",
    label: "Prism",
    category: "Refractive",
    style: {
      backgroundImage:
        "linear-gradient(120deg, color-mix(in srgb, var(--accent) 20%, transparent), transparent 30%, color-mix(in srgb, var(--accent-strong) 18%, transparent) 60%, transparent 80%)",
    },
  },
  {
    value: "spectrum",
    label: "Spectrum",
    category: "Refractive",
    style: {
      backgroundImage:
        "linear-gradient(90deg, rgba(239,68,68,0.12), rgba(234,179,8,0.12), rgba(34,197,94,0.12), rgba(14,165,233,0.12), rgba(168,85,247,0.12))",
    },
  },
  {
    value: "spectrum-x",
    label: "Spectrum X",
    category: "Refractive",
    style: {
      backgroundImage:
        "linear-gradient(45deg, rgba(239,68,68,0.1), rgba(234,179,8,0.1) 25%, rgba(34,197,94,0.1) 50%, rgba(14,165,233,0.1) 75%, rgba(168,85,247,0.1)), linear-gradient(-45deg, rgba(239,68,68,0.08), rgba(168,85,247,0.08))",
    },
  },
  {
    value: "spectrum-plus",
    label: "Spectrum Plus",
    category: "Refractive",
    style: {
      backgroundImage:
        "radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--accent) 15%, transparent), transparent 60%), linear-gradient(90deg, rgba(239,68,68,0.1), rgba(234,179,8,0.1), rgba(34,197,94,0.1), rgba(14,165,233,0.1), rgba(168,85,247,0.1))",
    },
  },
  {
    value: "eclipse",
    label: "Eclipse",
    category: "Refractive",
    style: {
      backgroundImage:
        "radial-gradient(circle at 50% 50%, transparent 35%, color-mix(in srgb, var(--accent) 20%, transparent) 45%, transparent 60%)",
    },
  },
];

export const GRID_PATTERN_CATEGORIES = ["Fundamental", "Structural", "Ambient", "Refractive"] as const;

export function gridPatternStyle(value: string): CSSProperties {
  return GRID_PATTERN_OPTIONS.find((o) => o.value === value)?.style ?? {};
}
