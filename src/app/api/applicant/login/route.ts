import { NextResponse } from "next/server";
import { createApplicantSession } from "../../../../lib/zrs-admin";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = String(body?.id || "").trim();
    const otp = String(body?.otp || "").trim();
    if (!/^ZRSA-[A-HJ-NP-Z2-9]{8}$/i.test(id) || !/^\d{6}$/.test(otp)) {
      return NextResponse.json({ error: "Periksa kembali ID dan OTP." }, { status: 400 });
    }
    const ok = await createApplicantSession(id, otp);
    if (!ok) return NextResponse.json({ error: "ID atau OTP salah, kedaluwarsa, atau akses sudah dicabut." }, { status: 401 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Applicant login error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Layanan login sedang bermasalah. Coba lagi." }, { status: 503 });
  }
}
