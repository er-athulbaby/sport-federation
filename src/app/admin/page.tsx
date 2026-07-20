"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Stats = {
  federations: number;
  sports: number;
  events: number;
  games: number;
  athletes: number;
  officials: number;
  athletesByGender: { male: number; female: number };
};

export default function AdminHome() {
  const [status, setStatus] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => (r.ok ? r.json() : null))
      .then(setStats);
  }, []);

  async function runPassportCheck() {
    setRunning(true);
    setStatus(null);
    const res = await fetch("/api/admin/notifications/check-passports", { method: "POST" });
    setRunning(false);
    if (res.ok) {
      const data = await res.json();
      setStatus(`Created ${data.created} notification(s).`);
    } else {
      setStatus("Something went wrong.");
    }
  }

  const cards = stats
    ? [
        { label: "Federations", value: stats.federations, href: "/admin/federations" },
        { label: "Sports", value: stats.sports, href: "/admin/sports" },
        { label: "Events", value: stats.events, href: "/admin/sports" },
        { label: "Games", value: stats.games, href: "/admin/games" },
        { label: "Athletes", value: stats.athletes, href: "/admin/athletes" },
        { label: "Team Officials", value: stats.officials, href: "/admin/officials" },
      ]
    : [];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Overview</h1>
      <p className="mt-2 text-slate-600">
        Manage federations, the sport/event catalog, and games from the nav above.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-md"
          >
            <div className="text-3xl font-bold text-slate-900">{c.value}</div>
            <div className="mt-1 text-sm text-slate-500">{c.label}</div>
          </Link>
        ))}
        {!stats && (
          <p className="col-span-full text-sm text-slate-400">Loading…</p>
        )}
      </div>

      {stats && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-2 text-sm font-medium text-slate-700">Athletes by gender</p>
          <div className="flex gap-6 text-sm text-slate-600">
            <span>Male: <span className="font-semibold text-slate-900">{stats.athletesByGender.male}</span></span>
            <span>Female: <span className="font-semibold text-slate-900">{stats.athletesByGender.female}</span></span>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
        <p className="mb-2 text-sm font-medium text-slate-700">Passport expiry check</p>
        <p className="mb-3 text-xs text-slate-500">
          Runs automatically once a day. Trigger it manually here for testing.
        </p>
        <button
          onClick={runPassportCheck}
          disabled={running}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {running ? "Running…" : "Run now"}
        </button>
        {status && <p className="mt-2 text-sm text-slate-600">{status}</p>}
      </div>
    </div>
  );
}
