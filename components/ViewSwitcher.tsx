"use client";

import { useState } from "react";
import { VIEW_MODES, type ViewMode } from "@/lib/view-prefs";

const VIEW_META: Record<ViewMode, { label: string; icon: string }> = {
  cards: { label: "Cards", icon: "▦" },
  list: { label: "List", icon: "☰" },
  headlines: { label: "Headlines", icon: "≡" },
  moodboard: { label: "Moodboard", icon: "▥" },
};

export function ViewSwitcher({
  value,
  onChange,
  onApplyToAll,
}: {
  value: ViewMode;
  onChange: (view: ViewMode) => void;
  onApplyToAll: (view: ViewMode) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = VIEW_META[value];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-md border border-neutral-800 text-neutral-300 hover:bg-neutral-800"
      >
        <span>{current.icon}</span>
        {current.label}
        <span className="text-neutral-500 text-xs">▾</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 top-full right-0 mt-1 w-48 rounded-lg border border-neutral-800 bg-neutral-950 p-1.5 shadow-xl">
            <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">View</div>
            {VIEW_MODES.map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  onChange(mode);
                  setOpen(false);
                }}
                className="flex items-center gap-2 w-full text-left px-2 py-1.5 text-sm rounded hover:bg-neutral-800 text-neutral-200"
              >
                <span
                  className={`h-3 w-3 rounded-full border shrink-0 ${value === mode ? "" : "border-neutral-600"}`}
                  style={value === mode ? { borderColor: "var(--accent)", backgroundColor: "var(--accent)" } : undefined}
                />
                <span className="w-4 text-center">{VIEW_META[mode].icon}</span>
                {VIEW_META[mode].label}
              </button>
            ))}
            <div className="border-t border-neutral-800 mt-1 pt-1">
              <button
                onClick={() => {
                  onApplyToAll(value);
                  setOpen(false);
                }}
                className="w-full text-center px-2 py-1.5 text-xs rounded border border-neutral-700 hover:bg-neutral-800 text-neutral-300"
              >
                Apply to all
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
