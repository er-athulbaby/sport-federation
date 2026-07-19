"use client";

import { useEffect, useState, useCallback } from "react";

type SportRow = {
  game_federation_sport_id: number;
  sport_id: number;
  sport_name: string;
  participate_men: boolean;
  participate_women: boolean;
};

export default function Phase1Panel({
  federationId,
  gameFederationId,
  completed,
  onSubmitted,
}: {
  federationId: number;
  gameFederationId: number;
  completed: boolean;
  onSubmitted: () => void;
}) {
  const [sports, setSports] = useState<SportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const base = `/api/federations/${federationId}/games/${gameFederationId}`;

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${base}/phase1`);
    if (res.ok) setSports(await res.json());
    setLoading(false);
  }, [base]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(gfsId: number, field: "participate_men" | "participate_women", value: boolean) {
    setError(null);
    const res = await fetch(`${base}/phase1/sports/${gfsId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Could not update");
      return;
    }
    load();
  }

  async function decline(gfsId: number) {
    await toggle(gfsId, "participate_men", false);
    await fetch(`${base}/phase1/sports/${gfsId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participate_women: false }),
    });
    load();
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    const res = await fetch(`${base}/phase1/submit`, { method: "POST" });
    setSubmitting(false);
    if (!res.ok) {
      setError((await res.json()).error ?? "Could not submit");
      return;
    }
    onSubmitted();
  }

  if (loading) return <p className="text-slate-400">Loading…</p>;

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-4">
        <p className="text-sm font-semibold text-slate-900">Gender Categories</p>
        <p className="text-xs text-slate-500">Specify which gender categories you will participate in, per sport.</p>
      </div>

      <div className="divide-y divide-slate-100">
        {sports.map((sport) => (
          <div key={sport.game_federation_sport_id} className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Sport</p>
              <p className="text-sm font-medium text-slate-900">{sport.sport_name}</p>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  disabled={completed}
                  checked={sport.participate_men}
                  onChange={(e) => toggle(sport.game_federation_sport_id, "participate_men", e.target.checked)}
                />
                Men
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  disabled={completed}
                  checked={sport.participate_women}
                  onChange={(e) => toggle(sport.game_federation_sport_id, "participate_women", e.target.checked)}
                />
                Women
              </label>
              {!completed && (
                <button
                  onClick={() => decline(sport.game_federation_sport_id)}
                  title="Decline this sport"
                  className="text-slate-400 hover:text-red-600"
                >
                  🗑
                </button>
              )}
            </div>
          </div>
        ))}
        {sports.length === 0 && (
          <p className="px-5 py-6 text-sm text-slate-400">No sports have been set up for your federation in this game yet.</p>
        )}
      </div>

      {error && <p className="px-5 pt-3 text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-5 py-4">
        {completed ? (
          <p className="text-sm text-emerald-700">Phase 1 has been submitted.</p>
        ) : (
          <button
            onClick={submit}
            disabled={submitting || sports.length === 0}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit Phase 1"}
          </button>
        )}
      </div>
    </div>
  );
}
