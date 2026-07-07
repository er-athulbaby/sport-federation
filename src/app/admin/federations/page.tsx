"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type Federation = {
  id: number;
  name: string;
  logo_url: string | null;
  email: string;
  username: string;
  is_active: boolean;
  created_at: string;
};

type FormState = {
  name: string;
  logo_url: string;
  email: string;
  username: string;
  password: string;
};

const emptyForm: FormState = { name: "", logo_url: "", email: "", username: "", password: "" };

export default function FederationsPage() {
  const [federations, setFederations] = useState<Federation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/federations");
    if (res.ok) setFederations(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/admin/federations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong");
      return;
    }

    setForm(emptyForm);
    setShowForm(false);
    load();
  }

  async function toggleActive(fed: Federation) {
    await fetch(`/api/admin/federations/${fed.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !fed.is_active }),
    });
    load();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Federations</h1>
        <div className="flex items-center gap-2">
          <a href="/api/admin/athletes/export" className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
            Export all athletes
          </a>
          <a href="/api/admin/officials/export" className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
            Export all officials
          </a>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            {showForm ? "Cancel" : "Add federation"}
          </button>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-5"
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name">
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Logo URL">
              <input
                value={form.logo_url}
                onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Login username">
              <input
                required
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Login password">
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input"
              />
            </Field>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-fit rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Create federation"}
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Loading…</td></tr>
            )}
            {!loading && federations.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">No federations yet.</td></tr>
            )}
            {federations.map((fed) => (
              <tr key={fed.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-900">
                  <Link href={`/admin/federations/${fed.id}`} className="hover:underline">
                    {fed.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{fed.username}</td>
                <td className="px-4 py-3 text-slate-600">{fed.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      fed.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {fed.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => toggleActive(fed)}
                    className="text-xs text-slate-500 hover:text-slate-900"
                  >
                    {fed.is_active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
