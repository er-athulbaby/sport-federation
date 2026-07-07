"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useSession } from "next-auth/react";
import Phase2Panel from "@/components/Phase2Panel";

type GameFederation = {
  game_federation_id: number;
  game_id: number;
  name: string;
  phase1_enabled: boolean;
  phase2_enabled: boolean;
  phase3_enabled: boolean;
  phase4_enabled: boolean;
  is_participating: boolean | null;
  participation_note: string | null;
  phase1_confirmed_at: string | null;
  phase2_completed_at: string | null;
  phase3_completed_at: string | null;
  phase4_completed_at: string | null;
};

type PhaseKey = 1 | 2 | 3 | 4;

export default function FederationGameDetailPage({
  params,
}: {
  params: Promise<{ gameFederationId: string }>;
}) {
  const { gameFederationId } = use(params);
  const { data: session } = useSession();
  const federationId = session?.user.federationId;
  const [gf, setGf] = useState<GameFederation | null>(null);
  const [activePhase, setActivePhase] = useState<PhaseKey>(1);
  const [isParticipating, setIsParticipating] = useState(true);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!federationId) return;
    const res = await fetch(`/api/federations/${federationId}/games/${gameFederationId}`);
    if (res.ok) {
      const data = await res.json();
      setGf(data);
      setIsParticipating(data.is_participating ?? true);
      setNote(data.participation_note ?? "");
    }
  }, [federationId, gameFederationId]);

  useEffect(() => {
    load();
  }, [load]);

  async function submitPhase1(e: React.FormEvent) {
    e.preventDefault();
    if (!federationId) return;
    setSubmitting(true);
    await fetch(`/api/federations/${federationId}/games/${gameFederationId}/phase1`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_participating: isParticipating, participation_note: note }),
    });
    setSubmitting(false);
    load();
  }

  if (!gf) return <p className="text-slate-400">Loading…</p>;

  const phases: { key: PhaseKey; label: string; enabled: boolean; done: string | null }[] = [
    { key: 1, label: "1. Entry by Sport", enabled: gf.phase1_enabled, done: gf.phase1_confirmed_at },
    { key: 2, label: "2. Entry by Number", enabled: gf.phase2_enabled, done: gf.phase2_completed_at },
    { key: 3, label: "3. Long List", enabled: gf.phase3_enabled, done: gf.phase3_completed_at },
    { key: 4, label: "4. Short List", enabled: gf.phase4_enabled, done: gf.phase4_completed_at },
  ];

  function isUnlocked(key: PhaseKey) {
    const phase = phases.find((p) => p.key === key)!;
    if (!phase.enabled) return false;
    if (key === 1) return true;
    const prev = phases.find((p) => p.key === ((key - 1) as PhaseKey))!;
    // If the previous phase is disabled for this game, treat as satisfied.
    return !prev.enabled || Boolean(prev.done);
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">{gf.name}</h1>
      <p className="mb-6 text-sm text-slate-500">
        Work through each enabled phase in order — a phase unlocks once the previous one is submitted.
      </p>

      <div className="mb-6 flex gap-2">
        {phases.filter((p) => p.enabled).map((p) => {
          const unlocked = isUnlocked(p.key);
          return (
            <button
              key={p.key}
              disabled={!unlocked}
              onClick={() => setActivePhase(p.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                activePhase === p.key
                  ? "bg-slate-900 text-white"
                  : unlocked
                  ? "border border-slate-300 bg-white text-slate-700"
                  : "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
              }`}
            >
              {p.label} {p.done && "✓"}
            </button>
          );
        })}
        {phases.every((p) => !p.enabled) && (
          <p className="text-sm text-slate-400">No phases are enabled for this game.</p>
        )}
      </div>

      {activePhase === 1 && gf.phase1_enabled && (
        <form onSubmit={submitPhase1} className="max-w-lg rounded-lg border border-slate-200 bg-white p-5">
          <label className="mb-3 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isParticipating}
              onChange={(e) => setIsParticipating(e.target.checked)}
            />
            We will participate in this game
          </label>
          <label className="mb-3 flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Note (optional)</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} className="input" rows={3} />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {gf.phase1_confirmed_at ? "Update confirmation" : "Confirm"}
          </button>
          {gf.phase1_confirmed_at && (
            <p className="mt-2 text-xs text-slate-400">
              Last confirmed {new Date(gf.phase1_confirmed_at).toLocaleString()}
            </p>
          )}
        </form>
      )}

      {activePhase === 2 && gf.phase2_enabled && isUnlocked(2) && federationId && (
        <Phase2Panel
          federationId={federationId}
          gameFederationId={gf.game_federation_id}
          completed={Boolean(gf.phase2_completed_at)}
          onSubmitted={load}
        />
      )}
      {activePhase === 3 && gf.phase3_enabled && isUnlocked(3) && (
        <p className="text-sm text-slate-400">Phase 3 (Long List) UI coming next.</p>
      )}
      {activePhase === 4 && gf.phase4_enabled && isUnlocked(4) && (
        <p className="text-sm text-slate-400">Phase 4 (Short List) UI coming next.</p>
      )}
    </div>
  );
}
