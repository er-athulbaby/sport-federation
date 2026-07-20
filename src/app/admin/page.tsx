"use client";

import { useState } from "react";

export default function AdminHome() {
  const [status, setStatus] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

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

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Overview</h1>
      <p className="mt-2 text-slate-600">
        Manage federations, the sport/event catalog, and games from the nav above.
      </p>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
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
