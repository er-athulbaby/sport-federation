import { pool } from "@/lib/db";
import { requireAdmin, errorResponse } from "@/lib/api";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const result = await pool.query("DELETE FROM events WHERE id = $1 RETURNING id", [id]);
  if (result.rows.length === 0) return errorResponse("Event not found", 404);
  return NextResponse.json({ success: true });
}
