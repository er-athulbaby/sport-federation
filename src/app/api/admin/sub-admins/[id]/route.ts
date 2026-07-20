import { pool } from "@/lib/db";
import { requireSuperAdmin, errorResponse, AdminResource } from "@/lib/api";
import { NextResponse } from "next/server";

const RESOURCES: AdminResource[] = ["federations", "sports_events", "games", "roster"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireSuperAdmin();
  if (error) return error;
  const { id } = await params;

  const { permissions } = await request.json();
  if (!Array.isArray(permissions)) return errorResponse("permissions array is required");

  const adminCheck = await pool.query(`SELECT id FROM admins WHERE id = $1 AND role = 'sub_admin'`, [id]);
  if (adminCheck.rows.length === 0) return errorResponse("Sub-admin not found", 404);

  for (const p of permissions) {
    if (!RESOURCES.includes(p.resource)) continue;
    await pool.query(
      `UPDATE admin_permissions
       SET can_view = $1, can_edit = $2, can_delete = $3
       WHERE admin_id = $4 AND resource = $5`,
      [Boolean(p.can_view), Boolean(p.can_edit), Boolean(p.can_delete), id, p.resource]
    );
  }

  const result = await pool.query(
    `SELECT resource, can_view, can_edit, can_delete FROM admin_permissions WHERE admin_id = $1`,
    [id]
  );
  return NextResponse.json(result.rows);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireSuperAdmin();
  if (error) return error;
  const { id } = await params;

  const result = await pool.query(
    `DELETE FROM admins WHERE id = $1 AND role = 'sub_admin' RETURNING id`,
    [id]
  );
  if (result.rows.length === 0) return errorResponse("Sub-admin not found", 404);
  return NextResponse.json({ success: true });
}
