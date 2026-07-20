import { pool } from "@/lib/db";
import { requireAdmin, errorResponse } from "@/lib/api";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { error } = await requireAdmin({ resource: "games", action: "view" });
  if (error) return error;
  const gameFederationId = new URL(request.url).searchParams.get("game_federation_id");
  if (!gameFederationId) return errorResponse("game_federation_id query param is required");

  const result = await pool.query(
    `SELECT gfs.id AS game_federation_sport_id, s.id AS sport_id, s.name,
            gfs.entry_policy_note, gfs.age_cutoff_date
     FROM game_federation_sports gfs
     JOIN sports s ON s.id = gfs.sport_id
     WHERE gfs.game_federation_id = $1
     ORDER BY s.name ASC`,
    [gameFederationId]
  );
  return NextResponse.json(result.rows);
}

export async function POST(request: Request) {
  const { error } = await requireAdmin({ resource: "games", action: "edit" });
  if (error) return error;
  const body = await request.json();
  const { game_federation_id, sport_id, entry_policy_note, age_cutoff_date } = body;

  if (!game_federation_id || !sport_id) {
    return errorResponse("game_federation_id and sport_id are required");
  }

  // Enforce that the sport is actually assigned to this federation in the catalog.
  const fedCheck = await pool.query(
    `SELECT fs.id FROM federation_sports fs
     JOIN game_federations gf ON gf.federation_id = fs.federation_id
     WHERE gf.id = $1 AND fs.sport_id = $2`,
    [game_federation_id, sport_id]
  );
  if (fedCheck.rows.length === 0) {
    return errorResponse("This sport is not assigned to the federation in the catalog", 422);
  }

  try {
    const result = await pool.query(
      `INSERT INTO game_federation_sports (game_federation_id, sport_id, entry_policy_note, age_cutoff_date)
       VALUES ($1, $2, $3, $4)
       RETURNING id AS game_federation_sport_id, sport_id, entry_policy_note, age_cutoff_date`,
      [game_federation_id, sport_id, entry_policy_note ?? null, age_cutoff_date ?? null]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "23505") {
      return errorResponse("This sport is already added for this federation in the game", 409);
    }
    throw err;
  }
}
