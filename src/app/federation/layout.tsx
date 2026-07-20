import { auth } from "@/auth";
import { pool } from "@/lib/db";
import AppShell from "@/components/AppShell";
import type { NavItem } from "@/components/Sidebar";
import NotificationBell from "@/components/NotificationBell";

const navItems: NavItem[] = [
  { href: "/federation", label: "Dashboard", icon: "◈" },
  { href: "/federation/games", label: "Games", icon: "🎮" },
  { href: "/federation/roster", label: "Roster", icon: "👥" },
  { href: "/federation/settings", label: "Settings", icon: "⚙️" },
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
    <AppShell
      navItems={navItems}
      title={session?.user.name ?? "Federation"}
      subtitle="Federation Portal"
      logoSrc={logoUrl}
      headerRight={session?.user.federationId && <NotificationBell federationId={session.user.federationId} />}
    >
      {children}
    </AppShell>
  );
}
