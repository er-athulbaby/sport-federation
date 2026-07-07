"use client";

import { useEffect, useState, useCallback } from "react";

type Sport = { sport_id: number; sport_name: string; age_cutoff_date: string | null };

type Entry = {
  entry_id: number;
  sport_id: number;
  participant_type: "athlete" | "official";
  athlete_id: number | null;
  official_id: number | null;
  athlete_name: string | null;
  official_name: string | null;
};

type Athlete = { id: number; full_name_en: string; dob: string | null };
type Official = { id: number; full_name_en: string };

export default function Phase3Panel({
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
  const [sports, setSports] = useState<Sport[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [officials, setOfficials] = useState<Official[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSport, setActiveSport] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const base = `/api/federations/${federationId}/games/${gameFederationId}`;

  const load = useCallback(async () => {
    setLoading(true);
    const [phase3Res, athletesRes, officialsRes] = await Promise.all([
      fetch(`${base}/phase3`),
      fetch(`/api/federations/${federationId}/athletes`),
      fetch(`/api/federations/${federationId}/officials`),
    ]);
    if (phase3Res.ok) {
      const data = await phase3Res.json();
      setSports(data.sports);
      setEntries(data.entries);
      if (!activeSport && data.sports.length > 0) setActiveSport(data.sports[0].sport_id);
    }
    if (athletesRes.ok) setAthletes(await athletesRes.json());
    if (officialsRes.ok) setOfficials(await officialsRes.json());
    setLoading(false);
  }, [base, federationId, activeSport]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addEntry(participantType: "athlete" | "official", id: number) {
    if (!activeSport) return;
    setError(null);
    const res = await fetch(`${base}/phase3/entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sport_id: activeSport,
        participant_type: participantType,
        athlete_id: participantType === "athlete" ? id : undefined,
        official_id: participantType === "official" ? id : undefined,
      }),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Could not add");
      return;
    }
    load();
  }

  async function removeEntry(entryId: number) {
    await fetch(`${base}/phase3/entries/${entryId}`, { method: "DELETE" });
    load();
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    const res = await fetch(`${base}/phase3/submit`, { method: "POST" });
    setSubmitting(false);
    if (!res.ok) {
      setError((await res.json()).error ?? "Could not submit");
      return;
    }
    const data = await res.json();
    setGeneratedUrl(data.document.downloadUrl);
    onSubmitted();
  }

  if (loading) return <p className="text-slate-400">Loading…</p>;

  const currentSport = sports.find((s) => s.sport_id === activeSport);
  const sportEntries = entries.filter((e) => e.sport_id === activeSport);
  const addedAthleteIds = new Set(sportEntries.filter((e) => e.athlete_id).map((e) => e.athlete_id));
  const addedOfficialIds = new Set(sportEntries.filter((e) => e.official_id).map((e) => e.official_id));

  return (
    <div>
      {sports.length === 0 && (
        <p className="text-sm text-slate-400">No sports set up for your federation in this game yet.</p>
      )}

      {sports.length > 0 && (
        <div className="mb-4 flex gap-2">
          {sports.map((s) => (
            <button
              key={s.sport_id}
              onClick={() => setActiveSport(s.sport_id)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                activeSport === s.sport_id ? "bg-slate-900 text-white" : "border border-slate-300 bg-white text-slate-700"
              }`}
            >
              {s.sport_name}
            </button>
          ))}
        </div>
      )}

      {currentSport?.age_cutoff_date && (
        <p className="mb-3 text-xs text-slate-500">
          Age eligibility for {currentSport.sport_name}: born on/before {new Date(currentSport.age_cutoff_date).toLocaleDateString()}
        </p>
      )}

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {!completed && activeSport && (
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Add athlete</p>
            <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
              {athletes.filter((a) => !addedAthleteIds.has(a.id)).map((a) => (
                <button
                  key={a.id}
                  onClick={() => addEntry("athlete", a.id)}
                  className="rounded px-2 py-1 text-left text-sm hover:bg-slate-50"
                >
                  {a.full_name_en}
                </button>
              ))}
              {athletes.length === 0 && <p className="text-xs text-slate-400">No athletes in roster yet.</p>}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Add official</p>
            <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
              {officials.filter((o) => !addedOfficialIds.has(o.id)).map((o) => (
                <button
                  key={o.id}
                  onClick={() => addEntry("official", o.id)}
                  className="rounded px-2 py-1 text-left text-sm hover:bg-slate-50"
                >
                  {o.full_name_en}
                </button>
              ))}
              {officials.length === 0 && <p className="text-xs text-slate-400">No officials in roster yet.</p>}
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3">
        <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
          {currentSport?.sport_name} long list ({sportEntries.length})
        </p>
        <ul className="flex flex-col gap-1">
          {sportEntries.map((e) => (
            <li key={e.entry_id} className="flex items-center justify-between text-sm">
              <span>
                {e.athlete_name ?? e.official_name}{" "}
                <span className="text-xs text-slate-400">({e.participant_type})</span>
              </span>
              {!completed && (
                <button onClick={() => removeEntry(e.entry_id)} className="text-xs text-slate-400 hover:text-red-600">
                  Remove
                </button>
              )}
            </li>
          ))}
          {sportEntries.length === 0 && <li className="text-sm text-slate-400">Nobody added yet.</li>}
        </ul>
      </div>

      {!completed && entries.length > 0 && (
        <button
          onClick={submit}
          disabled={submitting}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {submitting ? "Generating document…" : "Submit Phase 3"}
        </button>
      )}

      {completed && <p className="text-sm text-emerald-700">Phase 3 has been submitted.</p>}

      {generatedUrl && (
        <p className="mt-3 text-sm">
          <a href={generatedUrl} target="_blank" className="text-slate-700 underline">
            Download Delegation Long List
          </a>
        </p>
      )}
    </div>
  );
}
