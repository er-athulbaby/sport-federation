"use client";

import { useEffect, useState } from "react";
import RosterManager from "@/components/RosterManager";

type FederationOption = { id: number; name: string };

type AllAthlete = {
  id: number; full_name_en: string; gender: string; passport_number: string;
  passport_expiry_date: string; tshirt_size: string | null; suit_size: string | null;
  federation_id: number; federation_name: string;
};

type AllOfficial = {
  id: number; full_name_en: string; designation: string | null; passport_number: string;
  passport_expiry_date: string; contact_number: string | null; email: string | null;
  federation_id: number; federation_name: string;
};

export default function FederationScopedRoster({
  fixedTab,
  title,
}: {
  fixedTab: "athletes" | "officials";
  title: string;
}) {
  const [federations, setFederations] = useState<FederationOption[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [all, setAll] = useState<(AllAthlete | AllOfficial)[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/federations")
      .then((r) => (r.ok ? r.json() : []))
      .then(setFederations);
  }, []);

  useEffect(() => {
    if (selected) return;
    setLoading(true);
    fetch(`/api/admin/${fixedTab}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setAll(data);
        setLoading(false);
      });
  }, [fixedTab, selected]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="input max-w-xs"
        >
          <option value="">All federations</option>
          {federations.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>

      {selected ? (
        <RosterManager federationId={Number(selected)} fixedTab={fixedTab} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Federation</th>
                <th className="px-4 py-3">Name</th>
                {fixedTab === "athletes" ? (
                  <>
                    <th className="px-4 py-3">Gender</th>
                    <th className="px-4 py-3">Passport</th>
                    <th className="px-4 py-3">Expiry</th>
                    <th className="px-4 py-3">Kit</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3">Designation</th>
                    <th className="px-4 py-3">Passport</th>
                    <th className="px-4 py-3">Expiry</th>
                    <th className="px-4 py-3">Contact</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Loading…</td></tr>
              )}
              {!loading && all.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Nothing here yet.</td></tr>
              )}
              {!loading && fixedTab === "athletes" && (all as AllAthlete[]).map((a) => (
                <tr key={a.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 text-slate-600">
                    <button onClick={() => setSelected(String(a.federation_id))} className="hover:underline">
                      {a.federation_name}
                    </button>
                  </td>
                  <td className="px-4 py-2 font-medium text-slate-900">{a.full_name_en}</td>
                  <td className="px-4 py-2 text-slate-600 capitalize">{a.gender}</td>
                  <td className="px-4 py-2 text-slate-600">{a.passport_number}</td>
                  <td className="px-4 py-2 text-slate-600">{a.passport_expiry_date}</td>
                  <td className="px-4 py-2 text-slate-600">{a.tshirt_size ?? "-"} / {a.suit_size ?? "-"}</td>
                </tr>
              ))}
              {!loading && fixedTab === "officials" && (all as AllOfficial[]).map((o) => (
                <tr key={o.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 text-slate-600">
                    <button onClick={() => setSelected(String(o.federation_id))} className="hover:underline">
                      {o.federation_name}
                    </button>
                  </td>
                  <td className="px-4 py-2 font-medium text-slate-900">{o.full_name_en}</td>
                  <td className="px-4 py-2 text-slate-600">{o.designation ?? "-"}</td>
                  <td className="px-4 py-2 text-slate-600">{o.passport_number}</td>
                  <td className="px-4 py-2 text-slate-600">{o.passport_expiry_date}</td>
                  <td className="px-4 py-2 text-slate-600">{o.contact_number ?? o.email ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
            Click a federation name to switch to its editable roster (add, edit, import/export).
          </p>
        </div>
      )}
    </div>
  );
}
