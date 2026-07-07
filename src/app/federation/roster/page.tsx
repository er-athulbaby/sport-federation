import { redirect } from "next/navigation";
import { auth } from "@/auth";
import RosterManager from "@/components/RosterManager";

export default async function FederationRosterPage() {
  const session = await auth();
  if (!session?.user.federationId) redirect("/login");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Roster</h1>
      <RosterManager federationId={session.user.federationId} />
    </div>
  );
}
