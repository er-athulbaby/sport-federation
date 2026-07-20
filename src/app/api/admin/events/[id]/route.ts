import { pool } from "@/lib/db";
import { requireAdmin, errorResponse } from "@/lib/api";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin({ resource: "sports_events", action: "edit" });
  if (error) return error;
  const { id } = await params;
  const { name, gender } = await request.json();

  if (gender !== undefined && !["male", "female", "mixed"].includes(gender)) {
    return errorResponse("gender must be male, female, or mixed");
  }

  const result = await pool.query(
    `UPDATE events SET name = COALESCE($1, name), gender = COALESCE($2, gender)
     WHERE id = $3 RETURNING id, sport_id, name, gender, created_at`,
    [name ?? null, gender ?? null, id]
  );
  if (result.rows.length === 0) return errorResponse("Event not found", 404);
  return NextResponse.json(result.rows[0]);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin({ resource: "sports_events", action: "delete" });
  if (error) return error;
  const { id } = await params;

  const result = await pool.query("DELETE FROM events WHERE id = $1 RETURNING id", [id]);
  if (result.rows.length === 0) return errorResponse("Event not found", 404);
  return NextResponse.json({ success: true });
}
