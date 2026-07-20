import { pool } from "@/lib/db";
import { requireAdmin, errorResponse } from "@/lib/api";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin({ resource: "sports_events", action: "view" });
  if (error) return error;
  const { id } = await params;

  const result = await pool.query(
    `SELECT fs.id AS federation_sport_id, f.id AS federation_id, f.name
     FROM federation_sports fs
     JOIN federations f ON f.id = fs.federation_id
     WHERE fs.sport_id = $1
     ORDER BY f.name ASC`,
    [id]
  );
  return NextResponse.json(result.rows);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin({ resource: "sports_events", action: "edit" });
  if (error) return error;
  const { id } = await params;
  const { federation_id } = await request.json();

  if (!federation_id) return errorResponse("federation_id is required");

  try {
    const result = await pool.query(
      `INSERT INTO federation_sports (federation_id, sport_id) VALUES ($1, $2)
       RETURNING id AS federation_sport_id, federation_id`,
      [federation_id, id]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "23505") {
      return errorResponse("This federation is already assigned to the sport", 409);
    }
    throw err;
  }
}
