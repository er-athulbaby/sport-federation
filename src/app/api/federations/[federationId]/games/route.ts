import { pool } from "@/lib/db";
import { requireFederationAccess } from "@/lib/api";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ federationId: string }> }
) {
  const { federationId } = await params;
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
     WHERE gf.federation_id = $1
     ORDER BY g.created_at DESC`,
    [federationId]
  );
  return NextResponse.json(result.rows);
}
