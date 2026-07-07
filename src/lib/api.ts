import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
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
 * Allows admin (any federation) or the federation user matching federationId (their own only).
 */
export async function requireFederationAccess(federationId: string | number) {
  const session = await auth();
  if (!session) {
    return { session: null, createdBy: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.user.role === "admin") {
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
