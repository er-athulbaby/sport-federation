import { pool } from "@/lib/db";
import { requireAdmin, errorResponse } from "@/lib/api";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ geId: string }> }
) {
  const { error } = await requireAdmin({ resource: "games", action: "edit" });
  if (error) return error;
  const { geId } = await params;
  const { max_male, max_female } = await request.json();

  const result = await pool.query(
    `UPDATE game_events
     SET max_male = COALESCE($1, max_male), max_female = COALESCE($2, max_female)
     WHERE id = $3
     RETURNING id AS game_event_id, event_id, max_male, max_female, declared_male, declared_female`,
    [max_male ?? null, max_female ?? null, geId]
  );
  if (result.rows.length === 0) return errorResponse("Not found", 404);
  return NextResponse.json(result.rows[0]);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ geId: string }> }
) {
  const { error } = await requireAdmin({ resource: "games", action: "delete" });
  if (error) return error;
  const { geId } = await params;

  const result = await pool.query("DELETE FROM game_events WHERE id = $1 RETURNING id", [geId]);
  if (result.rows.length === 0) return errorResponse("Not found", 404);
  return NextResponse.json({ success: true });
}
