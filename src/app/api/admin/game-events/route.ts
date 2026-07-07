import { pool } from "@/lib/db";
import { requireAdmin, errorResponse } from "@/lib/api";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;
  const gfsId = new URL(request.url).searchParams.get("game_federation_sport_id");
  if (!gfsId) return errorResponse("game_federation_sport_id query param is required");

  const result = await pool.query(
    `SELECT ge.id AS game_event_id, e.id AS event_id, e.name, e.gender,
            ge.max_male, ge.max_female, ge.declared_male, ge.declared_female
     FROM game_events ge
     JOIN events e ON e.id = ge.event_id
     WHERE ge.game_federation_sport_id = $1
     ORDER BY e.name ASC`,
    [gfsId]
  );
  return NextResponse.json(result.rows);
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;
  const body = await request.json();
  const { game_federation_sport_id, event_id, max_male, max_female } = body;

  if (!game_federation_sport_id || !event_id) {
    return errorResponse("game_federation_sport_id and event_id are required");
  }

  // Enforce that the event actually belongs to the sport added for this federation/game.
  const check = await pool.query(
    `SELECT e.id FROM events e
     JOIN game_federation_sports gfs ON gfs.sport_id = e.sport_id
     WHERE gfs.id = $1 AND e.id = $2`,
    [game_federation_sport_id, event_id]
  );
  if (check.rows.length === 0) {
    return errorResponse("This event does not belong to the sport added for this federation", 422);
  }

  try {
    const result = await pool.query(
      `INSERT INTO game_events (game_federation_sport_id, event_id, max_male, max_female)
       VALUES ($1, $2, $3, $4)
       RETURNING id AS game_event_id, event_id, max_male, max_female, declared_male, declared_female`,
      [game_federation_sport_id, event_id, max_male ?? 0, max_female ?? 0]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "23505") {
      return errorResponse("This event is already added for this federation in the game", 409);
    }
    throw err;
  }
}
