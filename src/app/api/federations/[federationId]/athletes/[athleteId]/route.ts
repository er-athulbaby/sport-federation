import { pool } from "@/lib/db";
import { requireFederationAccess, errorResponse } from "@/lib/api";
import { NextResponse } from "next/server";

const EDITABLE_FIELDS = [
  "full_name_en", "full_name_ar", "gender", "dob", "height_cm", "weight_kg",
  "passport_number", "passport_expiry_date", "photo_url", "tshirt_size", "suit_size",
];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ federationId: string; athleteId: string }> }
) {
  const { federationId, athleteId } = await params;
  const { error } = await requireFederationAccess(federationId);
  if (error) return error;

  const body = await request.json();
  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  for (const key of EDITABLE_FIELDS) {
    if (body[key] !== undefined) {
      fields.push(`${key} = $${i++}`);
      values.push(body[key]);
    }
  }
  if (fields.length === 0) return errorResponse("No fields to update");
  fields.push(`updated_at = now()`);

  values.push(athleteId, federationId);
  try {
    const result = await pool.query(
      `UPDATE athletes SET ${fields.join(", ")} WHERE id = $${i++} AND federation_id = $${i}
       RETURNING id, full_name_en, full_name_ar, gender, dob, height_cm, weight_kg,
                 passport_number, passport_expiry_date, photo_url, tshirt_size, suit_size,
                 created_by, created_at, updated_at`,
      values
    );
    if (result.rows.length === 0) return errorResponse("Athlete not found", 404);
    return NextResponse.json(result.rows[0]);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "23505") {
      return errorResponse("An athlete with this passport number already exists for this federation", 409);
    }
    throw err;
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ federationId: string; athleteId: string }> }
) {
  const { federationId, athleteId } = await params;
  const { error } = await requireFederationAccess(federationId);
  if (error) return error;

  const result = await pool.query(
    "DELETE FROM athletes WHERE id = $1 AND federation_id = $2 RETURNING id",
    [athleteId, federationId]
  );
  if (result.rows.length === 0) return errorResponse("Athlete not found", 404);
  return NextResponse.json({ success: true });
}
