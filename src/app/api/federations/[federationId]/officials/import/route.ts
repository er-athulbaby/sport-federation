import { pool } from "@/lib/db";
import { requireFederationAccess, errorResponse } from "@/lib/api";
import { parseWorkbookBuffer } from "@/lib/excel";
import { NextResponse } from "next/server";

function s(v: unknown): string | null {
  if (v === null || v === undefined || v === "") return null;
  return String(v).trim();
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ federationId: string }> }
) {
  const { federationId } = await params;
  const { createdBy, error } = await requireFederationAccess(federationId);
  if (error) return error;

  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof Blob)) return errorResponse("A file is required");

  const buffer = Buffer.from(await file.arrayBuffer());
  const rows = parseWorkbookBuffer(buffer);

  let inserted = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const [index, row] of rows.entries()) {
    const rowNum = index + 2;
    const fullNameEn = s(row["Full Name (English)"]);
    const fullNameAr = s(row["Full Name (Arabic)"]);
    const passportNumber = s(row["Passport Number"]);
    const passportExpiry = s(row["Passport Expiry Date"]);

    if (!fullNameEn || !fullNameAr || !passportNumber || !passportExpiry) {
      errors.push(`Row ${rowNum}: missing required field(s)`);
      continue;
    }

    try {
      const result = await pool.query(
        `INSERT INTO officials (federation_id, full_name_en, full_name_ar, designation,
                                 contact_number, email, passport_number, passport_expiry_date,
                                 photo_url, tshirt_size, suit_size, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (federation_id, passport_number) DO UPDATE SET
           full_name_en = EXCLUDED.full_name_en,
           full_name_ar = EXCLUDED.full_name_ar,
           designation = EXCLUDED.designation,
           contact_number = EXCLUDED.contact_number,
           email = EXCLUDED.email,
           passport_expiry_date = EXCLUDED.passport_expiry_date,
           photo_url = EXCLUDED.photo_url,
           tshirt_size = EXCLUDED.tshirt_size,
           suit_size = EXCLUDED.suit_size,
           updated_at = now()
         RETURNING (xmax = 0) AS inserted`,
        [federationId, fullNameEn, fullNameAr, s(row["Designation"]),
         s(row["Contact Number"]), s(row["Email"]), passportNumber, passportExpiry,
         s(row["Photo URL"]), s(row["T-Shirt Size"]), s(row["Suit Size"]), createdBy]
      );
      if (result.rows[0].inserted) inserted++; else updated++;
    } catch {
      errors.push(`Row ${rowNum}: could not save (${passportNumber})`);
    }
  }

  return NextResponse.json({ inserted, updated, errors });
}
