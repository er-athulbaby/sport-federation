import { pool } from "@/lib/db";
import { requireFederationAccess } from "@/lib/api";
import { buildWorkbookBuffer } from "@/lib/excel";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ federationId: string }> }
) {
  const { federationId } = await params;
  const { error } = await requireFederationAccess(federationId, { action: "view" });
  if (error) return error;

  const result = await pool.query(
    `SELECT full_name_en AS "Full Name (English)", full_name_ar AS "Full Name (Arabic)",
            gender AS "Gender", dob AS "Date of Birth", height_cm AS "Height (cm)",
            weight_kg AS "Weight (kg)", passport_number AS "Passport Number",
            passport_expiry_date AS "Passport Expiry Date", photo_url AS "Photo URL",
            tshirt_size AS "T-Shirt Size", suit_size AS "Suit Size"
     FROM athletes WHERE federation_id = $1 ORDER BY full_name_en ASC`,
    [federationId]
  );

  const buffer = buildWorkbookBuffer(result.rows, "Athletes");

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="athletes-federation-${federationId}.xlsx"`,
    },
  });
}
