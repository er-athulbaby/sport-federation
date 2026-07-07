import { pool } from "@/lib/db";
import { requireFederationAccess, errorResponse } from "@/lib/api";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ federationId: string; notificationId: string }> }
) {
  const { federationId, notificationId } = await params;
  const { error } = await requireFederationAccess(federationId);
  if (error) return error;

  const { is_read } = await request.json();

  const result = await pool.query(
    `UPDATE notifications SET is_read = $1 WHERE id = $2 AND federation_id = $3 RETURNING id`,
    [Boolean(is_read), notificationId, federationId]
  );
  if (result.rows.length === 0) return errorResponse("Not found", 404);
  return NextResponse.json({ success: true });
}
