import { pool } from "@/lib/db";
import { requireAdmin, errorResponse } from "@/lib/api";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; gfId: string }> }
) {
  const { error } = await requireAdmin({ resource: "games", action: "delete" });
  if (error) return error;
  const { gfId } = await params;

  const result = await pool.query(
    "DELETE FROM game_federations WHERE id = $1 RETURNING id",
    [gfId]
  );
  if (result.rows.length === 0) return errorResponse("Not found", 404);
  return NextResponse.json({ success: true });
}
