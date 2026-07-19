import puppeteer, { Browser } from "puppeteer";
import path from "path";
import fs from "fs/promises";
import { generateReferenceCode } from "./api";

declare global {
  // eslint-disable-next-line no-var
  var _puppeteerBrowser: Browser | undefined;
}

async function getBrowser(): Promise<Browser> {
  if (global._puppeteerBrowser && global._puppeteerBrowser.connected) {
    return global._puppeteerBrowser;
  }
  const browser = await puppeteer.launch({
    headless: true,
    // On EC2 this points at apt-installed Google Chrome (PUPPETEER_EXECUTABLE_PATH env var);
    // left unset, Puppeteer falls back to the Chromium it bundles itself (used for local dev).
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  global._puppeteerBrowser = browser;
  return browser;
}

export async function htmlToPdfBuffer(html: string): Promise<Uint8Array> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "load" });
    const buffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "18mm", bottom: "18mm", left: "14mm", right: "14mm" },
    });
    return buffer;
  } finally {
    await page.close();
  }
}

const DOCUMENTS_DIR = path.join(process.cwd(), "uploads", "documents");

export { generateReferenceCode };

export async function saveGeneratedDocument(
  gameId: number,
  federationId: number,
  phase: 2 | 3 | 4,
  referenceCode: string,
  html: string
): Promise<{ id: number; referenceCode: string; downloadUrl: string }> {
  await fs.mkdir(DOCUMENTS_DIR, { recursive: true });
  const fileName = `${referenceCode}.pdf`;
  const buffer = await htmlToPdfBuffer(html);
  await fs.writeFile(path.join(DOCUMENTS_DIR, fileName), buffer);

  const { pool } = await import("./db");
  const result = await pool.query(
    `INSERT INTO documents (game_id, federation_id, phase, reference_code, file_url)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [gameId, federationId, phase, referenceCode, `/uploads/documents/${fileName}`]
  );

  const id = result.rows[0].id;
  return { id, referenceCode, downloadUrl: `/api/documents/${id}` };
}
