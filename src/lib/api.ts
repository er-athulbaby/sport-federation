import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { pool } from "@/lib/db";

export type AdminResource = "federations" | "sports_events" | "games" | "roster";
export type AdminAction = "view" | "edit" | "delete";

async function hasPermission(adminId: string, resource: AdminResource, action: AdminAction): Promise<boolean> {
  const result = await pool.query(
    `SELECT can_view, can_edit, can_delete FROM admin_permissions WHERE admin_id = $1 AND resource = $2`,
    [adminId, resource]
  );
  const row = result.rows[0];
  if (!row) return false;
  if (action === "view") return Boolean(row.can_view);
  if (action === "edit") return Boolean(row.can_edit);
  return Boolean(row.can_delete);
}

/**
 * Allows super_admin unconditionally. A sub_admin must have the given resource+action
 * permission in admin_permissions. Omit `check` to allow any admin regardless of role.
 */
export async function requireAdmin(check?: { resource: AdminResource; action: AdminAction }) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.user.adminRole === "super_admin" || !check) {
    return { session, error: null };
  }
  const allowed = await hasPermission(session.user.id, check.resource, check.action);
  if (!allowed) {
    return { session: null, error: NextResponse.json({ error: "You don't have permission to do this" }, { status: 403 }) };
  }
  return { session, error: null };
}

/** Only the top-level super_admin — used for managing sub-admins and their privileges. */
export async function requireSuperAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "admin" || session.user.adminRole !== "super_admin") {
    return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session, error: null };
}

export async function requireFederation() {
  const session = await auth();
  if (!session || session.user.role !== "federation") {
    return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session, error: null };
}

/**
 * Allows admin (super_admin unconditionally, sub_admin if granted the "roster" permission for
 * the given action) or the federation user matching federationId (their own only).
 */
export async function requireFederationAccess(
  federationId: string | number,
  check?: { action: AdminAction }
) {
  const session = await auth();
  if (!session) {
    return { session: null, createdBy: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.user.role === "admin") {
    if (session.user.adminRole === "super_admin" || !check) {
      return { session, createdBy: "admin" as const, error: null };
    }
    const allowed = await hasPermission(session.user.id, "roster", check.action);
    if (!allowed) {
      return { session: null, createdBy: null, error: NextResponse.json({ error: "You don't have permission to do this" }, { status: 403 }) };
    }
    return { session, createdBy: "admin" as const, error: null };
  }
  if (session.user.role === "federation" && session.user.federationId === Number(federationId)) {
    return { session, createdBy: "federation" as const, error: null };
  }
  return { session: null, createdBy: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function generateReferenceCode() {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
}
