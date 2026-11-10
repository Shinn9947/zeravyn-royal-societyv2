import { NextResponse } from "next/server";
import { createOwnerSession } from "@/lib/zrs-admin";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id.trim() : "";
    const otp = typeof body.otp === "string" ? body.otp.trim() : "";
    if (!id || !otp || id.length > 80 || otp.length > 32) return NextResponse.json({ error: "Masukkan ID dan OTP." }, { status: 400 });
    const ok = await createOwnerSession(id, otp);
    if (!ok) return NextResponse.json({ error: "ID atau OTP tidak valid." }, { status: 401 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("ZRS owner login error:", error);
    return NextResponse.json({ error: "Layanan login belum dikonfigurasi dengan benar." }, { status: 503 });
  }
}