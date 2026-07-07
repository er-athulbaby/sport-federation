"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type Game = {
  id: number;
  name: string;
  logo_url: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  phase1_enabled: boolean;
  phase2_enabled: boolean;
  phase3_enabled: boolean;
  phase4_enabled: boolean;
};

const emptyForm = {
  name: "",
  logo_url: "",
  start_date: "",
  end_date: "",
  phase1_enabled: true,
  phase2_enabled: true,
  phase3_enabled: true,
  phase4_enabled: true,
};

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/games");
    if (res.ok) setGames(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch("/api/admin/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSubmitting(false);
    setForm(emptyForm);
    setShowForm(false);
    load();
  }

  const phaseLabels = [
    ["phase1_enabled", "Phase 1: Entry by Sport"],
    ["phase2_enabled", "Phase 2: Entry by Number"],
    ["phase3_enabled", "Phase 3: Long List"],
    ["phase4_enabled", "Phase 4: Short List"],
  ] as const;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Games</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          {showForm ? "Cancel" : "Add game"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5"
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name">
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input"
                placeholder="e.g. AIMAG 2026"
              />
            </Field>
            <Field label="Logo URL">
              <input
                value={form.logo_url}
                onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Start date">
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="End date">
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="input"
              />
            </Field>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Enabled phases</p>
            <div className="grid grid-cols-2 gap-2">
              {phaseLabels.map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-fit rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Create game"}
          </button>
        </form>
      )}

      {loading && <p className="text-slate-400">Loading…</p>}

      <div className="flex flex-col gap-3">
        {games.map((game) => (
          <Link
            key={game.id}
            href={`/admin/games/${game.id}`}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-slate-300"
          >
            <div>
              <p className="text-sm font-medium text-slate-900">{game.name}</p>
              <p className="text-xs text-slate-500">
                {game.start_date ?? "?"} &ndash; {game.end_date ?? "?"}
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {game.status}
            </span>
          </Link>
        ))}
        {!loading && games.length === 0 && (
          <p className="text-sm text-slate-400">No games yet.</p>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}
