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

  const gfCheck = await pool.query(
    `SELECT phase4_completed_at FROM game_federations WHERE id = $1 AND federation_id = $2`,
    [gameFederationId, federationId]
  );
  if (gfCheck.rows.length === 0) return errorResponse("Not found", 404);
  if (gfCheck.rows[0].phase4_completed_at) {
    return errorResponse("Phase 4 has already been finalized and cannot be changed", 422);
  }

  const result = await pool.query(
    `DELETE FROM delegation_short_list WHERE id = $1 AND game_federation_id = $2 RETURNING id`,
    [entryId, gameFederationId]
  );
  if (result.rows.length === 0) return errorResponse("Not found", 404);
  return NextResponse.json({ success: true });
}
