import bcrypt from "bcryptjs";
import { pool } from "@/lib/db";
import { requireAdmin, errorResponse } from "@/lib/api";
import { NextResponse } from "next/server";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const result = await pool.query(
    `SELECT id, name, logo_url, email, username, is_active, created_at
     FROM federations ORDER BY name ASC`
  );
  return NextResponse.json(result.rows);
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const { name, logo_url, email, username, password } = body;

  if (!name || !email || !username || !password) {
    return errorResponse("name, email, username, and password are required");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query(
      `INSERT INTO federations (name, logo_url, email, username, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, logo_url, email, username, is_active, created_at`,
      [name, logo_url ?? null, email, username, passwordHash]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "23505") {
      return errorResponse("A federation with that email or username already exists", 409);
    }
    throw err;
  }
}
