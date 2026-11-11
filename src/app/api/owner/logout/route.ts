import { NextResponse } from "next/server";
import { destroyOwnerSession, isSameOriginMutation } from "../../../../lib/zrs-admin";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) {
    return NextResponse.json({ error: "Permintaan lintas-origin ditolak." }, { status: 403 });
  }
  try {
    await destroyOwnerSession();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Tidak dapat mengakhiri sesi." }, { status: 503 });
  }
}
