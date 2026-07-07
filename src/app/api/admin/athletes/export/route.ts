import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/api";
import { buildWorkbookBuffer } from "@/lib/excel";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const result = await pool.query(
    `SELECT f.name AS "Federation", a.full_name_en AS "Full Name (English)",
            a.full_name_ar AS "Full Name (Arabic)", a.gender AS "Gender",
            a.dob AS "Date of Birth", a.height_cm AS "Height (cm)", a.weight_kg AS "Weight (kg)",
            a.passport_number AS "Passport Number", a.passport_expiry_date AS "Passport Expiry Date",
            a.tshirt_size AS "T-Shirt Size", a.suit_size AS "Suit Size"
     FROM athletes a JOIN federations f ON f.id = a.federation_id
     ORDER BY f.name ASC, a.full_name_en ASC`
  );

  const buffer = buildWorkbookBuffer(result.rows, "Athletes");

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="all-athletes.xlsx"`,
    },
  });
}
