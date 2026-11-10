import { NextResponse } from "next/server";
import { getOwnerSession, updateApplicationStatus } from "../../../../../lib/zrs-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const admin = await getOwnerSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { applicationId, status, reviewerNote } = body || {};
    if (!["review", "revision", "approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Status tidak valid." }, { status: 400 });
    }
    await updateApplicationStatus(applicationId, status, typeof reviewerNote === "string" ? reviewerNote : null);
    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("ZRS application action error:", error);
    return NextResponse.json({ error: "Aksi gagal disimpan. Coba refresh dan ulangi." }, { status: 500 });
  }
}
