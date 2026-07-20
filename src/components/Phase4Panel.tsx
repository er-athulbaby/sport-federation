"use client";

import { useEffect, useState, useCallback } from "react";
import EntityLogo from "@/components/EntityLogo";

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
  athlete_gender: string | null;
  athlete_photo: string | null;
  official_name: string | null;
  official_designation: string | null;
  official_photo: string | null;
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
  const [pendingEvent, setPendingEvent] = useState<Record<number, number>>({});
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

  async function assign(entryId: number, eventId: number) {
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
  const athletes = currentSport?.longList.filter((p) => p.participant_type === "athlete") ?? [];
  const officials = currentSport?.longList.filter((p) => p.participant_type === "official") ?? [];
  const confirmedCount = (people: LongListPerson[]) =>
    people.filter((p) => shortList.some((s) => s.long_list_id === p.entry_id)).length;

  return (
    <div>
      {sports.length === 0 && <p className="text-sm text-slate-400">No sports set up yet.</p>}

      {sports.length > 1 && (
        <div className="mb-4 flex gap-2">
          {sports.map((s) => (
            <button
              key={s.game_federation_sport_id}
              onClick={() => setActiveSport(s.game_federation_sport_id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                activeSport === s.game_federation_sport_id
                  ? "bg-brand-600 text-white"
                  : "border border-slate-300 bg-white text-slate-700"
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
          <PersonSection
            icon="👥"
            title="Athletes"
            description="Select athletes from your long list"
            confirmed={confirmedCount(athletes)}
            total={athletes.length}
          >
            {athletes.map((person) => (
              <PersonCard
                key={person.entry_id}
                person={person}
                events={currentSport.events}
                shortList={shortList}
                completed={completed}
                pendingEvent={pendingEvent[person.entry_id]}
                onPendingEventChange={(eventId) => setPendingEvent({ ...pendingEvent, [person.entry_id]: eventId })}
                onAssign={(eventId) => assign(person.entry_id, eventId)}
                onUnassign={unassign}
              />
            ))}
            {athletes.length === 0 && <p className="text-sm text-slate-400">No athletes on the long list for this sport.</p>}
          </PersonSection>

          <div className="my-6 border-t border-slate-100" />

          <PersonSection
            icon="🎽"
            title="Team Officials"
            description="Select officials from your long list"
            confirmed={confirmedCount(officials)}
            total={officials.length}
          >
            {officials.map((person) => (
              <PersonCard
                key={person.entry_id}
                person={person}
                events={currentSport.events}
                shortList={shortList}
                completed={completed}
                pendingEvent={pendingEvent[person.entry_id]}
                onPendingEventChange={(eventId) => setPendingEvent({ ...pendingEvent, [person.entry_id]: eventId })}
                onAssign={(eventId) => assign(person.entry_id, eventId)}
                onUnassign={unassign}
              />
            ))}
            {officials.length === 0 && <p className="text-sm text-slate-400">No officials on the long list for this sport.</p>}
          </PersonSection>
        </>
      )}

      <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
        {completed ? (
          <p className="text-sm text-emerald-700">Phase 4 has been finalized — this is the official delegation.</p>
        ) : (
          <button
            onClick={submit}
            disabled={submitting || shortList.length === 0}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {submitting ? "Finalizing…" : "Submit Phase 4"}
          </button>
        )}
      </div>

      {generatedUrl && (
        <p className="mt-3 text-right text-sm">
          <a href={generatedUrl} target="_blank" className="text-brand-700 underline">
            Download Delegation Short List
          </a>
        </p>
      )}
    </div>
  );
}

function PersonSection({
  icon,
  title,
  description,
  confirmed,
  total,
  children,
}: {
  icon: string;
  title: string;
  description: string;
  confirmed: number;
  total: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-lg">{icon}</div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
          {confirmed} of {total} confirmed
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </div>
  );
}

function PersonCard({
  person,
  events,
  shortList,
  completed,
  pendingEvent,
  onPendingEventChange,
  onAssign,
  onUnassign,
}: {
  person: LongListPerson;
  events: GameEvent[];
  shortList: ShortEntry[];
  completed: boolean;
  pendingEvent: number | undefined;
  onPendingEventChange: (eventId: number) => void;
  onAssign: (eventId: number) => void;
  onUnassign: (shortEntryId: number) => void;
}) {
  const name = person.athlete_name ?? person.official_name ?? "";
  const photo = person.athlete_photo ?? person.official_photo;
  const assignments = shortList.filter((s) => s.long_list_id === person.entry_id);
  const isConfirmed = assignments.length > 0;

  return (
    <div className={`rounded-xl border p-3 ${isConfirmed ? "border-brand-200 bg-brand-50/40" : "border-slate-200 bg-white"}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isConfirmed}
            disabled={completed || (!isConfirmed && !pendingEvent)}
            onChange={(e) => {
              if (!e.target.checked && assignments.length > 0) {
                assignments.forEach((a) => onUnassign(a.short_entry_id));
              }
            }}
          />
          <EntityLogo src={photo} name={name || "?"} size={36} />
        </div>
        {person.participant_type === "athlete" && person.athlete_gender && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
            {person.athlete_gender === "male" ? "M" : "F"}
          </span>
        )}
      </div>

      <p className="mt-2 text-sm font-medium text-slate-900">{name}</p>
      {person.participant_type === "official" && (
        <p className="text-xs text-slate-500">{person.official_designation ?? "Official"}</p>
      )}

      {isConfirmed ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {assignments.map((a) => {
            const ev = events.find((e) => e.game_event_id === a.game_event_id);
            return (
              <span key={a.short_entry_id} className="rounded-full bg-brand-100 px-2 py-0.5 text-xs text-brand-700">
                {ev?.name ?? "Event"}
                {!completed && (
                  <button onClick={() => onUnassign(a.short_entry_id)} className="ml-1 text-brand-400 hover:text-red-600">
                    ×
                  </button>
                )}
              </span>
            );
          })}
        </div>
      ) : (
        !completed && (
          <div className="mt-2 flex gap-1">
            <select
              value={pendingEvent ?? ""}
              onChange={(e) => onPendingEventChange(Number(e.target.value))}
              className="input flex-1 text-xs"
            >
              <option value="">Select event…</option>
              {events.map((ev) => (
                <option key={ev.game_event_id} value={ev.game_event_id}>{ev.name}</option>
              ))}
            </select>
            <button
              disabled={!pendingEvent}
              onClick={() => pendingEvent && onAssign(pendingEvent)}
              className="rounded-md bg-brand-600 px-2 py-1 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-40"
            >
              Add
            </button>
          </div>
        )
      )}
    </div>
  );
}
