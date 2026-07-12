"use client";

const SHORTCUTS: { keys: string; label: string }[] = [
  { keys: "j / ↓", label: "Focus next bookmark" },
  { keys: "k / ↑", label: "Focus previous bookmark" },
  { keys: "Enter / o", label: "Open focused bookmark" },
  { keys: "e", label: "Edit focused bookmark" },
  { keys: "x / Space", label: "Toggle selection" },
  { keys: "Delete", label: "Move to trash" },
  { keys: "Esc", label: "Clear selection / focus" },
  { keys: "Ctrl+K", label: "Command palette" },
];

export function KeyboardShortcutsHelp({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-lg border border-[var(--border)] bg-[var(--surface-0)] shadow-xl p-4 flex flex-col gap-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Keyboard shortcuts</h2>
          <button onClick={onClose} className="text-[var(--text-faint)] hover:text-[var(--text-secondary)] text-lg leading-none">
            ×
          </button>
        </div>
        <div className="flex flex-col gap-1.5">
          {SHORTCUTS.map((s) => (
            <div key={s.keys} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-[var(--text-body)]">{s.label}</span>
              <kbd className="shrink-0 px-1.5 py-0.5 rounded border border-[var(--border-strong)] bg-[var(--surface-1)] text-xs text-[var(--text-secondary)] font-mono">
                {s.keys}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
