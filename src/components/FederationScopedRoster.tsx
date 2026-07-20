"use client";

import { useEffect, useState } from "react";
import RosterManager from "@/components/RosterManager";

type FederationOption = { id: number; name: string };

export default function FederationScopedRoster({
  fixedTab,
  title,
}: {
  fixedTab: "athletes" | "officials";
  title: string;
}) {
  const [federations, setFederations] = useState<FederationOption[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/federations")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setFederations(data);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="input max-w-xs"
          disabled={loading}
        >
          <option value="">Select a federation…</option>
          {federations.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>

      {!selected && (
        <p className="text-sm text-slate-400">Select a federation above to view its {fixedTab}.</p>
      )}
      {selected && <RosterManager federationId={Number(selected)} fixedTab={fixedTab} />}
    </div>
  );
}
