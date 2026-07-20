"use client";

import { useEffect, useState, useCallback } from "react";
import EntityLogo from "@/components/EntityLogo";

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

type Athlete = { id: number; full_name_en: string; gender: string; photo_url: string | null };
type Official = { id: number; full_name_en: string; designation: string | null; photo_url: string | null };

export default function Phase3Panel({
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
  const entryFor = (participantType: "athlete" | "official", id: number) =>
    sportEntries.find((e) =>
      participantType === "athlete" ? e.athlete_id === id : e.official_id === id
    );

  return (
    <div>
      {sports.length === 0 && (
        <p className="text-sm text-slate-400">No sports set up for your federation in this game yet.</p>
      )}

      {sports.length > 1 && (
        <div className="mb-4 flex gap-2">
          {sports.map((s) => (
            <button
              key={s.sport_id}
              onClick={() => setActiveSport(s.sport_id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                activeSport === s.sport_id ? "bg-brand-600 text-white" : "border border-slate-300 bg-white text-slate-700"
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

      <PersonSection
        icon="👥"
        title="Athletes"
        description="Tick athletes to add them to the long list"
        selected={athletes.filter((a) => entryFor("athlete", a.id)).length}
        total={athletes.length}
      >
        {athletes.map((a) => {
          const entry = entryFor("athlete", a.id);
          return (
            <RosterCard
              key={a.id}
              name={a.full_name_en}
              photo={a.photo_url}
              subtitle={a.gender}
              checked={Boolean(entry)}
              disabled={completed}
              onToggle={() => (entry ? removeEntry(entry.entry_id) : addEntry("athlete", a.id))}
            />
          );
        })}
        {athletes.length === 0 && <p className="text-sm text-slate-400">No athletes in roster yet.</p>}
      </PersonSection>

      <div className="my-6 border-t border-slate-100" />

      <PersonSection
        icon="🎽"
        title="Team Officials"
        description="Tick officials to add them to the long list"
        selected={officials.filter((o) => entryFor("official", o.id)).length}
        total={officials.length}
      >
        {officials.map((o) => {
          const entry = entryFor("official", o.id);
          return (
            <RosterCard
              key={o.id}
              name={o.full_name_en}
              photo={o.photo_url}
              subtitle={o.designation ?? "Official"}
              checked={Boolean(entry)}
              disabled={completed}
              onToggle={() => (entry ? removeEntry(entry.entry_id) : addEntry("official", o.id))}
            />
          );
        })}
        {officials.length === 0 && <p className="text-sm text-slate-400">No officials in roster yet.</p>}
      </PersonSection>

      <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
        {completed ? (
          <>
            <p className="mr-auto text-sm text-emerald-700">Phase 3 has been submitted.</p>
            {onGoToNext && (
              <button
                onClick={onGoToNext}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Next Phase →
              </button>
            )}
          </>
        ) : (
          <button
            onClick={submit}
            disabled={submitting || entries.length === 0}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {submitting ? "Generating document…" : "Submit Phase 3"}
          </button>
        )}
      </div>

      {generatedUrl && (
        <div className="mt-3 flex justify-end">
          <a
            href={generatedUrl}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100"
          >
            ⬇ Download Delegation Long List
          </a>
        </div>
      )}
    </div>
  );
}

function PersonSection({
  icon,
  title,
  description,
  selected,
  total,
  children,
}: {
  icon: string;
  title: string;
  description: string;
  selected: number;
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
          {selected} of {total} selected
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </div>
  );
}

function RosterCard({
  name,
  photo,
  subtitle,
  checked,
  disabled,
  onToggle,
}: {
  name: string;
  photo: string | null;
  subtitle: string;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <label
      className={`flex items-center gap-3 rounded-xl border p-3 ${
        checked ? "border-brand-200 bg-brand-50/40" : "border-slate-200 bg-white"
      } ${disabled ? "" : "cursor-pointer"}`}
    >
      <input type="checkbox" checked={checked} disabled={disabled} onChange={onToggle} />
      <EntityLogo src={photo} name={name} size={36} />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-900">{name}</p>
        <p className="truncate text-xs capitalize text-slate-500">{subtitle}</p>
      </div>
    </label>
  );
}
