import { pool } from "@/lib/db";
import { requireAdmin, errorResponse } from "@/lib/api";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  const { name, icon_url } = await request.json();

  const result = await pool.query(
    `UPDATE sports SET name = COALESCE($1, name), icon_url = COALESCE($2, icon_url)
     WHERE id = $3 RETURNING id, name, icon_url, created_at`,
    [name ?? null, icon_url ?? null, id]
  );
  if (result.rows.length === 0) return errorResponse("Sport not found", 404);
  return NextResponse.json(result.rows[0]);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const result = await pool.query("DELETE FROM sports WHERE id = $1 RETURNING id", [id]);
  if (result.rows.length === 0) return errorResponse("Sport not found", 404);
  return NextResponse.json({ success: true });
}
