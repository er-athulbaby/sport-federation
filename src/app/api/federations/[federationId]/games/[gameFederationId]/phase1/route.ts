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

  const gfCheck = await pool.query(
    `SELECT id FROM game_federations WHERE id = $1 AND federation_id = $2`,
    [gameFederationId, federationId]
  );
  if (gfCheck.rows.length === 0) return errorResponse("Not found", 404);

  const sports = await pool.query(
    `SELECT gfs.id AS game_federation_sport_id, s.id AS sport_id, s.name AS sport_name,
            gfs.participate_men, gfs.participate_women
     FROM game_federation_sports gfs
     JOIN sports s ON s.id = gfs.sport_id
     WHERE gfs.game_federation_id = $1
     ORDER BY s.name ASC`,
    [gameFederationId]
  );

  return NextResponse.json(sports.rows);
}
