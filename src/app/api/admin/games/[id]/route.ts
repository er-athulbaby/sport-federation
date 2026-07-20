import { pool } from "@/lib/db";
import { requireAdmin, errorResponse } from "@/lib/api";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin({ resource: "games", action: "view" });
  if (error) return error;
  const { id } = await params;

  const result = await pool.query(
    `SELECT id, name, logo_url, start_date, end_date, status,
            phase1_enabled, phase2_enabled, phase3_enabled, phase4_enabled, created_at
     FROM games WHERE id = $1`,
    [id]
  );
  if (result.rows.length === 0) return errorResponse("Game not found", 404);
  return NextResponse.json(result.rows[0]);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin({ resource: "games", action: "edit" });
  if (error) return error;
  const { id } = await params;
  const body = await request.json();

  const allowed = [
    "name", "logo_url", "start_date", "end_date", "status",
    "phase1_enabled", "phase2_enabled", "phase3_enabled", "phase4_enabled",
  ];
  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  for (const key of allowed) {
    if (body[key] !== undefined) {
      fields.push(`${key} = $${i++}`);
      values.push(body[key]);
    }
  }
  if (fields.length === 0) return errorResponse("No fields to update");

  values.push(id);
  const result = await pool.query(
    `UPDATE games SET ${fields.join(", ")} WHERE id = $${i}
     RETURNING id, name, logo_url, start_date, end_date, status,
               phase1_enabled, phase2_enabled, phase3_enabled, phase4_enabled, created_at`,
    values
  );
  if (result.rows.length === 0) return errorResponse("Game not found", 404);
  return NextResponse.json(result.rows[0]);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin({ resource: "games", action: "delete" });
  if (error) return error;
  const { id } = await params;

  const result = await pool.query("DELETE FROM games WHERE id = $1 RETURNING id", [id]);
  if (result.rows.length === 0) return errorResponse("Game not found", 404);
  return NextResponse.json({ success: true });
}
