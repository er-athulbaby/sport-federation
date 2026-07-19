import { pool } from "@/lib/db";
import { requireFederationAccess, errorResponse } from "@/lib/api";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ federationId: string; gameFederationId: string; gfsId: string }> }
) {
  const { federationId, gameFederationId, gfsId } = await params;
  const { error } = await requireFederationAccess(federationId);
  if (error) return error;

  const gfCheck = await pool.query(
    `SELECT phase1_confirmed_at FROM game_federations WHERE id = $1 AND federation_id = $2`,
    [gameFederationId, federationId]
  );
  if (gfCheck.rows.length === 0) return errorResponse("Not found", 404);
  if (gfCheck.rows[0].phase1_confirmed_at) {
    return errorResponse("Phase 1 has already been submitted for this game", 422);
  }

  const { participate_men, participate_women } = await request.json();

  const result = await pool.query(
    `UPDATE game_federation_sports
     SET participate_men = COALESCE($1, participate_men),
         participate_women = COALESCE($2, participate_women)
     WHERE id = $3 AND game_federation_id = $4
     RETURNING id AS game_federation_sport_id, participate_men, participate_women`,
    [participate_men ?? null, participate_women ?? null, gfsId, gameFederationId]
  );
  if (result.rows.length === 0) return errorResponse("Not found", 404);
  return NextResponse.json(result.rows[0]);
}
