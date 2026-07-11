"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { CollectionTree } from "./CollectionTree";
import { Logo } from "./Logo";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");

  const collectionId = pathname?.startsWith("/collection/") ? pathname.split("/")[2] : undefined;

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <aside className="w-64 shrink-0 h-full bg-neutral-950 border-r border-neutral-800 flex flex-col">
      <div className="px-3 pt-4">
        <Link href="/" className="flex items-center gap-2 text-base font-semibold tracking-tight text-white px-1">
          <Logo size={22} />
          Waypoint
        </Link>
      </div>

      <form onSubmit={submitSearch} className="px-3 pt-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search bookmarks…"
          className="w-full rounded-md bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-neutral-600"
        />
      </form>

      <nav className="px-3 pt-3 flex flex-col gap-0.5">
        <SidebarLink href="/" active={pathname === "/"} icon="🔖">
          All bookmarks
        </SidebarLink>
        <SidebarLink href="/unsorted" active={pathname === "/unsorted"} icon="📥">
          Unsorted
        </SidebarLink>
      </nav>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <CollectionTree selectedId={collectionId} />
      </div>

      <div className="px-3 py-3 border-t border-neutral-800">
        <SidebarLink href="/settings" active={pathname === "/settings"} icon="⚙️">
          Settings
        </SidebarLink>
      </div>
    </aside>
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
      className={`flex items-center gap-2.5 rounded-md px-2 py-2 text-sm ${
        active ? "bg-neutral-800 text-white" : "text-neutral-300 hover:bg-neutral-800/60"
      }`}
    >
      <span className="flex items-center justify-center h-6 w-6 text-lg leading-none shrink-0">{icon}</span>
      <span>{children}</span>
    </Link>
  );
}
