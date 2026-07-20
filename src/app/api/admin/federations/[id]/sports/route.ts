import { pool } from "@/lib/db";
import { requireAdmin, errorResponse } from "@/lib/api";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // No permission check — also used as a lookup by the Games setup flow (to know
  // which sports a federation is allowed to bring into a game).
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const result = await pool.query(
    `SELECT fs.id AS federation_sport_id, s.id AS sport_id, s.name
     FROM federation_sports fs
     JOIN sports s ON s.id = fs.sport_id
     WHERE fs.federation_id = $1
     ORDER BY s.name ASC`,
    [id]
  );
  return NextResponse.json(result.rows);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin({ resource: "federations", action: "edit" });
  if (error) return error;
  const { id } = await params;
  const { sport_id } = await request.json();

  if (!sport_id) return errorResponse("sport_id is required");

  try {
    const result = await pool.query(
      `INSERT INTO federation_sports (federation_id, sport_id) VALUES ($1, $2)
       RETURNING id AS federation_sport_id, sport_id`,
      [id, sport_id]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "23505") {
      return errorResponse("This sport is already assigned to the federation", 409);
    }
    throw err;
  }
}
