import { pool } from "@/lib/db";
import { requireAdmin, errorResponse } from "@/lib/api";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  const { name, gender } = await request.json();

  if (!name || !["male", "female", "mixed"].includes(gender)) {
    return errorResponse("name and a valid gender (male|female|mixed) are required");
  }

  const result = await pool.query(
    `INSERT INTO events (sport_id, name, gender) VALUES ($1, $2, $3)
     RETURNING id, sport_id, name, gender, created_at`,
    [id, name, gender]
  );
  return NextResponse.json(result.rows[0], { status: 201 });
}
