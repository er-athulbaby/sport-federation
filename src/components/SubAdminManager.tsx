"use client";

import { useEffect, useState, useCallback } from "react";

type Permission = { resource: string; can_view: boolean; can_edit: boolean; can_delete: boolean };
type SubAdmin = { id: number; name: string; email: string; username: string; permissions: Permission[] };

const RESOURCES: { key: string; label: string }[] = [
  { key: "federations", label: "Federations" },
  { key: "sports_events", label: "Sports & Events" },
  { key: "games", label: "Games" },
  { key: "roster", label: "Roster" },
];

const emptyForm = { name: "", email: "", username: "", password: "" };

export default function SubAdminManager() {
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/sub-admins");
    if (res.ok) setSubAdmins(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createSubAdmin(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/admin/sub-admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError((await res.json()).error ?? "Could not create sub-admin");
      return;
    }
    setForm(emptyForm);
    setShowForm(false);
    load();
  }

  async function updatePermission(
    subAdmin: SubAdmin,
    resource: string,
    field: "can_view" | "can_edit" | "can_delete",
    value: boolean
  ) {
    const updated = subAdmin.permissions.map((p) =>
      p.resource === resource ? { ...p, [field]: value } : p
    );
    await fetch(`/api/admin/sub-admins/${subAdmin.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissions: updated }),
    });
    load();
  }

  async function removeSubAdmin(id: number) {
    await fetch(`/api/admin/sub-admins/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Sub-Admins</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          {showForm ? "Cancel" : "Add sub-admin"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createSubAdmin} className="mb-8 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name">
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
            </Field>
            <Field label="Email">
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" />
            </Field>
            <Field label="Login username">
              <input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="input" />
            </Field>
            <Field label="Login password">
              <input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input" />
            </Field>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={submitting} className="mt-2 w-fit rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
            {submitting ? "Creating…" : "Create sub-admin"}
          </button>
          <p className="text-xs text-slate-400">Privileges start at none — grant view/edit/delete per area below after creating.</p>
        </form>
      )}

      {loading && <p className="text-slate-400">Loading…</p>}

      <div className="flex flex-col gap-4">
        {subAdmins.map((sa) => (
          <div key={sa.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{sa.name}</p>
                <p className="text-xs text-slate-500">{sa.username} &middot; {sa.email}</p>
              </div>
              <button onClick={() => removeSubAdmin(sa.id)} className="text-xs text-slate-400 hover:text-red-600">
                Remove
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="py-1 pr-4">Area</th>
                    <th className="py-1 pr-4">View</th>
                    <th className="py-1 pr-4">Edit</th>
                    <th className="py-1 pr-4">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {RESOURCES.map((r) => {
                    const perm = sa.permissions.find((p) => p.resource === r.key) ?? {
                      resource: r.key, can_view: false, can_edit: false, can_delete: false,
                    };
                    return (
                      <tr key={r.key} className="border-t border-slate-100">
                        <td className="py-2 pr-4 font-medium text-slate-700">{r.label}</td>
                        <td className="py-2 pr-4">
                          <input type="checkbox" checked={perm.can_view} onChange={(e) => updatePermission(sa, r.key, "can_view", e.target.checked)} />
                        </td>
                        <td className="py-2 pr-4">
                          <input type="checkbox" checked={perm.can_edit} onChange={(e) => updatePermission(sa, r.key, "can_edit", e.target.checked)} />
                        </td>
                        <td className="py-2 pr-4">
                          <input type="checkbox" checked={perm.can_delete} onChange={(e) => updatePermission(sa, r.key, "can_delete", e.target.checked)} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        {!loading && subAdmins.length === 0 && (
          <p className="text-sm text-slate-400">No sub-admins yet.</p>
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
