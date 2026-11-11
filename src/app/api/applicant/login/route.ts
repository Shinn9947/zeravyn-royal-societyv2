import { NextResponse } from "next/server";
import { consumeLoginAttempt, createApplicantSession, isSameOriginMutation } from "../../../../lib/zrs-admin";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) {
    return NextResponse.json({ error: "Permintaan lintas-origin ditolak." }, { status: 403 });
  }
  const contentType = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (contentType !== "application/json") {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 415 });
  }

  try {
    if (!(await consumeLoginAttempt(request, "applicant", 10))) {
      return NextResponse.json({ error: "Terlalu banyak percobaan. Coba lagi dalam 15 menit." }, { status: 429 });
    }
    const body = await request.json();
    const id = typeof body?.id === "string" ? body.id.trim() : "";
    const otp = typeof body?.otp === "string" ? body.otp.trim() : "";
    if (!/^ZRSA-[A-HJ-NP-Z2-9]{8}$/i.test(id) || !/^\d{6}$/.test(otp)) {
      return NextResponse.json({ error: "Periksa kembali ID dan OTP." }, { status: 400 });
    }
    const ok = await createApplicantSession(id, otp);
    if (!ok) return NextResponse.json({ error: "ID dan OTP salah, kedaluwarsa, atau akses sudah dicabut." }, { status: 401 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Applicant login error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Layanan login sedang bermasalah. Coba lagi." }, { status: 503 });
  }
}
