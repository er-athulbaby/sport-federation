import * as XLSX from "xlsx";

export function buildWorkbookBuffer(rows: Record<string, unknown>[], sheetName = "Sheet1"): ArrayBuffer {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const arrayBuffer = new ArrayBuffer(buf.byteLength);
  new Uint8Array(arrayBuffer).set(buf);
  return arrayBuffer;
}

export function parseWorkbookBuffer(buffer: Buffer): Record<string, unknown>[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json(sheet, { defval: null });
}
