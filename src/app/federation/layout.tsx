import Link from "next/link";
import { auth, signOut } from "@/auth";
import { pool } from "@/lib/db";
import NotificationBell from "@/components/NotificationBell";
import EntityLogo from "@/components/EntityLogo";

const navItems = [
  { href: "/federation", label: "Dashboard" },
  { href: "/federation/games", label: "Games" },
  { href: "/federation/roster", label: "Roster" },
  { href: "/federation/settings", label: "Settings" },
];

export default async function FederationLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  let logoUrl: string | null = null;
  if (session?.user.federationId) {
    const result = await pool.query("SELECT logo_url FROM federations WHERE id = $1", [
      session.user.federationId,
    ]);
    logoUrl = result.rows[0]?.logo_url ?? null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <EntityLogo src={logoUrl} name={session?.user.name ?? "F"} />
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-900">{session?.user.name}</p>
              <p className="text-xs text-slate-400">Federation Portal</p>
            </div>
          </div>
          <nav className="hidden gap-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {session?.user.federationId && <NotificationBell federationId={session.user.federationId} />}
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                Logout
              </button>
            </form>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-6 py-2 md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
