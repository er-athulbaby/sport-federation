import { pool } from "@/lib/db";
import { requireFederationAccess, errorResponse } from "@/lib/api";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ federationId: string; gameFederationId: string; entryId: string }> }
) {
  const { federationId, gameFederationId, entryId } = await params;
  const { error } = await requireFederationAccess(federationId);
  if (error) return error;

  const result = await pool.query(
    `DELETE FROM delegation_long_list WHERE id = $1 AND game_federation_id = $2 RETURNING id`,
    [entryId, gameFederationId]
  );
  if (result.rows.length === 0) return errorResponse("Not found", 404);
  return NextResponse.json({ success: true });
}
