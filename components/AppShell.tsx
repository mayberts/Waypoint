"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Logo } from "./Logo";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- close the mobile drawer whenever the route changes
    setOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen">
      {open && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setOpen(false)} />}

      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 transition-transform duration-200 md:static md:z-auto md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar />
      </div>

      <div className="flex-1 min-w-0 h-screen overflow-hidden flex flex-col">
        <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-2.5 shrink-0 md:hidden">
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="flex items-center justify-center h-8 w-8 rounded-md text-[var(--text-body)] hover:bg-[var(--surface-2)] -ml-1"
          >
            <span className="text-lg leading-none">☰</span>
          </button>
          <Logo size={18} />
          <span className="text-sm font-semibold text-[var(--text-primary)]">Waypoint</span>
        </div>

        <main className="flex-1 min-w-0 overflow-hidden flex">{children}</main>
      </div>
    </div>
  );
}
