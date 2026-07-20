"use client";

import { useState } from "react";
import Sidebar, { NavItem } from "@/components/Sidebar";

export default function AppShell({
  navItems,
  title,
  subtitle,
  logoSrc,
  extra,
  headerRight,
  children,
}: {
  navItems: NavItem[];
  title: string;
  subtitle: string;
  logoSrc?: string | null;
  extra?: React.ReactNode;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <div className="hidden md:flex">
        <Sidebar navItems={navItems} title={title} subtitle={subtitle} logoSrc={logoSrc} extra={extra} />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="fixed inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="relative z-50">
            <Sidebar navItems={navItems} title={title} subtitle={subtitle} logoSrc={logoSrc} extra={extra} />
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:justify-end md:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
            aria-label="Open menu"
          >
            ☰
          </button>
          <div className="flex items-center gap-3">{headerRight}</div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
