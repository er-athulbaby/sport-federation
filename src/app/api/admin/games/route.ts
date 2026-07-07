import { pool } from "@/lib/db";
import { requireAdmin, errorResponse } from "@/lib/api";
import { NextResponse } from "next/server";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const result = await pool.query(
    `SELECT id, name, logo_url, start_date, end_date, status,
            phase1_enabled, phase2_enabled, phase3_enabled, phase4_enabled, created_at
     FROM games ORDER BY created_at DESC`
  );
  return NextResponse.json(result.rows);
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const {
    name,
    logo_url,
    start_date,
    end_date,
    phase1_enabled = true,
    phase2_enabled = true,
    phase3_enabled = true,
    phase4_enabled = true,
  } = body;

  if (!name) return errorResponse("name is required");

  const result = await pool.query(
    `INSERT INTO games (name, logo_url, start_date, end_date,
                         phase1_enabled, phase2_enabled, phase3_enabled, phase4_enabled)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, name, logo_url, start_date, end_date, status,
               phase1_enabled, phase2_enabled, phase3_enabled, phase4_enabled, created_at`,
    [name, logo_url ?? null, start_date ?? null, end_date ?? null,
     phase1_enabled, phase2_enabled, phase3_enabled, phase4_enabled]
  );
  return NextResponse.json(result.rows[0], { status: 201 });
}
