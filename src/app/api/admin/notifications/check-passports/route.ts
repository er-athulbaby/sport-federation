import { requireAdmin } from "@/lib/api";
import { checkPassportExpiries } from "@/lib/notifications";
import { NextResponse } from "next/server";

export async function POST() {
  const { error } = await requireAdmin();
  if (error) return error;

  const result = await checkPassportExpiries();
  return NextResponse.json(result);
}
