"use client";

import { useEffect, useState, useCallback } from "react";

type Event = { id: number; sport_id: number; name: string; gender: string };
type Sport = { id: number; name: string; icon_url: string | null; events: Event[] };
type FederationOption = { id: number; name: string };
type AssignedFederation = { federation_sport_id: number; federation_id: number; name: string };

export default function SportsPage() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [allFederations, setAllFederations] = useState<FederationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSportName, setNewSportName] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [eventForm, setEventForm] = useState({ name: "", gender: "male" });
  const [editingSportId, setEditingSportId] = useState<number | null>(null);
  const [editSportName, setEditSportName] = useState("");
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [editEventForm, setEditEventForm] = useState({ name: "", gender: "male" });

  const load = useCallback(async () => {
    setLoading(true);
    const [sportsRes, fedsRes] = await Promise.all([
      fetch("/api/admin/sports"),
      fetch("/api/admin/federations"),
    ]);
    if (sportsRes.ok) setSports(await sportsRes.json());
    if (fedsRes.ok) setAllFederations(await fedsRes.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addSport(e: React.FormEvent) {
    e.preventDefault();
    if (!newSportName.trim()) return;
    await fetch("/api/admin/sports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newSportName }),
    });
    setNewSportName("");
    load();
  }

  async function deleteSport(id: number) {
    await fetch(`/api/admin/sports/${id}`, { method: "DELETE" });
    load();
  }

  function startEditSport(sport: Sport) {
    setEditingSportId(sport.id);
    setEditSportName(sport.name);
  }

  async function saveSportName(id: number) {
    if (!editSportName.trim()) return;
    await fetch(`/api/admin/sports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editSportName }),
    });
    setEditingSportId(null);
    load();
  }

  function startEditEvent(ev: Event) {
    setEditingEventId(ev.id);
    setEditEventForm({ name: ev.name, gender: ev.gender });
  }

  async function saveEvent(id: number) {
    if (!editEventForm.name.trim()) return;
    await fetch(`/api/admin/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editEventForm),
    });
    setEditingEventId(null);
    load();
  }

  async function addEvent(sportId: number, e: React.FormEvent) {
    e.preventDefault();
    if (!eventForm.name.trim()) return;
    await fetch(`/api/admin/sports/${sportId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventForm),
    });
    setEventForm({ name: "", gender: "male" });
    load();
  }

  async function deleteEvent(id: number) {
    await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Sports &amp; Events</h1>

      <form onSubmit={addSport} className="mb-6 flex gap-2">
        <input
          value={newSportName}
          onChange={(e) => setNewSportName(e.target.value)}
          placeholder="New sport name (e.g. Athletics)"
          className="input max-w-xs"
        />
        <button className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          Add sport
        </button>
      </form>

      {loading && <p className="text-slate-400">Loading…</p>}

      <div className="flex flex-col gap-3">
        {sports.map((sport) => (
          <div key={sport.id} className="rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between px-4 py-3">
              {editingSportId === sport.id ? (
                <div className="flex items-center gap-2">
                  <input
                    value={editSportName}
                    onChange={(e) => setEditSportName(e.target.value)}
                    className="input max-w-[220px]"
                    autoFocus
                  />
                  <button onClick={() => saveSportName(sport.id)} className="text-xs font-medium text-brand-700 hover:underline">
                    Save
                  </button>
                  <button onClick={() => setEditingSportId(null)} className="text-xs text-slate-400 hover:underline">
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setExpanded(expanded === sport.id ? null : sport.id)}
                  className="text-sm font-medium text-slate-900"
                >
                  {sport.name} <span className="text-slate-400">({sport.events.length} events)</span>
                </button>
              )}
              <div className="flex items-center gap-3">
                {editingSportId !== sport.id && (
                  <button
                    onClick={() => startEditSport(sport)}
                    className="text-xs text-slate-400 hover:text-slate-700"
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={() => deleteSport(sport.id)}
                  className="text-xs text-slate-400 hover:text-red-600"
                >
                  Delete sport
                </button>
              </div>
            </div>

            {expanded === sport.id && (
              <div className="border-t border-slate-100 px-4 py-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Events</p>
                <ul className="mb-3 flex flex-col gap-1">
                  {sport.events.map((ev) => (
                    <li key={ev.id} className="flex items-center justify-between text-sm">
                      {editingEventId === ev.id ? (
                        <div className="flex flex-1 items-center gap-2">
                          <input
                            value={editEventForm.name}
                            onChange={(e) => setEditEventForm({ ...editEventForm, name: e.target.value })}
                            className="input max-w-[200px]"
                            autoFocus
                          />
                          <select
                            value={editEventForm.gender}
                            onChange={(e) => setEditEventForm({ ...editEventForm, gender: e.target.value })}
                            className="input max-w-[110px]"
                          >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="mixed">Mixed</option>
                          </select>
                          <button onClick={() => saveEvent(ev.id)} className="text-xs font-medium text-brand-700 hover:underline">
                            Save
                          </button>
                          <button onClick={() => setEditingEventId(null)} className="text-xs text-slate-400 hover:underline">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <span>
                            {ev.name}{" "}
                            <span className="text-xs text-slate-400">({ev.gender})</span>
                          </span>
                          <span className="flex items-center gap-3">
                            <button
                              onClick={() => startEditEvent(ev)}
                              className="text-xs text-slate-400 hover:text-slate-700"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteEvent(ev.id)}
                              className="text-xs text-slate-400 hover:text-red-600"
                            >
                              Remove
                            </button>
                          </span>
                        </>
                      )}
                    </li>
                  ))}
                  {sport.events.length === 0 && (
                    <li className="text-sm text-slate-400">No events yet.</li>
                  )}
                </ul>
                <form onSubmit={(e) => addEvent(sport.id, e)} className="mb-4 flex gap-2">
                  <input
                    value={eventForm.name}
                    onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                    placeholder="Event name (e.g. Men's 60kg)"
                    className="input max-w-xs"
                  />
                  <select
                    value={eventForm.gender}
                    onChange={(e) => setEventForm({ ...eventForm, gender: e.target.value })}
                    className="input max-w-[120px]"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="mixed">Mixed</option>
                  </select>
                  <button className="rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700">
                    Add event
                  </button>
                </form>

                <FederationsForSport sportId={sport.id} allFederations={allFederations} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FederationsForSport({
  sportId,
  allFederations,
}: {
  sportId: number;
  allFederations: FederationOption[];
}) {
  const [assigned, setAssigned] = useState<AssignedFederation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/sports/${sportId}/federations`);
    if (res.ok) setAssigned(await res.json());
    setLoading(false);
  }, [sportId]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleFederation(federationId: number, isAssigned: boolean) {
    if (isAssigned) {
      await fetch(`/api/admin/federations/${federationId}/sports/${sportId}`, { method: "DELETE" });
    } else {
      await fetch(`/api/admin/sports/${sportId}/federations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ federation_id: federationId }),
      });
    }
    load();
  }

  const assignedIds = new Set(assigned.map((a) => a.federation_id));

  return (
    <div className="border-t border-slate-100 pt-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Federations using this sport
      </p>
      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : (
        <div className="flex flex-col gap-1">
          {allFederations.map((f) => (
            <label key={f.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={assignedIds.has(f.id)}
                onChange={() => toggleFederation(f.id, assignedIds.has(f.id))}
              />
              {f.name}
            </label>
          ))}
          {allFederations.length === 0 && (
            <p className="text-sm text-slate-400">No federations yet — add some under Federations.</p>
          )}
        </div>
      )}
    </div>
  );
}
