"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useDndContext, useDroppable } from "@dnd-kit/core";
import { CollectionTree } from "./CollectionTree";
import { Logo } from "./Logo";
import { UNSORTED_DROP_ID, parseBookmarkDndId } from "@/lib/dnd-ids";

export function Sidebar({ onOpenPalette }: { onOpenPalette: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");

  const collectionId = pathname?.startsWith("/collection/") ? pathname.split("/")[2] : undefined;

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <aside className="w-64 shrink-0 h-full bg-[var(--surface-0)] border-r border-[var(--border)] flex flex-col">
      <div className="px-3 pt-4">
        <Link href="/" className="flex items-center gap-2 text-base font-semibold tracking-tight text-[var(--text-primary)] px-1">
          <Logo size={22} />
          Waypoint
        </Link>
      </div>

      <form onSubmit={submitSearch} className="px-3 pt-3 relative">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search bookmarks…"
          className="w-full rounded-md bg-[var(--surface-1)] border border-[var(--border)] pl-2.5 pr-16 py-1.5 text-sm text-[var(--text-secondary)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-[var(--border-stronger)]"
        />
        <button
          type="button"
          onClick={onOpenPalette}
          title="Open command palette"
          className="absolute right-4 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded border border-[var(--border-strong)] text-[10px] leading-none text-[var(--text-faint)] hover:text-[var(--text-secondary)] hover:border-[var(--border-stronger)]"
        >
          Ctrl+K
        </button>
      </form>

      <nav className="px-3 pt-3 flex flex-col gap-0.5">
        <SidebarLink href="/" active={pathname === "/"} icon="🔖">
          All bookmarks
        </SidebarLink>
        <UnsortedLink active={pathname === "/unsorted"} />
        <SidebarLink href="/stats" active={pathname === "/stats"} icon="📊">
          Stats
        </SidebarLink>
      </nav>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <CollectionTree selectedId={collectionId} />
      </div>

      <div className="px-3 py-3 border-t border-[var(--border)]">
        <SidebarLink href="/settings" active={pathname === "/settings"} icon="⚙️">
          Settings
        </SidebarLink>
      </div>
    </aside>
  );
}

function UnsortedLink({ active }: { active: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: UNSORTED_DROP_ID });
  const { active: dragActive } = useDndContext();
  const draggingBookmark = !!parseBookmarkDndId(dragActive?.id);

  return (
    <span ref={setNodeRef} className="relative block rounded-md">
      {draggingBookmark && isOver && <div className="absolute inset-0.5 rounded-md ring-2 ring-[var(--accent)] pointer-events-none" />}
      <SidebarLink href="/unsorted" active={active} icon="📥">
        Unsorted
      </SidebarLink>
    </span>
  );
}

function SidebarLink({
  href,
  active,
  icon,
  children,
}: {
  href: string;
  active: boolean;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{ paddingTop: "var(--sidebar-row-py)", paddingBottom: "var(--sidebar-row-py)" }}
      className={`flex items-center gap-2.5 rounded-md px-2 text-sm ${
        active ? "bg-[var(--surface-2)] text-[var(--text-primary)]" : "text-[var(--text-body)] hover:bg-[var(--surface-2-a60)]"
      }`}
    >
      <span
        style={{ height: "var(--sidebar-row-icon)", width: "var(--sidebar-row-icon)" }}
        className="flex items-center justify-center text-lg leading-none shrink-0"
      >
        {icon}
      </span>
      <span>{children}</span>
    </Link>
  );
}
