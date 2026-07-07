import { pool } from "@/lib/db";
import { requireAdmin, errorResponse } from "@/lib/api";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; sportId: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id, sportId } = await params;

  const result = await pool.query(
    `DELETE FROM federation_sports WHERE federation_id = $1 AND sport_id = $2 RETURNING id`,
    [id, sportId]
  );
  if (result.rows.length === 0) return errorResponse("Assignment not found", 404);
  return NextResponse.json({ success: true });
}
