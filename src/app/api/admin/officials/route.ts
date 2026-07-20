import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/api";
import { NextResponse } from "next/server";

export async function GET() {
  const { error } = await requireAdmin({ resource: "roster", action: "view" });
  if (error) return error;

  const result = await pool.query(
    `SELECT o.id, o.full_name_en, o.full_name_ar, o.designation, o.dob, o.contact_number, o.email,
            o.passport_number, o.passport_expiry_date, o.photo_url, o.tshirt_size, o.suit_size,
            o.created_by, o.created_at, o.updated_at,
            f.id AS federation_id, f.name AS federation_name
     FROM officials o
     JOIN federations f ON f.id = o.federation_id
     ORDER BY f.name ASC, o.full_name_en ASC`
  );
  return NextResponse.json(result.rows);
}
