"use client";

import { useAppData } from "./providers";

export function TagInput({ value, onChange }: { value: string[]; onChange: (tags: string[]) => void }) {
  const { tags } = useAppData();

  return (
    <div>
      <input
        list="waypoint-tag-suggestions"
        placeholder="Add a tag and press Enter"
        className="w-full rounded-md bg-[var(--surface-1)] border border-[var(--border)] px-2.5 py-1.5 text-sm text-[var(--text-secondary)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-[var(--border-stronger)]"
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          e.preventDefault();
          const input = e.currentTarget;
          const name = input.value.trim().toLowerCase();
          if (name && !value.includes(name)) onChange([...value, name]);
          input.value = "";
        }}
      />
      <datalist id="waypoint-tag-suggestions">
        {tags.map((t) => (
          <option key={t.id} value={t.name} />
        ))}
      </datalist>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-2">
          {value.map((name) => (
            <span
              key={name}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-[var(--surface-2)] text-[var(--text-body)]"
            >
              {name}
              <button
                type="button"
                onClick={() => onChange(value.filter((t) => t !== name))}
                className="text-[var(--text-faint)] hover:text-[var(--text-secondary)]"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
