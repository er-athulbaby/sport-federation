import { pool } from "@/lib/db";
import { requireFederationAccess, errorResponse } from "@/lib/api";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ federationId: string; gameFederationId: string }> }
) {
  const { federationId, gameFederationId } = await params;
  const { error } = await requireFederationAccess(federationId);
  if (error) return error;

  const result = await pool.query(
    `SELECT gf.id AS game_federation_id, g.id AS game_id, g.name, g.logo_url,
            g.start_date, g.end_date, g.status,
            g.phase1_enabled, g.phase2_enabled, g.phase3_enabled, g.phase4_enabled,
            gf.is_participating, gf.participation_note, gf.phase1_confirmed_at,
            gf.phase2_completed_at, gf.phase3_completed_at, gf.phase4_completed_at
     FROM game_federations gf
     JOIN games g ON g.id = gf.game_id
     WHERE gf.id = $1 AND gf.federation_id = $2`,
    [gameFederationId, federationId]
  );
  if (result.rows.length === 0) return errorResponse("Not found", 404);
  return NextResponse.json(result.rows[0]);
}
