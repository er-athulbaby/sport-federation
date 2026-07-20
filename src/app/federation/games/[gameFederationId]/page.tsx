"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Phase1Panel from "@/components/Phase1Panel";
import Phase2Panel from "@/components/Phase2Panel";
import Phase3Panel from "@/components/Phase3Panel";
import Phase4Panel from "@/components/Phase4Panel";

type GameFederation = {
  game_federation_id: number;
  game_id: number;
  name: string;
  phase1_enabled: boolean;
  phase2_enabled: boolean;
  phase3_enabled: boolean;
  phase4_enabled: boolean;
  is_participating: boolean | null;
  phase1_confirmed_at: string | null;
  phase2_completed_at: string | null;
  phase3_completed_at: string | null;
  phase4_completed_at: string | null;
};

type PhaseKey = 1 | 2 | 3 | 4;

const PHASE_LABELS: Record<PhaseKey, string> = {
  1: "Phase 1",
  2: "Phase 2",
  3: "Phase 3",
  4: "Phase 4",
};

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

  const load = useCallback(async () => {
    if (!federationId) return;
    const res = await fetch(`/api/federations/${federationId}/games/${gameFederationId}`);
    if (res.ok) setGf(await res.json());
  }, [federationId, gameFederationId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!gf) return <p className="text-slate-400">Loading…</p>;

  const phases: { key: PhaseKey; enabled: boolean; done: string | null }[] = [
    { key: 1, enabled: gf.phase1_enabled, done: gf.phase1_confirmed_at },
    { key: 2, enabled: gf.phase2_enabled, done: gf.phase2_completed_at },
    { key: 3, enabled: gf.phase3_enabled, done: gf.phase3_completed_at },
    { key: 4, enabled: gf.phase4_enabled, done: gf.phase4_completed_at },
  ];
  const enabledPhases = phases.filter((p) => p.enabled);

  function isUnlocked(key: PhaseKey) {
    const phase = phases.find((p) => p.key === key)!;
    if (!phase.enabled) return false;
    if (key === 1) return true;
    const prev = phases.find((p) => p.key === ((key - 1) as PhaseKey))!;
    return !prev.enabled || Boolean(prev.done);
  }

  return (
    <div>
      <Link href="/federation/games" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
        ← Back to Dashboard
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{gf.name}</h1>
          <p className="mt-1 text-sm text-slate-500">Work through each enabled phase in order.</p>
        </div>
        <nav className="hidden items-center gap-1 text-sm sm:flex">
          {enabledPhases.map((p, i) => (
            <span key={p.key} className="flex items-center gap-1">
              <button
                onClick={() => isUnlocked(p.key) && setActivePhase(p.key)}
                disabled={!isUnlocked(p.key)}
                className={
                  p.key === activePhase
                    ? "font-semibold text-slate-900"
                    : isUnlocked(p.key)
                    ? "text-slate-500 hover:text-slate-900"
                    : "cursor-not-allowed text-slate-300"
                }
              >
                {PHASE_LABELS[p.key]}
              </button>
              {i < enabledPhases.length - 1 && <span className="text-slate-300">›</span>}
            </span>
          ))}
        </nav>
      </div>

      <div className="mb-6 flex gap-2 sm:hidden">
        {enabledPhases.map((p) => {
          const unlocked = isUnlocked(p.key);
          return (
            <button
              key={p.key}
              disabled={!unlocked}
              onClick={() => setActivePhase(p.key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                activePhase === p.key
                  ? "bg-brand-600 text-white"
                  : unlocked
                  ? "border border-slate-300 bg-white text-slate-700"
                  : "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
              }`}
            >
              {PHASE_LABELS[p.key]} {p.done && "✓"}
            </button>
          );
        })}
      </div>

      {enabledPhases.length === 0 && (
        <p className="text-sm text-slate-400">No phases are enabled for this game.</p>
      )}

      {activePhase === 1 && gf.phase1_enabled && federationId && (
        <Phase1Panel
          federationId={federationId}
          gameFederationId={gf.game_federation_id}
          completed={Boolean(gf.phase1_confirmed_at)}
          onSubmitted={load}
        />
      )}
      {activePhase === 2 && gf.phase2_enabled && isUnlocked(2) && federationId && (
        <Phase2Panel
          federationId={federationId}
          gameFederationId={gf.game_federation_id}
          completed={Boolean(gf.phase2_completed_at)}
          onSubmitted={load}
        />
      )}
      {activePhase === 3 && gf.phase3_enabled && isUnlocked(3) && federationId && (
        <Phase3Panel
          federationId={federationId}
          gameFederationId={gf.game_federation_id}
          completed={Boolean(gf.phase3_completed_at)}
          onSubmitted={load}
        />
      )}
      {activePhase === 4 && gf.phase4_enabled && isUnlocked(4) && federationId && (
        <Phase4Panel
          federationId={federationId}
          gameFederationId={gf.game_federation_id}
          completed={Boolean(gf.phase4_completed_at)}
          onSubmitted={load}
        />
      )}
    </div>
  );
}
