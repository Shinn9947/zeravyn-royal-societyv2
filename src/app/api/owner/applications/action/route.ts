import { NextResponse } from "next/server";
import { getOwnerSession, isSameOriginMutation, updateApplicationStatus } from "../../../../../lib/zrs-admin";

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
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > 8192) {
      return NextResponse.json({ error: "Data permintaan terlalu besar." }, { status: 413 });
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Data permintaan tidak valid." }, { status: 400 });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Data permintaan tidak valid." }, { status: 400 });
    }

    const { applicationId, status, reviewerNote } = body as Record<string, unknown>;
    if (typeof applicationId !== "string" ||
        !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(applicationId)) {
      return NextResponse.json({ error: "ID pendaftar tidak valid." }, { status: 400 });
    }

    const allowedStatuses = ["review", "revision", "approved", "rejected"] as const;
    if (typeof status !== "string" || !allowedStatuses.includes(status as typeof allowedStatuses[number])) {
      return NextResponse.json({ error: "Status tidak valid." }, { status: 400 });
    }

    if (reviewerNote !== undefined && reviewerNote !== null && typeof reviewerNote !== "string") {
      return NextResponse.json({ error: "Catatan pemeriksa tidak valid." }, { status: 400 });
    }
    const note = typeof reviewerNote === "string" ? reviewerNote.trim() : "";
    if (note.length > 2000) {
      return NextResponse.json({ error: "Catatan maksimal 2.000 karakter." }, { status: 400 });
    }
    if (status === "revision" && !note) {
      return NextResponse.json({ error: "Catatan revisi wajib diisi." }, { status: 400 });
    }

    const admin = await getOwnerSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
      await updateApplicationStatus(applicationId, status as typeof allowedStatuses[number], note || null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (/"code"\s*:\s*"55000"/.test(message)) {
        return NextResponse.json({ error: "Pendaftaran sudah memiliki keputusan final dan tidak dapat diubah." }, { status: 409 });
      }
      if (/"code"\s*:\s*"22023"/.test(message)) {
        return NextResponse.json({ error: "Catatan revisi wajib diisi." }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("ZRS application action error:", error);
    return NextResponse.json({ error: "Aksi gagal disimpan. Coba refresh dan ulangi." }, { status: 500 });
  }
}
