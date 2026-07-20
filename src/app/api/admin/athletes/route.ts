import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/api";
import { NextResponse } from "next/server";

export async function GET() {
  const { error } = await requireAdmin({ resource: "roster", action: "view" });
  if (error) return error;

  const result = await pool.query(
    `SELECT a.id, a.full_name_en, a.full_name_ar, a.gender, a.dob, a.height_cm, a.weight_kg,
            a.passport_number, a.passport_expiry_date, a.photo_url, a.tshirt_size, a.suit_size,
            a.created_by, a.created_at, a.updated_at,
            f.id AS federation_id, f.name AS federation_name
     FROM athletes a
     JOIN federations f ON f.id = a.federation_id
     ORDER BY f.name ASC, a.full_name_en ASC`
  );
  return NextResponse.json(result.rows);
}
