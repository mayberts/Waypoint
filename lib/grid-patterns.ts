import type { CSSProperties } from "react";

export interface GridPatternOption {
  value: string;
  label: string;
  style: CSSProperties;
}

export const GRID_PATTERN_OPTIONS: GridPatternOption[] = [
  { value: "none", label: "None", style: {} },
  {
    value: "dots",
    label: "Dots",
    style: {
      backgroundImage: "radial-gradient(var(--border-strong) 1px, transparent 1px)",
      backgroundSize: "20px 20px",
    },
  },
  {
    value: "grid",
    label: "Grid",
    style: {
      backgroundImage:
        "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
      backgroundSize: "24px 24px",
    },
  },
  {
    value: "diagonal",
    label: "Diagonal",
    style: {
      backgroundImage:
        "repeating-linear-gradient(45deg, var(--border) 0, var(--border) 1px, transparent 1px, transparent 13px)",
    },
  },
];

export function gridPatternStyle(value: string): CSSProperties {
  return GRID_PATTERN_OPTIONS.find((o) => o.value === value)?.style ?? {};
}
