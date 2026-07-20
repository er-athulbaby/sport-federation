"use client";

import { useEffect, useState, useCallback } from "react";

type GameEvent = {
  game_event_id: number;
  name: string;
  gender: string;
  max_male: number;
  max_female: number;
  declared_male: number;
  declared_female: number;
};

type SportGroup = {
  game_federation_sport_id: number;
  sport_name: string;
  entry_policy_note: string | null;
  age_cutoff_date: string | null;
  events: GameEvent[];
};

type GeneratedDoc = { sportName: string; referenceCode: string; downloadUrl: string };

export default function Phase2Panel({
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
  const [sports, setSports] = useState<SportGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<GeneratedDoc[] | null>(null);

  const base = `/api/federations/${federationId}/games/${gameFederationId}`;

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${base}/phase2`);
    if (res.ok) setSports(await res.json());
    setLoading(false);
  }, [base]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateDeclared(gameEventId: number, field: "declared_male" | "declared_female", value: number, current: GameEvent) {
    setError(null);
    const body = {
      declared_male: field === "declared_male" ? value : current.declared_male,
      declared_female: field === "declared_female" ? value : current.declared_female,
    };
    const res = await fetch(`${base}/phase2/events/${gameEventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Could not update");
      return;
    }
    load();
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    const res = await fetch(`${base}/phase2/submit`, { method: "POST" });
    setSubmitting(false);
    if (!res.ok) {
      setError((await res.json()).error ?? "Could not submit");
      return;
    }
    const data = await res.json();
    setGenerated(data.documents);
    onSubmitted();
  }

  if (loading) return <p className="text-slate-400">Loading…</p>;

  return (
    <div>
      {sports.length === 0 && (
        <p className="text-sm text-slate-400">No sports/events have been set up for your federation in this game yet.</p>
      )}

      {sports.map((sport) => (
        <div key={sport.game_federation_sport_id} className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-900">{sport.sport_name}</h3>
          {sport.entry_policy_note && <p className="mb-2 text-xs text-slate-500">{sport.entry_policy_note}</p>}
          {sport.age_cutoff_date && (
            <p className="mb-3 text-xs text-slate-500">
              Age eligibility: born on/before {new Date(sport.age_cutoff_date).toLocaleDateString()}
            </p>
          )}
          <table className="w-full text-xs">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="py-1">Event</th>
                <th className="py-1">Max male</th>
                <th className="py-1">Declared male</th>
                <th className="py-1">Max female</th>
                <th className="py-1">Declared female</th>
              </tr>
            </thead>
            <tbody>
              {sport.events.map((ev) => (
                <tr key={ev.game_event_id} className="border-t border-slate-100">
                  <td className="py-1">{ev.name} <span className="text-slate-400">({ev.gender})</span></td>
                  <td className="py-1">{ev.max_male}</td>
                  <td className="py-1">
                    <input
                      type="number"
                      min={0}
                      max={ev.max_male}
                      disabled={completed || ev.gender === "female"}
                      defaultValue={ev.declared_male}
                      onBlur={(e) => updateDeclared(ev.game_event_id, "declared_male", Number(e.target.value), ev)}
                      className="input w-16"
                    />
                  </td>
                  <td className="py-1">{ev.max_female}</td>
                  <td className="py-1">
                    <input
                      type="number"
                      min={0}
                      max={ev.max_female}
                      disabled={completed || ev.gender === "male"}
                      defaultValue={ev.declared_female}
                      onBlur={(e) => updateDeclared(ev.game_event_id, "declared_female", Number(e.target.value), ev)}
                      className="input w-16"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {!completed && sports.length > 0 && (
        <button
          onClick={submit}
          disabled={submitting}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {submitting ? "Generating documents…" : "Submit Phase 2"}
        </button>
      )}

      {completed && <p className="text-sm text-emerald-700">Phase 2 has been submitted.</p>}

      {generated && (
        <div className="mt-4 rounded-md border border-slate-200 bg-white p-3 text-sm">
          <p className="mb-2 font-medium text-slate-700">Generated documents:</p>
          <ul className="flex flex-col gap-1">
            {generated.map((d) => (
              <li key={d.referenceCode}>
                <a href={d.downloadUrl} target="_blank" className="text-slate-700 underline">
                  {d.sportName} — Entry by Event ({d.referenceCode})
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
