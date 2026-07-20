"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";

type Sport = { id: number; name: string };
type Assignment = { federation_sport_id: number; sport_id: number; name: string };
type Federation = {
  id: number;
  name: string;
  logo_url: string | null;
  email: string;
  username: string;
  is_active: boolean;
};

export default function FederationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [tab, setTab] = useState<"details" | "sports">("details");
  const [federation, setFederation] = useState<Federation | null>(null);
  const [allSports, setAllSports] = useState<Sport[]>([]);
  const [assigned, setAssigned] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ name: "", logo_url: "", email: "", username: "", password: "" });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [fedRes, sportsRes, assignedRes] = await Promise.all([
      fetch(`/api/admin/federations/${id}`),
      fetch("/api/admin/sports"),
      fetch(`/api/admin/federations/${id}/sports`),
    ]);
    if (fedRes.ok) {
      const data = await fedRes.json();
      setFederation(data);
      setForm({ name: data.name, logo_url: data.logo_url ?? "", email: data.email, username: data.username, password: "" });
    }
    if (sportsRes.ok) setAllSports(await sportsRes.json());
    if (assignedRes.ok) setAssigned(await assignedRes.json());
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveDetails(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaveMessage(null);

    const body: Record<string, string> = {
      name: form.name, logo_url: form.logo_url, email: form.email, username: form.username,
    };
    if (form.password) body.password = form.password;

    const res = await fetch(`/api/admin/federations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);

    if (!res.ok) {
      setError((await res.json()).error ?? "Could not save changes");
      return;
    }
    setForm((f) => ({ ...f, password: "" }));
    setSaveMessage("Saved.");
    load();
  }

  async function toggleActive() {
    if (!federation) return;
    await fetch(`/api/admin/federations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !federation.is_active }),
    });
    load();
  }

  async function toggleSport(sportId: number, isAssigned: boolean) {
    if (isAssigned) {
      await fetch(`/api/admin/federations/${id}/sports/${sportId}`, { method: "DELETE" });
    } else {
      await fetch(`/api/admin/federations/${id}/sports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sport_id: sportId }),
      });
    }
    load();
  }

  if (loading) return <p className="text-slate-400">Loading…</p>;
  if (!federation) return <p className="text-slate-400">Federation not found.</p>;

  const assignedIds = new Set(assigned.map((a) => a.sport_id));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{federation.name}</h1>
          <p className="text-sm text-slate-500">
            {federation.username} &middot; {federation.email}
          </p>
        </div>
        <Link
          href={`/admin/federations/${federation.id}/roster`}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          Manage roster
        </Link>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setTab("details")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            tab === "details" ? "bg-brand-600 text-white" : "border border-slate-300 bg-white text-slate-700"
          }`}
        >
          Details
        </button>
        <button
          onClick={() => setTab("sports")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            tab === "sports" ? "bg-brand-600 text-white" : "border border-slate-300 bg-white text-slate-700"
          }`}
        >
          Sports ({assigned.length})
        </button>
      </div>

      {tab === "details" && (
        <form onSubmit={saveDetails} className="max-w-lg rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex flex-col gap-3">
            <Field label="Name">
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
            </Field>
            <Field label="Logo URL">
              <input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} className="input" />
            </Field>
            <Field label="Email">
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" />
            </Field>
            <Field label="Login username">
              <input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="input" />
            </Field>
            <Field label="Reset password (optional)">
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Leave blank to keep current password" className="input" />
            </Field>
          </div>

          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          {saveMessage && <p className="mb-3 text-sm text-emerald-700">{saveMessage}</p>}

          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button type="button" onClick={toggleActive} className="text-sm text-slate-500 hover:text-slate-900">
              {federation.is_active ? "Deactivate account" : "Activate account"}
            </button>
          </div>
        </form>
      )}

      {tab === "sports" && (
        <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4">
          {allSports.length === 0 && (
            <p className="text-sm text-slate-400">No sports in the catalog yet — add some under Sports &amp; Events.</p>
          )}
          {allSports.map((sport) => {
            const isAssigned = assignedIds.has(sport.id);
            return (
              <label key={sport.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isAssigned}
                  onChange={() => toggleSport(sport.id, isAssigned)}
                />
                {sport.name}
              </label>
            );
          })}
        </div>
      )}
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
