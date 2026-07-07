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

  const { long_list_id, game_event_id } = await request.json();
  if (!long_list_id || !game_event_id) {
    return errorResponse("long_list_id and game_event_id are required");
  }

  const gfCheck = await pool.query(
    `SELECT phase4_completed_at FROM game_federations WHERE id = $1 AND federation_id = $2`,
    [gameFederationId, federationId]
  );
  if (gfCheck.rows.length === 0) return errorResponse("Not found", 404);
  if (gfCheck.rows[0].phase4_completed_at) {
    return errorResponse("Phase 4 has already been finalized and cannot be changed", 422);
  }

  const entry = await pool.query(
    `SELECT dll.participant_type, dll.sport_id, a.gender AS athlete_gender
     FROM delegation_long_list dll
     LEFT JOIN athletes a ON a.id = dll.athlete_id
     WHERE dll.id = $1 AND dll.game_federation_id = $2`,
    [long_list_id, gameFederationId]
  );
  if (entry.rows.length === 0) return errorResponse("Long list entry not found", 404);
  const { participant_type, sport_id, athlete_gender } = entry.rows[0];

  const eventCheck = await pool.query(
    `SELECT ge.id, ge.declared_male, ge.declared_female, e.sport_id
     FROM game_events ge
     JOIN events e ON e.id = ge.event_id
     JOIN game_federation_sports gfs ON gfs.id = ge.game_federation_sport_id
     WHERE ge.id = $1 AND gfs.game_federation_id = $2`,
    [game_event_id, gameFederationId]
  );
  if (eventCheck.rows.length === 0) return errorResponse("Event not found for this federation's game setup", 404);
  const gameEvent = eventCheck.rows[0];

  if (gameEvent.sport_id !== sport_id) {
    return errorResponse("This person's long-list sport does not match the event's sport", 422);
  }

  if (participant_type === "athlete") {
    const countField = athlete_gender === "male" ? "declared_male" : "declared_female";
    const limit = gameEvent[countField];
    const currentCount = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM delegation_short_list dsl
       JOIN delegation_long_list dll ON dll.id = dsl.long_list_id
       JOIN athletes a ON a.id = dll.athlete_id
       WHERE dsl.game_event_id = $1 AND a.gender = $2`,
      [game_event_id, athlete_gender]
    );
    if (currentCount.rows[0].count >= limit) {
      return errorResponse(`This event has already reached its declared ${athlete_gender} quota (${limit})`, 422);
    }
  }

  try {
    const result = await pool.query(
      `INSERT INTO delegation_short_list (game_federation_id, long_list_id, game_event_id)
       VALUES ($1, $2, $3)
       RETURNING id AS short_entry_id, long_list_id, game_event_id`,
      [gameFederationId, long_list_id, game_event_id]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "23505") {
      return errorResponse("This person is already assigned to this event", 409);
    }
    throw err;
  }
}
