import { pool } from "@/lib/db";
import { requireAdmin, errorResponse } from "@/lib/api";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ gfsId: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { gfsId } = await params;
  const { entry_policy_note, age_cutoff_date } = await request.json();

  const result = await pool.query(
    `UPDATE game_federation_sports
     SET entry_policy_note = COALESCE($1, entry_policy_note),
         age_cutoff_date = COALESCE($2, age_cutoff_date)
     WHERE id = $3
     RETURNING id AS game_federation_sport_id, sport_id, entry_policy_note, age_cutoff_date`,
    [entry_policy_note ?? null, age_cutoff_date ?? null, gfsId]
  );
  if (result.rows.length === 0) return errorResponse("Not found", 404);
  return NextResponse.json(result.rows[0]);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ gfsId: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { gfsId } = await params;

  const result = await pool.query(
    "DELETE FROM game_federation_sports WHERE id = $1 RETURNING id",
    [gfsId]
  );
  if (result.rows.length === 0) return errorResponse("Not found", 404);
  return NextResponse.json({ success: true });
}
