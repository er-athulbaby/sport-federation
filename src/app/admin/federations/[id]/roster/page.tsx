import RosterManager from "@/components/RosterManager";

export default async function AdminFederationRosterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Roster</h1>
      <RosterManager federationId={Number(id)} />
    </div>
  );
}
