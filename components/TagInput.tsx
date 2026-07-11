"use client";

import { useAppData } from "./providers";

export function TagInput({ value, onChange }: { value: string[]; onChange: (tags: string[]) => void }) {
  const { tags } = useAppData();

  return (
    <div>
      <input
        list="waypoint-tag-suggestions"
        placeholder="Add a tag and press Enter"
        className="w-full rounded-md bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-neutral-600"
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
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-neutral-800 text-neutral-300"
            >
              {name}
              <button
                type="button"
                onClick={() => onChange(value.filter((t) => t !== name))}
                className="text-neutral-500 hover:text-neutral-200"
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
