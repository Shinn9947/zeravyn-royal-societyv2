import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const URL = process.env.SUPABASE_URL || "https://eqrcwyzmnwmayuwzuoae.supabase.co";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const COOKIE = "zrs_owner_session";

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
async function db(path: string, init: RequestInit = {}) {
  if (!KEY) throw new Error("Server database key is not configured.");
  const response = await fetch(`${URL}/rest/v1/${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`Database request failed (${response.status}): ${body.slice(0, 300)}`);
  return body ? JSON.parse(body) : null;
}
export async function createOwnerSession(id: string, otp: string) {
  const expectedId = process.env.ZRS_OWNER_ID || "";
  const expectedOtp = process.env.ZRS_OWNER_OTP || "";
  if (!expectedId || !expectedOtp || !safeEqual(id, expectedId) || !safeEqual(otp, expectedOtp)) return false;

  const codeHash = hash(expectedId);
  const found = await db(`zrs_admins?admin_code_hash=eq.${codeHash}&select=id,role,is_active&limit=1`);
  let admin = found?.[0];
  if (!admin) {
    const created = await db("zrs_admins?select=id,role,is_active", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ admin_code_hash: codeHash, label: "ZRS Owner", role: "owner", is_active: true }),
    });
    admin = created?.[0];
  }
  if (!admin?.id || admin.role !== "owner" || !admin.is_active) return false;

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
  await db("zrs_admin_sessions", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ admin_id: admin.id, session_token_hash: hash(token), expires_at: expiresAt }),
  });
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "strict", path: "/", expires: new Date(expiresAt),
  });
  return true;
}
export async function getOwnerSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const rows = await db(`zrs_admin_sessions?session_token_hash=eq.${hash(token)}&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=id,admin_id,expires_at&limit=1`);
  const session = rows?.[0];
  if (!session) return null;
  const admins = await db(`zrs_admins?id=eq.${session.admin_id}&select=id,label,role,is_active&limit=1`);
  const admin = admins?.[0];
  if (!admin?.is_active || admin.role !== "owner") return null;
  await db(`zrs_admin_sessions?id=eq.${session.id}`, {
    method: "PATCH", headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ last_seen_at: new Date().toISOString() }),
  });
  return { id: admin.id, label: admin.label, role: admin.role };
}
export async function destroyOwnerSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    await db(`zrs_admin_sessions?session_token_hash=eq.${hash(token)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
  }
  jar.set(COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
}
export async function getOverview() {
  const [applications, members] = await Promise.all([
    db("zrs_applications?select=id,full_name,nickname,age,gender,country,tiktok_username,tiktok_profile_url,follower_count,reason,status,reviewer_note,submitted_via,created_at, screenshot_path&order=created_at.desc&limit=100"),
    db("zrs_members?select=id,full_name,nickname,tiktok_username,member_number,status,joined_at&order=joined_at.desc&limit=100"),
  ]);
  return {
    applications: applications || [],
    members: members || [],
    counts: {
      total: (applications || []).length,
      pending: (applications || []).filter((x: any) => x.status === "pending").length,
      review: (applications || []).filter((x: any) => x.status === "review").length,
      approved: (applications || []).filter((x: any) => x.status === "approved").length,
      rejected: (applications || []).filter((x: any) => x.status === "rejected").length,
      members: (members || []).length,
    },
  };
}


export async function updateApplicationStatus(applicationId: string, status: "review" | "approved" | "rejected", reviewerNote: string | null = null) {
  if (!/^[0-9a-f-]{36}$/i.test(applicationId)) throw new Error("ID pendaftar tidak valid.");
  return db("rpc/zrs_owner_update_application", {
    method: "POST",
    body: JSON.stringify({ p_application_id: applicationId, p_status: status, p_reviewer_note: reviewerNote }),
  });
}


export async function getApplicationDetail(applicationId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(applicationId)) throw new Error("ID pendaftar tidak valid.");
  const rows = await db(`zrs_applications?id=eq.${applicationId}&select=id,full_name,nickname,age,gender,country,tiktok_username,tiktok_profile_url,follower_count,reason,screenshot_path,identity_confirmed,status,reviewer_note,submitted_via,whatsapp_jid,created_at,updated_at,reviewed_at&limit=1`);
  const app = rows?.[0];
  if (!app) return null;
  let evidenceUrl: string | null = null;
  if (app.screenshot_path) {
    const signed = await fetch(`${URL}/storage/v1/object/sign/zrs-applicant-evidence/${app.screenshot_path.split("/").map(encodeURIComponent).join("/")}`, {
      method: "POST", headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ expiresIn: 300 }), cache: "no-store",
    });
    if (signed.ok) {
      const payload = await signed.json();
      evidenceUrl = payload.signedURL?.startsWith("http") ? payload.signedURL : `${URL}/storage/v1${payload.signedURL}`;
    }
  }
  return { ...app, evidence_url: evidenceUrl };
}
