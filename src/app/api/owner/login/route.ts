import { NextResponse } from "next/server";
import { consumeLoginAttempt, createOwnerSession, isSameOriginMutation } from "../../../../lib/zrs-admin";

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
    if (!(await consumeLoginAttempt(request, "owner", 5))) {
      return NextResponse.json({ error: "Terlalu banyak percobaan. Coba lagi dalam 15 menit." }, { status: 429 });
    }
    const body = await request.json();
    const id = typeof body?.id === "string" ? body.id.trim() : "";
    const otp = typeof body?.otp === "string" ? body.otp.trim() : "";
    if (!id || !otp || id.length > 80 || otp.length > 32) return NextResponse.json({ error: "Masukkan ID dan OTP." }, { status: 400 });
    const ok = await createOwnerSession(id, otp);
    if (!ok) return NextResponse.json({ error: "ID atau OTP tidak valid." }, { status: 401 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("ZRS owner login error:", error);
    return NextResponse.json({ error: "Layanan login belum dikonfigurasi dengan benar." }, { status: 503 });
  }
}
