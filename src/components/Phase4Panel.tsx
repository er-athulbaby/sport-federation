"use client";

import { useEffect, useState, useCallback } from "react";

type GameEvent = {
  game_event_id: number;
  event_id: number;
  name: string;
  gender: string;
  declared_male: number;
  declared_female: number;
};

type LongListPerson = {
  entry_id: number;
  participant_type: "athlete" | "official";
  athlete_name: string | null;
  official_name: string | null;
  athlete_gender: string | null;
};

type SportGroup = {
  game_federation_sport_id: number;
  sport_id: number;
  sport_name: string;
  events: GameEvent[];
  longList: LongListPerson[];
};

type ShortEntry = { short_entry_id: number; long_list_id: number; game_event_id: number };

export default function Phase4Panel({
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
  const [shortList, setShortList] = useState<ShortEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSport, setActiveSport] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const base = `/api/federations/${federationId}/games/${gameFederationId}`;

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${base}/phase4`);
    if (res.ok) {
      const data = await res.json();
      setSports(data.sports);
      setShortList(data.shortList);
      setActiveSport((prev) => prev ?? data.sports[0]?.game_federation_sport_id ?? null);
    }
    setLoading(false);
  }, [base]);

  useEffect(() => {
    load();
  }, [load]);

  async function assign(entryId: number) {
    const eventId = selectedEvent[entryId];
    if (!eventId) return;
    setError(null);
    const res = await fetch(`${base}/phase4/entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ long_list_id: entryId, game_event_id: eventId }),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Could not assign");
      return;
    }
    load();
  }

  async function unassign(shortEntryId: number) {
    await fetch(`${base}/phase4/entries/${shortEntryId}`, { method: "DELETE" });
    load();
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    const res = await fetch(`${base}/phase4/submit`, { method: "POST" });
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

  const currentSport = sports.find((s) => s.game_federation_sport_id === activeSport);

  function assignmentsFor(gameEventId: number) {
    return shortList.filter((s) => s.game_event_id === gameEventId);
  }

  return (
    <div>
      {sports.length === 0 && (
        <p className="text-sm text-slate-400">No sports set up yet.</p>
      )}

      {sports.length > 0 && (
        <div className="mb-4 flex gap-2">
          {sports.map((s) => (
            <button
              key={s.game_federation_sport_id}
              onClick={() => setActiveSport(s.game_federation_sport_id)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                activeSport === s.game_federation_sport_id ? "bg-slate-900 text-white" : "border border-slate-300 bg-white text-slate-700"
              }`}
            >
              {s.sport_name}
            </button>
          ))}
        </div>
      )}

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {currentSport && (
        <>
          <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3">
            <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Events &amp; quota</p>
            <table className="w-full text-xs">
              <thead className="text-left text-slate-500">
                <tr><th className="py-1">Event</th><th className="py-1">Male filled</th><th className="py-1">Female filled</th></tr>
              </thead>
              <tbody>
                {currentSport.events.map((ev) => {
                  const filled = assignmentsFor(ev.game_event_id).length;
                  return (
                    <tr key={ev.game_event_id} className="border-t border-slate-100">
                      <td className="py-1">{ev.name}</td>
                      <td className="py-1">{ev.gender !== "female" ? `${filled} / ${ev.declared_male}` : "-"}</td>
                      <td className="py-1">{ev.gender !== "male" ? `${filled} / ${ev.declared_female}` : "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Long list &mdash; assign to event</p>
            <ul className="flex flex-col gap-2">
              {currentSport.longList.map((person) => {
                const assignedEntries = shortList.filter((s) => s.long_list_id === person.entry_id);
                return (
                  <li key={person.entry_id} className="flex flex-col gap-1 border-b border-slate-100 pb-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>
                        {person.athlete_name ?? person.official_name}{" "}
                        <span className="text-xs text-slate-400">({person.participant_type})</span>
                      </span>
                      {!completed && (
                        <div className="flex items-center gap-1">
                          <select
                            className="input w-40"
                            value={selectedEvent[person.entry_id] ?? ""}
                            onChange={(e) => setSelectedEvent({ ...selectedEvent, [person.entry_id]: Number(e.target.value) })}
                          >
                            <option value="">Select event…</option>
                            {currentSport.events.map((ev) => (
                              <option key={ev.game_event_id} value={ev.game_event_id}>{ev.name}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => assign(person.entry_id)}
                            className="rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white hover:bg-slate-800"
                          >
                            Assign
                          </button>
                        </div>
                      )}
                    </div>
                    {assignedEntries.length > 0 && (
                      <ul className="flex flex-wrap gap-1">
                        {assignedEntries.map((a) => {
                          const ev = currentSport.events.find((e) => e.game_event_id === a.game_event_id);
                          return (
                            <li key={a.short_entry_id} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                              {ev?.name}
                              {!completed && (
                                <button onClick={() => unassign(a.short_entry_id)} className="ml-1 text-slate-400 hover:text-red-600">
                                  ×
                                </button>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
              {currentSport.longList.length === 0 && (
                <li className="text-sm text-slate-400">No one on the long list for this sport.</li>
              )}
            </ul>
          </div>
        </>
      )}

      {!completed && shortList.length > 0 && (
        <button
          onClick={submit}
          disabled={submitting}
          className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {submitting ? "Finalizing…" : "Finalize Phase 4 (Short List)"}
        </button>
      )}

      {completed && <p className="mt-4 text-sm text-emerald-700">Phase 4 has been finalized — this is the official delegation.</p>}

      {generatedUrl && (
        <p className="mt-3 text-sm">
          <a href={generatedUrl} target="_blank" className="text-slate-700 underline">
            Download Delegation Short List
          </a>
        </p>
      )}
    </div>
  );
}
