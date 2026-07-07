import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/api";
import { buildWorkbookBuffer } from "@/lib/excel";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const result = await pool.query(
    `SELECT f.name AS "Federation", o.full_name_en AS "Full Name (English)",
            o.full_name_ar AS "Full Name (Arabic)", o.designation AS "Designation",
            o.dob AS "Date of Birth", o.contact_number AS "Contact Number", o.email AS "Email",
            o.passport_number AS "Passport Number", o.passport_expiry_date AS "Passport Expiry Date",
            o.tshirt_size AS "T-Shirt Size", o.suit_size AS "Suit Size"
     FROM officials o JOIN federations f ON f.id = o.federation_id
     ORDER BY f.name ASC, o.full_name_en ASC`
  );

  const buffer = buildWorkbookBuffer(result.rows, "Officials");

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="all-officials.xlsx"`,
    },
  });
}
