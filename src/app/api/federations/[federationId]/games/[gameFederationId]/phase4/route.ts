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
    `SELECT gfs.id AS game_federation_sport_id, gfs.sport_id, s.name AS sport_name
     FROM game_federation_sports gfs
     JOIN sports s ON s.id = gfs.sport_id
     WHERE gfs.game_federation_id = $1
     ORDER BY s.name ASC`,
    [gameFederationId]
  );

  const events = await pool.query(
    `SELECT ge.id AS game_event_id, ge.game_federation_sport_id, e.id AS event_id, e.name, e.gender,
            ge.declared_male, ge.declared_female
     FROM game_events ge
     JOIN events e ON e.id = ge.event_id
     WHERE ge.game_federation_sport_id = ANY($1::int[])
     ORDER BY e.name ASC`,
    [sports.rows.map((s) => s.game_federation_sport_id)]
  );

  const longList = await pool.query(
    `SELECT dll.id AS entry_id, dll.sport_id, dll.participant_type, dll.athlete_id, dll.official_id,
            a.full_name_en AS athlete_name, a.gender AS athlete_gender, a.photo_url AS athlete_photo,
            o.full_name_en AS official_name, o.designation AS official_designation, o.photo_url AS official_photo
     FROM delegation_long_list dll
     LEFT JOIN athletes a ON a.id = dll.athlete_id
     LEFT JOIN officials o ON o.id = dll.official_id
     WHERE dll.game_federation_id = $1
     ORDER BY dll.added_at ASC`,
    [gameFederationId]
  );

  const shortList = await pool.query(
    `SELECT dsl.id AS short_entry_id, dsl.long_list_id, dsl.game_event_id
     FROM delegation_short_list dsl
     WHERE dsl.game_federation_id = $1`,
    [gameFederationId]
  );

  const result = sports.rows.map((sport) => ({
    ...sport,
    events: events.rows.filter((e) => e.game_federation_sport_id === sport.game_federation_sport_id),
    longList: longList.rows.filter((e) => e.sport_id === sport.sport_id),
  }));

  return NextResponse.json({ sports: result, shortList: shortList.rows });
}
