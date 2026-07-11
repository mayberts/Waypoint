export interface AccentColor {
  value: string;
  label: string;
  hex: string; // base shade — borders, rings, dots, underlines
  hexStrong: string; // darker shade — solid button fill (hover goes to `hex`)
}

export const ACCENT_COLORS: AccentColor[] = [
  { value: "red", label: "Red", hex: "#ef4444", hexStrong: "#dc2626" },
  { value: "orange", label: "Orange", hex: "#f97316", hexStrong: "#ea580c" },
  { value: "amber", label: "Amber", hex: "#f59e0b", hexStrong: "#d97706" },
  { value: "yellow", label: "Yellow", hex: "#eab308", hexStrong: "#ca8a04" },
  { value: "lime", label: "Lime", hex: "#84cc16", hexStrong: "#65a30d" },
  { value: "green", label: "Green", hex: "#22c55e", hexStrong: "#16a34a" },
  { value: "emerald", label: "Emerald", hex: "#10b981", hexStrong: "#059669" },
  { value: "teal", label: "Teal", hex: "#14b8a6", hexStrong: "#0d9488" },
  { value: "cyan", label: "Cyan", hex: "#06b6d4", hexStrong: "#0891b2" },
  { value: "sky", label: "Sky", hex: "#0ea5e9", hexStrong: "#0284c7" },
  { value: "blue", label: "Blue", hex: "#3b82f6", hexStrong: "#2563eb" },
  { value: "indigo", label: "Indigo", hex: "#6366f1", hexStrong: "#4f46e5" },
  { value: "violet", label: "Violet", hex: "#8b5cf6", hexStrong: "#7c3aed" },
  { value: "purple", label: "Purple", hex: "#a855f7", hexStrong: "#9333ea" },
  { value: "fuchsia", label: "Fuchsia", hex: "#d946ef", hexStrong: "#c026d3" },
  { value: "pink", label: "Pink", hex: "#ec4899", hexStrong: "#db2777" },
  { value: "rose", label: "Rose", hex: "#f43f5e", hexStrong: "#e11d48" },
];

export const DEFAULT_ACCENT_COLOR = "blue";

export function accentColorByValue(value: string): AccentColor {
  return ACCENT_COLORS.find((c) => c.value === value) ?? ACCENT_COLORS.find((c) => c.value === DEFAULT_ACCENT_COLOR)!;
}
