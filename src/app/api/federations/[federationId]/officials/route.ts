import { pool } from "@/lib/db";
import { requireFederationAccess, errorResponse } from "@/lib/api";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ federationId: string }> }
) {
  const { federationId } = await params;
  const { error } = await requireFederationAccess(federationId, { action: "view" });
  if (error) return error;

  const result = await pool.query(
    `SELECT id, full_name_en, full_name_ar, designation, dob, contact_number, email,
            passport_number, passport_expiry_date, photo_url, tshirt_size, suit_size,
            created_by, created_at, updated_at
     FROM officials WHERE federation_id = $1 ORDER BY full_name_en ASC`,
    [federationId]
  );
  return NextResponse.json(result.rows);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ federationId: string }> }
) {
  const { federationId } = await params;
  const { createdBy, error } = await requireFederationAccess(federationId, { action: "edit" });
  if (error) return error;

  const body = await request.json();
  const {
    full_name_en, full_name_ar, designation, dob, contact_number, email,
    passport_number, passport_expiry_date, photo_url, tshirt_size, suit_size,
  } = body;

  if (!full_name_en || !full_name_ar || !passport_number || !passport_expiry_date) {
    return errorResponse(
      "full_name_en, full_name_ar, passport_number, and passport_expiry_date are required"
    );
  }

  try {
    const result = await pool.query(
      `INSERT INTO officials (federation_id, full_name_en, full_name_ar, designation, dob,
                               contact_number, email, passport_number, passport_expiry_date,
                               photo_url, tshirt_size, suit_size, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id, full_name_en, full_name_ar, designation, dob, contact_number, email,
                 passport_number, passport_expiry_date, photo_url, tshirt_size, suit_size,
                 created_by, created_at, updated_at`,
      [federationId, full_name_en, full_name_ar, designation ?? null, dob ?? null,
       contact_number ?? null, email ?? null, passport_number, passport_expiry_date,
       photo_url ?? null, tshirt_size ?? null, suit_size ?? null, createdBy]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "23505") {
      return errorResponse("An official with this passport number already exists for this federation", 409);
    }
    throw err;
  }
}
