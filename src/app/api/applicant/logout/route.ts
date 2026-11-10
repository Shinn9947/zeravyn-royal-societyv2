import { NextResponse } from "next/server";
import { destroyApplicantSession } from "../../../../lib/zrs-admin";
export const runtime = "nodejs";
export async function POST() {
  try { await destroyApplicantSession(); }
  catch (error) { console.error("Applicant logout error:", error); }
  return NextResponse.json({ ok: true });
}
