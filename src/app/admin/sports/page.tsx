"use client";

import { useEffect, useState, useCallback } from "react";

type Event = { id: number; sport_id: number; name: string; gender: string };
type Sport = { id: number; name: string; icon_url: string | null; events: Event[] };

export default function SportsPage() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSportName, setNewSportName] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [eventForm, setEventForm] = useState({ name: "", gender: "male" });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/sports");
    if (res.ok) setSports(await res.json());
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
          <div key={sport.id} className="rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center justify-between px-4 py-3">
              <button
                onClick={() => setExpanded(expanded === sport.id ? null : sport.id)}
                className="text-sm font-medium text-slate-900"
              >
                {sport.name} <span className="text-slate-400">({sport.events.length} events)</span>
              </button>
              <button
                onClick={() => deleteSport(sport.id)}
                className="text-xs text-slate-400 hover:text-red-600"
              >
                Delete sport
              </button>
            </div>

            {expanded === sport.id && (
              <div className="border-t border-slate-100 px-4 py-3">
                <ul className="mb-3 flex flex-col gap-1">
                  {sport.events.map((ev) => (
                    <li key={ev.id} className="flex items-center justify-between text-sm">
                      <span>
                        {ev.name}{" "}
                        <span className="text-xs text-slate-400">({ev.gender})</span>
                      </span>
                      <button
                        onClick={() => deleteEvent(ev.id)}
                        className="text-xs text-slate-400 hover:text-red-600"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                  {sport.events.length === 0 && (
                    <li className="text-sm text-slate-400">No events yet.</li>
                  )}
                </ul>
                <form onSubmit={(e) => addEvent(sport.id, e)} className="flex gap-2">
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
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
