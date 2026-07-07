"use client";

import { useEffect, useState, useCallback } from "react";

type Athlete = {
  id: number;
  full_name_en: string;
  full_name_ar: string;
  gender: string;
  dob: string | null;
  height_cm: string | null;
  weight_kg: string | null;
  passport_number: string;
  passport_expiry_date: string;
  photo_url: string | null;
  tshirt_size: string | null;
  suit_size: string | null;
};

type Official = {
  id: number;
  full_name_en: string;
  full_name_ar: string;
  designation: string | null;
  contact_number: string | null;
  email: string | null;
  passport_number: string;
  passport_expiry_date: string;
  photo_url: string | null;
  tshirt_size: string | null;
  suit_size: string | null;
};

const emptyAthlete = {
  full_name_en: "", full_name_ar: "", gender: "male", dob: "",
  height_cm: "", weight_kg: "", passport_number: "", passport_expiry_date: "",
  photo_url: "", tshirt_size: "", suit_size: "",
};

const emptyOfficial = {
  full_name_en: "", full_name_ar: "", designation: "", contact_number: "", email: "",
  passport_number: "", passport_expiry_date: "", photo_url: "", tshirt_size: "", suit_size: "",
};

export default function RosterManager({ federationId }: { federationId: number }) {
  const [tab, setTab] = useState<"athletes" | "officials">("athletes");
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [officials, setOfficials] = useState<Official[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [athleteForm, setAthleteForm] = useState(emptyAthlete);
  const [officialForm, setOfficialForm] = useState(emptyOfficial);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [aRes, oRes] = await Promise.all([
      fetch(`/api/federations/${federationId}/athletes`),
      fetch(`/api/federations/${federationId}/officials`),
    ]);
    if (aRes.ok) setAthletes(await aRes.json());
    if (oRes.ok) setOfficials(await oRes.json());
    setLoading(false);
  }, [federationId]);

  useEffect(() => {
    load();
  }, [load]);

  async function submitAthlete(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/federations/${federationId}/athletes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(athleteForm),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Something went wrong");
      return;
    }
    setAthleteForm(emptyAthlete);
    setShowForm(false);
    load();
  }

  async function submitOfficial(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/federations/${federationId}/officials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(officialForm),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Something went wrong");
      return;
    }
    setOfficialForm(emptyOfficial);
    setShowForm(false);
    load();
  }

  async function deleteAthlete(id: number) {
    await fetch(`/api/federations/${federationId}/athletes/${id}`, { method: "DELETE" });
    load();
  }

  async function deleteOfficial(id: number) {
    await fetch(`/api/federations/${federationId}/officials/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2">
          <TabButton active={tab === "athletes"} onClick={() => { setTab("athletes"); setShowForm(false); }}>
            Athletes ({athletes.length})
          </TabButton>
          <TabButton active={tab === "officials"} onClick={() => { setTab("officials"); setShowForm(false); }}>
            Officials ({officials.length})
          </TabButton>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          {showForm ? "Cancel" : tab === "athletes" ? "Add athlete" : "Add official"}
        </button>
      </div>

      {showForm && tab === "athletes" && (
        <form onSubmit={submitAthlete} className="mb-6 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-5">
          <div className="grid grid-cols-3 gap-3">
            <Field label="Full name (English)">
              <input required value={athleteForm.full_name_en} onChange={(e) => setAthleteForm({ ...athleteForm, full_name_en: e.target.value })} className="input" />
            </Field>
            <Field label="Full name (Arabic)">
              <input required dir="rtl" value={athleteForm.full_name_ar} onChange={(e) => setAthleteForm({ ...athleteForm, full_name_ar: e.target.value })} className="input" />
            </Field>
            <Field label="Gender">
              <select value={athleteForm.gender} onChange={(e) => setAthleteForm({ ...athleteForm, gender: e.target.value })} className="input">
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </Field>
            <Field label="Date of birth">
              <input type="date" value={athleteForm.dob} onChange={(e) => setAthleteForm({ ...athleteForm, dob: e.target.value })} className="input" />
            </Field>
            <Field label="Height (cm)">
              <input type="number" step="0.1" value={athleteForm.height_cm} onChange={(e) => setAthleteForm({ ...athleteForm, height_cm: e.target.value })} className="input" />
            </Field>
            <Field label="Weight (kg)">
              <input type="number" step="0.1" value={athleteForm.weight_kg} onChange={(e) => setAthleteForm({ ...athleteForm, weight_kg: e.target.value })} className="input" />
            </Field>
            <Field label="Passport number">
              <input required value={athleteForm.passport_number} onChange={(e) => setAthleteForm({ ...athleteForm, passport_number: e.target.value })} className="input" />
            </Field>
            <Field label="Passport expiry date">
              <input required type="date" value={athleteForm.passport_expiry_date} onChange={(e) => setAthleteForm({ ...athleteForm, passport_expiry_date: e.target.value })} className="input" />
            </Field>
            <Field label="Photo URL">
              <input value={athleteForm.photo_url} onChange={(e) => setAthleteForm({ ...athleteForm, photo_url: e.target.value })} className="input" />
            </Field>
            <Field label="T-shirt size">
              <input value={athleteForm.tshirt_size} onChange={(e) => setAthleteForm({ ...athleteForm, tshirt_size: e.target.value })} placeholder="S / M / L / XL" className="input" />
            </Field>
            <Field label="Suit size">
              <input value={athleteForm.suit_size} onChange={(e) => setAthleteForm({ ...athleteForm, suit_size: e.target.value })} placeholder="S / M / L / XL" className="input" />
            </Field>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="mt-2 w-fit rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
            Save athlete
          </button>
        </form>
      )}

      {showForm && tab === "officials" && (
        <form onSubmit={submitOfficial} className="mb-6 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-5">
          <div className="grid grid-cols-3 gap-3">
            <Field label="Full name (English)">
              <input required value={officialForm.full_name_en} onChange={(e) => setOfficialForm({ ...officialForm, full_name_en: e.target.value })} className="input" />
            </Field>
            <Field label="Full name (Arabic)">
              <input required dir="rtl" value={officialForm.full_name_ar} onChange={(e) => setOfficialForm({ ...officialForm, full_name_ar: e.target.value })} className="input" />
            </Field>
            <Field label="Designation">
              <input value={officialForm.designation} onChange={(e) => setOfficialForm({ ...officialForm, designation: e.target.value })} placeholder="Coach, Manager…" className="input" />
            </Field>
            <Field label="Contact number">
              <input value={officialForm.contact_number} onChange={(e) => setOfficialForm({ ...officialForm, contact_number: e.target.value })} className="input" />
            </Field>
            <Field label="Email">
              <input type="email" value={officialForm.email} onChange={(e) => setOfficialForm({ ...officialForm, email: e.target.value })} className="input" />
            </Field>
            <Field label="Passport number">
              <input required value={officialForm.passport_number} onChange={(e) => setOfficialForm({ ...officialForm, passport_number: e.target.value })} className="input" />
            </Field>
            <Field label="Passport expiry date">
              <input required type="date" value={officialForm.passport_expiry_date} onChange={(e) => setOfficialForm({ ...officialForm, passport_expiry_date: e.target.value })} className="input" />
            </Field>
            <Field label="Photo URL">
              <input value={officialForm.photo_url} onChange={(e) => setOfficialForm({ ...officialForm, photo_url: e.target.value })} className="input" />
            </Field>
            <Field label="T-shirt size">
              <input value={officialForm.tshirt_size} onChange={(e) => setOfficialForm({ ...officialForm, tshirt_size: e.target.value })} className="input" />
            </Field>
            <Field label="Suit size">
              <input value={officialForm.suit_size} onChange={(e) => setOfficialForm({ ...officialForm, suit_size: e.target.value })} className="input" />
            </Field>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="mt-2 w-fit rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
            Save official
          </button>
        </form>
      )}

      {loading && <p className="text-slate-400">Loading…</p>}

      {!loading && tab === "athletes" && (
        <RosterTable
          rows={athletes}
          columns={["Name", "Gender", "Passport", "Expiry", "Kit"]}
          renderRow={(a) => (
            <>
              <td className="px-4 py-2 font-medium text-slate-900">{a.full_name_en}</td>
              <td className="px-4 py-2 text-slate-600 capitalize">{a.gender}</td>
              <td className="px-4 py-2 text-slate-600">{a.passport_number}</td>
              <td className="px-4 py-2 text-slate-600">{a.passport_expiry_date}</td>
              <td className="px-4 py-2 text-slate-600">{a.tshirt_size ?? "-"} / {a.suit_size ?? "-"}</td>
            </>
          )}
          onDelete={(a) => deleteAthlete(a.id)}
        />
      )}

      {!loading && tab === "officials" && (
        <RosterTable
          rows={officials}
          columns={["Name", "Designation", "Passport", "Expiry", "Contact"]}
          renderRow={(o) => (
            <>
              <td className="px-4 py-2 font-medium text-slate-900">{o.full_name_en}</td>
              <td className="px-4 py-2 text-slate-600">{o.designation ?? "-"}</td>
              <td className="px-4 py-2 text-slate-600">{o.passport_number}</td>
              <td className="px-4 py-2 text-slate-600">{o.passport_expiry_date}</td>
              <td className="px-4 py-2 text-slate-600">{o.contact_number ?? o.email ?? "-"}</td>
            </>
          )}
          onDelete={(o) => deleteOfficial(o.id)}
        />
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-sm font-medium ${
        active ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200"
      }`}
    >
      {children}
    </button>
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

function RosterTable<T extends { id: number }>({
  rows,
  columns,
  renderRow,
  onDelete,
}: {
  rows: T[];
  columns: string[];
  renderRow: (row: T) => React.ReactNode;
  onDelete: (row: T) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {columns.map((c) => <th key={c} className="px-4 py-3">{c}</th>)}
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={columns.length + 1} className="px-4 py-6 text-center text-slate-400">Nothing here yet.</td></tr>
          )}
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-slate-100">
              {renderRow(row)}
              <td className="px-4 py-2 text-right">
                <button onClick={() => onDelete(row)} className="text-xs text-slate-400 hover:text-red-600">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
