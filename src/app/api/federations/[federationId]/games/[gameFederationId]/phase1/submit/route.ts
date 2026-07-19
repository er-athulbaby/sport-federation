import { pool } from "@/lib/db";
import { requireFederationAccess, errorResponse } from "@/lib/api";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ federationId: string; gameFederationId: string }> }
) {
  const { federationId, gameFederationId } = await params;
  const { error } = await requireFederationAccess(federationId);
  if (error) return error;

  const gfCheck = await pool.query(
    `SELECT g.phase1_enabled
     FROM game_federations gf
     JOIN games g ON g.id = gf.game_id
     WHERE gf.id = $1 AND gf.federation_id = $2`,
    [gameFederationId, federationId]
  );
  if (gfCheck.rows.length === 0) return errorResponse("Not found", 404);
  if (!gfCheck.rows[0].phase1_enabled) return errorResponse("Phase 1 is not enabled for this game", 422);

  const sports = await pool.query(
    `SELECT participate_men, participate_women FROM game_federation_sports WHERE game_federation_id = $1`,
    [gameFederationId]
  );
  const isParticipating = sports.rows.some((s) => s.participate_men || s.participate_women);

  const result = await pool.query(
    `UPDATE game_federations
     SET is_participating = $1, phase1_confirmed_at = now()
     WHERE id = $2
     RETURNING id AS game_federation_id, is_participating, phase1_confirmed_at`,
    [isParticipating, gameFederationId]
  );
  return NextResponse.json(result.rows[0]);
}
