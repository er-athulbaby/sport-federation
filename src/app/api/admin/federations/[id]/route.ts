import bcrypt from "bcryptjs";
import { pool } from "@/lib/db";
import { requireAdmin, errorResponse } from "@/lib/api";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const result = await pool.query(
    `SELECT id, name, logo_url, email, username, is_active, created_at
     FROM federations WHERE id = $1`,
    [id]
  );
  if (result.rows.length === 0) return errorResponse("Federation not found", 404);
  return NextResponse.json(result.rows[0]);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  const body = await request.json();
  const { name, logo_url, email, username, password, is_active } = body;

  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (name !== undefined) { fields.push(`name = $${i++}`); values.push(name); }
  if (logo_url !== undefined) { fields.push(`logo_url = $${i++}`); values.push(logo_url); }
  if (email !== undefined) { fields.push(`email = $${i++}`); values.push(email); }
  if (username !== undefined) { fields.push(`username = $${i++}`); values.push(username); }
  if (is_active !== undefined) { fields.push(`is_active = $${i++}`); values.push(is_active); }
  if (password) {
    const passwordHash = await bcrypt.hash(password, 10);
    fields.push(`password_hash = $${i++}`);
    values.push(passwordHash);
  }

  if (fields.length === 0) return errorResponse("No fields to update");

  values.push(id);
  try {
    const result = await pool.query(
      `UPDATE federations SET ${fields.join(", ")} WHERE id = $${i}
       RETURNING id, name, logo_url, email, username, is_active, created_at`,
      values
    );
    if (result.rows.length === 0) return errorResponse("Federation not found", 404);
    return NextResponse.json(result.rows[0]);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "23505") {
      return errorResponse("A federation with that email or username already exists", 409);
    }
    throw err;
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const result = await pool.query("DELETE FROM federations WHERE id = $1 RETURNING id", [id]);
  if (result.rows.length === 0) return errorResponse("Federation not found", 404);
  return NextResponse.json({ success: true });
}
