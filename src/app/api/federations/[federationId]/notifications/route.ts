import { pool } from "@/lib/db";
import { requireFederationAccess } from "@/lib/api";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ federationId: string }> }
) {
  const { federationId } = await params;
  const { error } = await requireFederationAccess(federationId);
  if (error) return error;

  const result = await pool.query(
    `SELECT id, type, title, message, is_read, created_at
     FROM notifications WHERE federation_id = $1
     ORDER BY created_at DESC LIMIT 50`,
    [federationId]
  );
  return NextResponse.json(result.rows);
}
