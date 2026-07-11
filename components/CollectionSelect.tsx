"use client";

import { useMemo } from "react";
import { buildTree, flattenTree, isIconImagePath } from "@/lib/collection-tree";
import { useAppData } from "./providers";

export function CollectionSelect({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const { collections } = useAppData();
  const options = useMemo(() => flattenTree(buildTree(collections)), [collections]);

  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      className="w-full rounded-md bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 text-sm text-neutral-200 focus:outline-none focus:border-neutral-600"
    >
      <option value="">Unsorted</option>
      {options.map((c) => (
        <option key={c.id} value={c.id}>
          {"  ".repeat(c.depth)}
          {!isIconImagePath(c.icon) && c.icon ? `${c.icon} ` : ""}
          {c.name}
        </option>
      ))}
    </select>
  );
}
