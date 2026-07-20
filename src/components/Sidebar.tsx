"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import EntityLogo from "@/components/EntityLogo";

export type NavItem = { href: string; label: string; icon: string };

export default function Sidebar({
  navItems,
  title,
  subtitle,
  logoSrc,
  extra,
}: {
  navItems: NavItem[];
  title: string;
  subtitle: string;
  logoSrc?: string | null;
  extra?: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <EntityLogo src={logoSrc} name={title} />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
          <p className="truncate text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg border-l-2 px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "border-brand-600 bg-brand-50 text-brand-700"
                  : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {extra}

      <div className="border-t border-slate-100 px-3 py-3">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900"
        >
          <span className="text-base">🚪</span>
          Logout
        </button>
      </div>
    </div>
  );
}
