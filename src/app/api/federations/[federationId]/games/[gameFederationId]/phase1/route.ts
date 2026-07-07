import { pool } from "@/lib/db";
import { requireFederationAccess, errorResponse } from "@/lib/api";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ federationId: string; gameFederationId: string }> }
) {
  const { federationId, gameFederationId } = await params;
  const { error } = await requireFederationAccess(federationId);
  if (error) return error;

  const { is_participating, participation_note } = await request.json();
  if (typeof is_participating !== "boolean") {
    return errorResponse("is_participating (boolean) is required");
  }

  const result = await pool.query(
    `UPDATE game_federations
     SET is_participating = $1, participation_note = $2, phase1_confirmed_at = now()
     WHERE id = $3 AND federation_id = $4
     RETURNING id AS game_federation_id, is_participating, participation_note, phase1_confirmed_at`,
    [is_participating, participation_note ?? null, gameFederationId, federationId]
  );
  if (result.rows.length === 0) return errorResponse("Not found", 404);
  return NextResponse.json(result.rows[0]);
}
