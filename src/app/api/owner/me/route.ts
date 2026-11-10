import { NextResponse } from "next/server";
import { getOwnerSession } from "../../../../lib/zrs-admin";
export const runtime = "nodejs";
export async function GET() {
  try {
    const admin = await getOwnerSession();
    return NextResponse.json({ authenticated: !!admin, admin }, { status: admin ? 200 : 401 });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 503 });
  }
}