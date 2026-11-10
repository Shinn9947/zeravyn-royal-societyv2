import { NextResponse } from "next/server";
import { getOwnerSession, getApplicationDetail } from "../../../../../lib/zrs-admin";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const admin = await getOwnerSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const id = new URL(request.url).searchParams.get("id") || "";
    const application = await getApplicationDetail(id);
    if (!application) return NextResponse.json({ error: "Pendaftar tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ application });
  } catch (error) {
    console.error("ZRS application detail:", error);
    return NextResponse.json({ error: "Gagal memuat detail pendaftar." }, { status: 500 });
  }
}
