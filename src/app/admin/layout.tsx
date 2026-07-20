import { auth } from "@/auth";
import { pool } from "@/lib/db";
import AppShell from "@/components/AppShell";
import type { NavItem } from "@/components/Sidebar";

const ALL_NAV: (NavItem & { resource?: string })[] = [
  { href: "/admin", label: "Overview", icon: "◈" },
  { href: "/admin/federations", label: "Federations", icon: "🏛️", resource: "federations" },
  { href: "/admin/sports", label: "Sports & Events", icon: "🏅", resource: "sports_events" },
  { href: "/admin/games", label: "Games", icon: "🎮", resource: "games" },
  { href: "/admin/athletes", label: "Athletes", icon: "🏃", resource: "roster" },
  { href: "/admin/officials", label: "Team Officials", icon: "🧑‍🏫", resource: "roster" },
  { href: "/admin/sub-admins", label: "Sub-Admins", icon: "🔑" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const isSuperAdmin = session?.user.adminRole === "super_admin";

  let viewableResources = new Set<string>();
  if (session?.user.role === "admin" && !isSuperAdmin) {
    const perms = await pool.query(
      `SELECT resource FROM admin_permissions WHERE admin_id = $1 AND can_view = true`,
      [session.user.id]
    );
    viewableResources = new Set(perms.rows.map((r) => r.resource));
  }

  const navItems = ALL_NAV.filter((item) => {
    if (item.label === "Sub-Admins") return isSuperAdmin;
    if (!item.resource) return true;
    return isSuperAdmin || viewableResources.has(item.resource);
  });

  return (
    <AppShell
      navItems={navItems}
      title="Admin"
      subtitle="Sport Federation Portal"
      headerRight={<span className="text-sm text-slate-500">{session?.user.name}</span>}
    >
      {children}
    </AppShell>
  );
}
