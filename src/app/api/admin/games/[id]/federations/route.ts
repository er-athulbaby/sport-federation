import { pool } from "@/lib/db";
import { requireAdmin, errorResponse } from "@/lib/api";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const result = await pool.query(
    `SELECT gf.id AS game_federation_id, f.id AS federation_id, f.name,
            gf.is_participating, gf.participation_note, gf.phase1_confirmed_at,
            gf.phase2_completed_at, gf.phase3_completed_at, gf.phase4_completed_at
     FROM game_federations gf
     JOIN federations f ON f.id = gf.federation_id
     WHERE gf.game_id = $1
     ORDER BY f.name ASC`,
    [id]
  );
  return NextResponse.json(result.rows);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  const { federation_id } = await request.json();

  if (!federation_id) return errorResponse("federation_id is required");

  try {
    const result = await pool.query(
      `INSERT INTO game_federations (game_id, federation_id) VALUES ($1, $2)
       RETURNING id AS game_federation_id, federation_id`,
      [id, federation_id]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "23505") {
      return errorResponse("This federation is already in the game", 409);
    }
    throw err;
  }
}
