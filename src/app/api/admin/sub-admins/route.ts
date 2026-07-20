import bcrypt from "bcryptjs";
import { pool } from "@/lib/db";
import { requireSuperAdmin, errorResponse, AdminResource } from "@/lib/api";
import { NextResponse } from "next/server";

const RESOURCES: AdminResource[] = ["federations", "sports_events", "games", "roster"];

export async function GET() {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const admins = await pool.query(
    `SELECT id, name, email, username, created_at FROM admins WHERE role = 'sub_admin' ORDER BY name ASC`
  );
  const permissions = await pool.query(
    `SELECT admin_id, resource, can_view, can_edit, can_delete FROM admin_permissions
     WHERE admin_id = ANY($1::int[])`,
    [admins.rows.map((a) => a.id)]
  );

  const result = admins.rows.map((admin) => ({
    ...admin,
    permissions: permissions.rows.filter((p) => p.admin_id === admin.id),
  }));

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const body = await request.json();
  const { name, email, username, password } = body;

  if (!name || !email || !username || !password) {
    return errorResponse("name, email, username, and password are required");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const adminResult = await client.query(
      `INSERT INTO admins (name, email, username, password_hash, role)
       VALUES ($1, $2, $3, $4, 'sub_admin')
       RETURNING id, name, email, username, created_at`,
      [name, email, username, passwordHash]
    );
    const admin = adminResult.rows[0];

    for (const resource of RESOURCES) {
      await client.query(
        `INSERT INTO admin_permissions (admin_id, resource, can_view, can_edit, can_delete)
         VALUES ($1, $2, false, false, false)`,
        [admin.id, resource]
      );
    }
    await client.query("COMMIT");
    return NextResponse.json(admin, { status: 201 });
  } catch (err: unknown) {
    await client.query("ROLLBACK");
    if (err && typeof err === "object" && "code" in err && err.code === "23505") {
      return errorResponse("An admin with that email or username already exists", 409);
    }
    throw err;
  } finally {
    client.release();
  }
}
