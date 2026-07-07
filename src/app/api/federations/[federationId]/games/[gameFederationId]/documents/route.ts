import { pool } from "@/lib/db";
import { requireFederationAccess, errorResponse } from "@/lib/api";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ federationId: string; gameFederationId: string }> }
) {
  const { federationId, gameFederationId } = await params;
  const { error } = await requireFederationAccess(federationId);
  if (error) return error;

  const gfCheck = await pool.query(
    `SELECT game_id FROM game_federations WHERE id = $1 AND federation_id = $2`,
    [gameFederationId, federationId]
  );
  if (gfCheck.rows.length === 0) return errorResponse("Not found", 404);

  const result = await pool.query(
    `SELECT id, phase, reference_code, generated_at
     FROM documents WHERE game_id = $1 AND federation_id = $2
     ORDER BY generated_at DESC`,
    [gfCheck.rows[0].game_id, federationId]
  );
  return NextResponse.json(result.rows);
}
