import { NextResponse } from "next/server";
import { destroyOwnerSession } from "@/lib/zrs-admin";
export const runtime = "nodejs";
export async function POST() {
  try {
    await destroyOwnerSession();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Tidak dapat mengakhiri sesi." }, { status: 503 });
  }
}