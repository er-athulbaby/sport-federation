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

  // Confirm the game_federation belongs to this federation.
  const gfCheck = await pool.query(
    `SELECT id FROM game_federations WHERE id = $1 AND federation_id = $2`,
    [gameFederationId, federationId]
  );
  if (gfCheck.rows.length === 0) return errorResponse("Not found", 404);

  const sports = await pool.query(
    `SELECT gfs.id AS game_federation_sport_id, s.id AS sport_id, s.name AS sport_name,
            gfs.entry_policy_note, gfs.age_cutoff_date
     FROM game_federation_sports gfs
     JOIN sports s ON s.id = gfs.sport_id
     WHERE gfs.game_federation_id = $1
     ORDER BY s.name ASC`,
    [gameFederationId]
  );

  const events = await pool.query(
    `SELECT ge.id AS game_event_id, ge.game_federation_sport_id, e.id AS event_id, e.name, e.gender,
            ge.max_male, ge.max_female, ge.declared_male, ge.declared_female
     FROM game_events ge
     JOIN events e ON e.id = ge.event_id
     WHERE ge.game_federation_sport_id = ANY($1::int[])
     ORDER BY e.name ASC`,
    [sports.rows.map((s) => s.game_federation_sport_id)]
  );

  const result = sports.rows.map((sport) => ({
    ...sport,
    events: events.rows.filter((e) => e.game_federation_sport_id === sport.game_federation_sport_id),
  }));

  return NextResponse.json(result);
}
