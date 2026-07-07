"use client";

import { useEffect, useState, useCallback, use } from "react";

type Game = {
  id: number;
  name: string;
  status: string;
  phase1_enabled: boolean;
  phase2_enabled: boolean;
  phase3_enabled: boolean;
  phase4_enabled: boolean;
};

type FederationOption = { id: number; name: string };

type GameFederation = {
  game_federation_id: number;
  federation_id: number;
  name: string;
};

type GameFederationSport = {
  game_federation_sport_id: number;
  sport_id: number;
  name: string;
  entry_policy_note: string | null;
  age_cutoff_date: string | null;
};

type FederationSportOption = { sport_id: number; name: string };

type GameEvent = {
  game_event_id: number;
  event_id: number;
  name: string;
  gender: string;
  max_male: number;
  max_female: number;
  declared_male: number;
  declared_female: number;
};

type SportWithEvents = { id: number; name: string; events: { id: number; name: string; gender: string }[] };

export default function GameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: gameId } = use(params);
  const [game, setGame] = useState<Game | null>(null);
  const [allFederations, setAllFederations] = useState<FederationOption[]>([]);
  const [gameFederations, setGameFederations] = useState<GameFederation[]>([]);
  const [addFederationId, setAddFederationId] = useState("");

  const loadGame = useCallback(async () => {
    const res = await fetch(`/api/admin/games/${gameId}`);
    if (res.ok) setGame(await res.json());
  }, [gameId]);

  const loadFederations = useCallback(async () => {
    const [allRes, gameRes] = await Promise.all([
      fetch("/api/admin/federations"),
      fetch(`/api/admin/games/${gameId}/federations`),
    ]);
    if (allRes.ok) setAllFederations(await allRes.json());
    if (gameRes.ok) setGameFederations(await gameRes.json());
  }, [gameId]);

  useEffect(() => {
    loadGame();
    loadFederations();
  }, [loadGame, loadFederations]);

  async function addFederation(e: React.FormEvent) {
    e.preventDefault();
    if (!addFederationId) return;
    await fetch(`/api/admin/games/${gameId}/federations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ federation_id: Number(addFederationId) }),
    });
    setAddFederationId("");
    loadFederations();
  }

  async function removeFederation(gfId: number) {
    await fetch(`/api/admin/games/${gameId}/federations/${gfId}`, { method: "DELETE" });
    loadFederations();
  }

  const availableFederations = allFederations.filter(
    (f) => !gameFederations.some((gf) => gf.federation_id === f.id)
  );

  if (!game) return <p className="text-slate-400">Loading…</p>;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">{game.name}</h1>
      <p className="mb-6 text-sm text-slate-500">
        Enabled phases:{" "}
        {[
          game.phase1_enabled && "1",
          game.phase2_enabled && "2",
          game.phase3_enabled && "3",
          game.phase4_enabled && "4",
        ].filter(Boolean).join(", ") || "none"}
      </p>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Participating federations
      </h2>

      <form onSubmit={addFederation} className="mb-4 flex gap-2">
        <select
          value={addFederationId}
          onChange={(e) => setAddFederationId(e.target.value)}
          className="input max-w-xs"
        >
          <option value="">Select a federation…</option>
          {availableFederations.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
        <button className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          Add
        </button>
      </form>

      <div className="flex flex-col gap-3">
        {gameFederations.map((gf) => (
          <FederationBlock key={gf.game_federation_id} gf={gf} onRemove={() => removeFederation(gf.game_federation_id)} />
        ))}
        {gameFederations.length === 0 && (
          <p className="text-sm text-slate-400">No federations added to this game yet.</p>
        )}
      </div>
    </div>
  );
}

function FederationBlock({ gf, onRemove }: { gf: GameFederation; onRemove: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [sports, setSports] = useState<GameFederationSport[]>([]);
  const [availableSports, setAvailableSports] = useState<FederationSportOption[]>([]);
  const [addSportId, setAddSportId] = useState("");

  const load = useCallback(async () => {
    const [assignedRes, fedSportsRes] = await Promise.all([
      fetch(`/api/admin/game-federation-sports?game_federation_id=${gf.game_federation_id}`),
      fetch(`/api/admin/federations/${gf.federation_id}/sports`),
    ]);
    const assigned: GameFederationSport[] = assignedRes.ok ? await assignedRes.json() : [];
    const fedSports: { sport_id: number; name: string }[] = fedSportsRes.ok ? await fedSportsRes.json() : [];
    setSports(assigned);
    setAvailableSports(fedSports.filter((fs) => !assigned.some((a) => a.sport_id === fs.sport_id)));
  }, [gf.game_federation_id, gf.federation_id]);

  useEffect(() => {
    if (expanded) load();
  }, [expanded, load]);

  async function addSport(e: React.FormEvent) {
    e.preventDefault();
    if (!addSportId) return;
    await fetch("/api/admin/game-federation-sports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game_federation_id: gf.game_federation_id, sport_id: Number(addSportId) }),
    });
    setAddSportId("");
    load();
  }

  async function removeSport(gfsId: number) {
    await fetch(`/api/admin/game-federation-sports/${gfsId}`, { method: "DELETE" });
    load();
  }

  async function updateSportMeta(gfsId: number, patch: Partial<Pick<GameFederationSport, "entry_policy_note" | "age_cutoff_date">>) {
    await fetch(`/api/admin/game-federation-sports/${gfsId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => setExpanded((e) => !e)} className="text-sm font-medium text-slate-900">
          {gf.name}
        </button>
        <button onClick={onRemove} className="text-xs text-slate-400 hover:text-red-600">
          Remove from game
        </button>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 px-4 py-3">
          <form onSubmit={addSport} className="mb-3 flex gap-2">
            <select
              value={addSportId}
              onChange={(e) => setAddSportId(e.target.value)}
              className="input max-w-xs"
            >
              <option value="">Add a sport…</option>
              {availableSports.map((s) => (
                <option key={s.sport_id} value={s.sport_id}>{s.name}</option>
              ))}
            </select>
            <button className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
              Add
            </button>
          </form>

          <div className="flex flex-col gap-2">
            {sports.map((sport) => (
              <SportBlock
                key={sport.game_federation_sport_id}
                sport={sport}
                onRemove={() => removeSport(sport.game_federation_sport_id)}
                onMetaChange={(patch) => updateSportMeta(sport.game_federation_sport_id, patch)}
              />
            ))}
            {sports.length === 0 && (
              <p className="text-sm text-slate-400">
                No sports added yet. (Only sports already assigned to this federation in the catalog can be added.)
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SportBlock({
  sport,
  onRemove,
  onMetaChange,
}: {
  sport: GameFederationSport;
  onRemove: () => void;
  onMetaChange: (patch: Partial<Pick<GameFederationSport, "entry_policy_note" | "age_cutoff_date">>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [catalogSport, setCatalogSport] = useState<SportWithEvents | null>(null);
  const [addEventId, setAddEventId] = useState("");
  const [policyNote, setPolicyNote] = useState(sport.entry_policy_note ?? "");
  const [ageCutoff, setAgeCutoff] = useState(sport.age_cutoff_date ?? "");

  const load = useCallback(async () => {
    const [eventsRes, sportsRes] = await Promise.all([
      fetch(`/api/admin/game-events?game_federation_sport_id=${sport.game_federation_sport_id}`),
      fetch("/api/admin/sports"),
    ]);
    if (eventsRes.ok) setEvents(await eventsRes.json());
    if (sportsRes.ok) {
      const all: SportWithEvents[] = await sportsRes.json();
      setCatalogSport(all.find((s) => s.id === sport.sport_id) ?? null);
    }
  }, [sport.game_federation_sport_id, sport.sport_id]);

  useEffect(() => {
    if (expanded) load();
  }, [expanded, load]);

  async function addEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!addEventId) return;
    await fetch("/api/admin/game-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        game_federation_sport_id: sport.game_federation_sport_id,
        event_id: Number(addEventId),
        max_male: 0,
        max_female: 0,
      }),
    });
    setAddEventId("");
    load();
  }

  async function updateQuota(geId: number, field: "max_male" | "max_female", value: number) {
    await fetch(`/api/admin/game-events/${geId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    load();
  }

  async function removeEvent(geId: number) {
    await fetch(`/api/admin/game-events/${geId}`, { method: "DELETE" });
    load();
  }

  const availableEvents = catalogSport
    ? catalogSport.events.filter((e) => !events.some((ge) => ge.event_id === e.id))
    : [];

  return (
    <div className="rounded-md border border-slate-100 bg-slate-50">
      <div className="flex items-center justify-between px-3 py-2">
        <button onClick={() => setExpanded((e) => !e)} className="text-sm text-slate-800">
          {sport.name}
        </button>
        <button onClick={onRemove} className="text-xs text-slate-400 hover:text-red-600">
          Remove
        </button>
      </div>

      {expanded && (
        <div className="border-t border-slate-200 px-3 py-3">
          <div className="mb-3 grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-medium text-slate-600">Entry policy note</span>
              <textarea
                value={policyNote}
                onChange={(e) => setPolicyNote(e.target.value)}
                onBlur={() => onMetaChange({ entry_policy_note: policyNote })}
                className="input"
                rows={2}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-medium text-slate-600">Age cutoff date (born on/before)</span>
              <input
                type="date"
                value={ageCutoff ?? ""}
                onChange={(e) => setAgeCutoff(e.target.value)}
                onBlur={() => onMetaChange({ age_cutoff_date: ageCutoff })}
                className="input"
              />
            </label>
          </div>

          <form onSubmit={addEvent} className="mb-3 flex gap-2">
            <select
              value={addEventId}
              onChange={(e) => setAddEventId(e.target.value)}
              className="input max-w-xs"
            >
              <option value="">Add an event…</option>
              {availableEvents.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.name} ({ev.gender})</option>
              ))}
            </select>
            <button className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
              Add
            </button>
          </form>

          <table className="w-full text-xs">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="py-1">Event</th>
                <th className="py-1">Max male</th>
                <th className="py-1">Max female</th>
                <th className="py-1">Declared M/F</th>
                <th className="py-1"></th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.game_event_id} className="border-t border-slate-200">
                  <td className="py-1">{ev.name}</td>
                  <td className="py-1">
                    <input
                      type="number"
                      min={0}
                      defaultValue={ev.max_male}
                      onBlur={(e) => updateQuota(ev.game_event_id, "max_male", Number(e.target.value))}
                      className="input w-16"
                    />
                  </td>
                  <td className="py-1">
                    <input
                      type="number"
                      min={0}
                      defaultValue={ev.max_female}
                      onBlur={(e) => updateQuota(ev.game_event_id, "max_female", Number(e.target.value))}
                      className="input w-16"
                    />
                  </td>
                  <td className="py-1 text-slate-500">
                    {ev.declared_male} / {ev.declared_female}
                  </td>
                  <td className="py-1 text-right">
                    <button onClick={() => removeEvent(ev.game_event_id)} className="text-slate-400 hover:text-red-600">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr><td colSpan={5} className="py-2 text-slate-400">No events added yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
