import { auth } from "@/auth";
import AppShell from "@/components/AppShell";
import type { NavItem } from "@/components/Sidebar";

const navItems: NavItem[] = [
  { href: "/admin", label: "Overview", icon: "◈" },
  { href: "/admin/federations", label: "Federations", icon: "🏛️" },
  { href: "/admin/sports", label: "Sports & Events", icon: "🏅" },
  { href: "/admin/games", label: "Games", icon: "🎮" },
  { href: "/admin/sub-admins", label: "Sub-Admins", icon: "🔑" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

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
