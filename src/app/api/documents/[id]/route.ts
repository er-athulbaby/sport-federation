import { pool } from "@/lib/db";
import { requireFederationAccess, errorResponse } from "@/lib/api";
import path from "path";
import fs from "fs/promises";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = await pool.query(
    `SELECT federation_id, file_url, reference_code FROM documents WHERE id = $1`,
    [id]
  );
  if (result.rows.length === 0) return errorResponse("Not found", 404);
  const doc = result.rows[0];

  const { error } = await requireFederationAccess(doc.federation_id);
  if (error) return error;

  const filePath = path.join(process.cwd(), "uploads", "documents", path.basename(doc.file_url));
  const buffer = await fs.readFile(filePath);
  const arrayBuffer = new ArrayBuffer(buffer.byteLength);
  new Uint8Array(arrayBuffer).set(buffer);

  return new Response(arrayBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${doc.reference_code}.pdf"`,
    },
  });
}
