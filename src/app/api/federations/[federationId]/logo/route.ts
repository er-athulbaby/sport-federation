import { pool } from "@/lib/db";
import { requireFederationAccess, errorResponse } from "@/lib/api";
import { NextResponse } from "next/server";
import { writeFile, mkdir, readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const LOGOS_DIR = path.join(process.cwd(), "uploads", "logos");

export async function POST(
  request: Request,
  { params }: { params: Promise<{ federationId: string }> }
) {
  const { federationId } = await params;
  const { error } = await requireFederationAccess(federationId);
  if (error) return error;

  const formData = await request.formData();
  const file = formData.get("logo");
  if (!file || !(file instanceof Blob)) return errorResponse("A logo file is required");
  if (!file.type.startsWith("image/")) return errorResponse("File must be an image");

  const ext = file.type === "image/png" ? ".png" : file.type === "image/svg+xml" ? ".svg" : ".jpg";
  const filename = `federation-${federationId}${ext}`;

  await mkdir(LOGOS_DIR, { recursive: true });
  await writeFile(path.join(LOGOS_DIR, filename), Buffer.from(await file.arrayBuffer()));

  const logoUrl = `/api/federations/${federationId}/logo`;
  await pool.query(`UPDATE federations SET logo_url = $1 WHERE id = $2`, [logoUrl, federationId]);

  return NextResponse.json({ logo_url: logoUrl });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ federationId: string }> }
) {
  const { federationId } = await params;

  for (const ext of [".png", ".jpg", ".svg"]) {
    const filePath = path.join(LOGOS_DIR, `federation-${federationId}${ext}`);
    if (existsSync(filePath)) {
      const buffer = await readFile(filePath);
      const arrayBuffer = new ArrayBuffer(buffer.byteLength);
      new Uint8Array(arrayBuffer).set(buffer);
      const mime = ext === ".png" ? "image/png" : ext === ".svg" ? "image/svg+xml" : "image/jpeg";
      return new Response(arrayBuffer, {
        headers: { "Content-Type": mime, "Cache-Control": "public, max-age=3600" },
      });
    }
  }

  return errorResponse("No logo set", 404);
}
