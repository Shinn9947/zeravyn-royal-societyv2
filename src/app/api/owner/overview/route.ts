import { NextResponse } from "next/server";
import { getOwnerSession, getOverview } from "../../../../lib/zrs-admin";
export const runtime = "nodejs";
export async function GET() {
  try {
    const admin = await getOwnerSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json(await getOverview());
  } catch (error) {
    console.error("ZRS overview error:", error);
    return NextResponse.json({ error: "Gagal memuat data dashboard." }, { status: 503 });
  }
}