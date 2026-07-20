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
  onGoToNext,
}: {
  federationId: number;
  gameFederationId: number;
  completed: boolean;
  onSubmitted: () => void;
  onGoToNext?: () => void;
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
        <div key={sport.game_federation_sport_id} className="mb-6">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-lg">🏆</div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{sport.sport_name}</p>
              {sport.entry_policy_note && <p className="text-xs text-slate-500">{sport.entry_policy_note}</p>}
              {sport.age_cutoff_date && (
                <p className="text-xs text-slate-400">
                  Age eligibility: born on/before {new Date(sport.age_cutoff_date).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sport.events.map((ev) => (
              <div key={ev.game_event_id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-900">{ev.name}</p>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                    {ev.gender}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {ev.gender !== "female" && (
                    <QuotaField
                      label="Male"
                      max={ev.max_male}
                      defaultValue={ev.declared_male}
                      disabled={completed}
                      onCommit={(value) => updateDeclared(ev.game_event_id, "declared_male", value, ev)}
                    />
                  )}
                  {ev.gender !== "male" && (
                    <QuotaField
                      label="Female"
                      max={ev.max_female}
                      defaultValue={ev.declared_female}
                      disabled={completed}
                      onCommit={(value) => updateDeclared(ev.game_event_id, "declared_female", value, ev)}
                    />
                  )}
                </div>
              </div>
            ))}
            {sport.events.length === 0 && (
              <p className="text-sm text-slate-400">No events added yet for this sport.</p>
            )}
          </div>
        </div>
      ))}

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-end gap-3">
        {!completed && sports.length > 0 && (
          <button
            onClick={submit}
            disabled={submitting}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {submitting ? "Generating documents…" : "Submit Phase 2"}
          </button>
        )}
        {completed && (
          <>
            <p className="mr-auto text-sm text-emerald-700">Phase 2 has been submitted.</p>
            {onGoToNext && (
              <button
                onClick={onGoToNext}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Next Phase →
              </button>
            )}
          </>
        )}
      </div>

      {generated && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-2 text-sm font-medium text-slate-700">Generated documents</p>
          <div className="flex flex-wrap gap-2">
            {generated.map((d) => (
              <a
                key={d.referenceCode}
                href={d.downloadUrl}
                target="_blank"
                className="inline-flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100"
              >
                ⬇ {d.sportName} — Entry by Event
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function QuotaField({
  label,
  max,
  defaultValue,
  disabled,
  onCommit,
}: {
  label: string;
  max: number;
  defaultValue: number;
  disabled: boolean;
  onCommit: (value: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="flex items-center justify-between text-xs font-medium text-slate-600">
        {label}
        <span className="text-slate-400">quota {max}</span>
      </span>
      <input
        type="number"
        min={0}
        max={max}
        disabled={disabled}
        defaultValue={defaultValue}
        onBlur={(e) => onCommit(Number(e.target.value))}
        className="input"
      />
    </label>
  );
}
