"use client";

import { useState } from "react";
import { SORT_MODES, type SortMode } from "@/lib/sort-prefs";

const SORT_META: Record<SortMode, { label: string; icon: string }> = {
  manual: { label: "Manual", icon: "⠿" },
  newest: { label: "Newest first", icon: "↓" },
  oldest: { label: "Oldest first", icon: "↑" },
  "title-asc": { label: "Title A–Z", icon: "A" },
  "title-desc": { label: "Title Z–A", icon: "Z" },
};

export function SortMenu({
  value,
  onChange,
  allowManual,
}: {
  value: SortMode;
  onChange: (sort: SortMode) => void;
  /** Manual ordering only means something within a single, well-defined group of bookmarks (one collection, or Unsorted). */
  allowManual: boolean;
}) {
  const [open, setOpen] = useState(false);
  const options = allowManual ? SORT_MODES : SORT_MODES.filter((m) => m !== "manual");
  const current = SORT_META[value];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-md border border-[var(--border)] text-[var(--text-body)] hover:bg-[var(--surface-2)]"
      >
        <span>{current.icon}</span>
        {current.label}
        <span className="text-[var(--text-faint)] text-xs">▾</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 top-full right-0 mt-1 w-44 rounded-lg border border-[var(--border)] bg-[var(--surface-0)] p-1.5 shadow-xl">
            <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-faint)]">Sort</div>
            {options.map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  onChange(mode);
                  setOpen(false);
                }}
                className="flex items-center gap-2 w-full text-left px-2 py-1.5 text-sm rounded hover:bg-[var(--surface-2)] text-[var(--text-secondary)]"
              >
                <span
                  className={`h-3 w-3 rounded-full border shrink-0 ${value === mode ? "" : "border-[var(--border-stronger)]"}`}
                  style={value === mode ? { borderColor: "var(--accent)", backgroundColor: "var(--accent)" } : undefined}
                />
                <span className="w-4 text-center">{SORT_META[mode].icon}</span>
                {SORT_META[mode].label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
