import { NextResponse } from "next/server";
import { getApplicantDashboard } from "../../../../lib/zrs-admin";
export const runtime = "nodejs";
export async function GET() {
  try {
    const application = await getApplicantDashboard();
    if (!application) return NextResponse.json({ authenticated: false }, { status: 401 });
    return NextResponse.json({ authenticated: true, application });
  } catch (error) {
    console.error("Applicant dashboard error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ authenticated: false }, { status: 503 });
  }
}
