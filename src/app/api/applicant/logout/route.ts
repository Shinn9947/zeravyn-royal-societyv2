import { NextResponse } from "next/server";
import { destroyApplicantSession, isSameOriginMutation } from "../../../../lib/zrs-admin";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) {
    return NextResponse.json({ error: "Permintaan lintas-origin ditolak." }, { status: 403 });
  }
  try { await destroyApplicantSession(); }
  catch (error) { console.error("Applicant logout error:", error); }
  return NextResponse.json({ ok: true });
}
