"use client";

import { useEffect, useState, useCallback, use } from "react";

type Sport = { id: number; name: string };
type Assignment = { federation_sport_id: number; sport_id: number; name: string };
type Federation = { id: number; name: string; email: string; username: string };

export default function FederationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [federation, setFederation] = useState<Federation | null>(null);
  const [allSports, setAllSports] = useState<Sport[]>([]);
  const [assigned, setAssigned] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [fedRes, sportsRes, assignedRes] = await Promise.all([
      fetch(`/api/admin/federations/${id}`),
      fetch("/api/admin/sports"),
      fetch(`/api/admin/federations/${id}/sports`),
    ]);
    if (fedRes.ok) setFederation(await fedRes.json());
    if (sportsRes.ok) setAllSports(await sportsRes.json());
    if (assignedRes.ok) setAssigned(await assignedRes.json());
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleSport(sportId: number, isAssigned: boolean) {
    if (isAssigned) {
      await fetch(`/api/admin/federations/${id}/sports/${sportId}`, { method: "DELETE" });
    } else {
      await fetch(`/api/admin/federations/${id}/sports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sport_id: sportId }),
      });
    }
    load();
  }

  if (loading) return <p className="text-slate-400">Loading…</p>;
  if (!federation) return <p className="text-slate-400">Federation not found.</p>;

  const assignedIds = new Set(assigned.map((a) => a.sport_id));

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">{federation.name}</h1>
      <p className="mb-6 text-sm text-slate-500">
        {federation.username} &middot; {federation.email}
      </p>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Assigned sports
      </h2>
      <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4">
        {allSports.length === 0 && (
          <p className="text-sm text-slate-400">No sports in the catalog yet — add some under Sports &amp; Events.</p>
        )}
        {allSports.map((sport) => {
          const isAssigned = assignedIds.has(sport.id);
          return (
            <label key={sport.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isAssigned}
                onChange={() => toggleSport(sport.id, isAssigned)}
              />
              {sport.name}
            </label>
          );
        })}
      </div>
    </div>
  );
}
