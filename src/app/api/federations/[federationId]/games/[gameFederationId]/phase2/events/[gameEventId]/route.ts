import { pool } from "@/lib/db";
import { requireFederationAccess, errorResponse } from "@/lib/api";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ federationId: string; gameFederationId: string; gameEventId: string }> }
) {
  const { federationId, gameFederationId, gameEventId } = await params;
  const { error } = await requireFederationAccess(federationId);
  if (error) return error;

  const { declared_male, declared_female } = await request.json();

  // Confirm this game_event belongs to this federation's game_federation, and fetch quota.
  const check = await pool.query(
    `SELECT ge.max_male, ge.max_female
     FROM game_events ge
     JOIN game_federation_sports gfs ON gfs.id = ge.game_federation_sport_id
     JOIN game_federations gf ON gf.id = gfs.game_federation_id
     WHERE ge.id = $1 AND gfs.game_federation_id = $2 AND gf.federation_id = $3`,
    [gameEventId, gameFederationId, federationId]
  );
  if (check.rows.length === 0) return errorResponse("Not found", 404);

  const { max_male, max_female } = check.rows[0];
  const dm = declared_male ?? 0;
  const df = declared_female ?? 0;

  if (dm > max_male || df > max_female) {
    return errorResponse(`Declared count exceeds quota (max ${max_male} male, ${max_female} female)`, 422);
  }
  if (dm < 0 || df < 0) return errorResponse("Declared count cannot be negative");

  const result = await pool.query(
    `UPDATE game_events SET declared_male = $1, declared_female = $2 WHERE id = $3
     RETURNING id AS game_event_id, declared_male, declared_female`,
    [dm, df, gameEventId]
  );
  return NextResponse.json(result.rows[0]);
}
