"use client";
import { useEffect, useState } from "react";

type Overview = { applications: any[]; members: any[]; counts: Record<string, number> };
type ActionStatus = "review" | "revision" | "approved" | "rejected";

export default function OwnerPage() {
  const [id, setId] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [logged, setLogged] = useState(false);
  const [data, setData] = useState<Overview | null>(null);
  const [tab, setTab] = useState<"applications" | "members">("applications");
  const [actionId, setActionId] = useState("");
  const [notice, setNotice] = useState("");
  const [detail, setDetail] = useState<any>(null);
  const [detailBusy, setDetailBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/owner/overview", { cache: "no-store" });
    if (res.ok) { setData(await res.json()); setLogged(true); }
    else { setLogged(false); setData(null); }
  }
  useEffect(() => { load(); }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const res = await fetch("/api/owner/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, otp }) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Login gagal.");
      setId(""); setOtp(""); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Terjadi kesalahan."); }
    finally { setBusy(false); }
  }
  async function showDetail(applicationId: string) {
    setDetailBusy(true); setDetail(null);
    try { const res = await fetch(`/api/owner/applications/detail?id=${encodeURIComponent(applicationId)}`, { cache: "no-store" }); const result = await res.json(); if (!res.ok) throw new Error(result.error || "Gagal membuka detail."); setDetail(result.application); }
    catch (e) { setNotice(e instanceof Error ? e.message : "Gagal membuka detail."); }
    finally { setDetailBusy(false); }
  }
  async function logout() {
    await fetch("/api/owner/logout", { method: "POST" });
    setLogged(false); setData(null);
  }
  async function changeStatus(applicationId: string, status: ActionStatus) {
    const label = status === "review" ? "memproses" : status === "revision" ? "meminta revisi" : status === "approved" ? "menyetujui" : "menolak";
    const reviewerNote = status === "revision" ? (window.prompt("Tuliskan catatan revisi untuk pendaftar:", "") || "") : "";
    if (status === "revision" && !reviewerNote.trim()) { setNotice("Catatan revisi wajib diisi."); return; }
    if (!window.confirm(`Yakin ingin ${label} pendaftaran ini?${status === "approved" ? "\\nPendaftar akan otomatis dibuat menjadi member aktif." : ""}`)) return;
    setActionId(applicationId); setNotice("");
    try {
      const res = await fetch("/api/owner/applications/action", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, status, reviewerNote })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Aksi gagal.");
      setNotice(status === "review" ? "Pendaftaran dipindahkan ke tahap review." : status === "revision" ? "Catatan revisi berhasil dikirim." : status === "approved" ? "Pendaftaran disetujui dan member berhasil dibuat." : "Pendaftaran ditolak.");
      await load();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Terjadi kesalahan.");
    } finally { setActionId(""); }
  }

  const gold = "#d8b66a";
  const shell: React.CSSProperties = { minHeight:"100vh", background:"radial-gradient(ellipse at top,#292115 0%,#0b0b0b 55%)", color:"#f5f0e6", fontFamily:"Arial,sans-serif", padding:"28px 18px" };
  const card: React.CSSProperties = { background:"rgba(25,24,21,.92)", border:"1px solid #5e4a27", borderRadius:16, padding:20, boxShadow:"0 12px 36px #0008" };
  if (!logged) return <main style={{...shell,display:"grid",placeItems:"center"}}>
    <form onSubmit={login} style={{...card,width:"min(100%,420px)"}}>
      <div style={{textAlign:"center",color:gold,fontSize:30,marginBottom:12}}>♛</div>
      <p style={{textAlign:"center",letterSpacing:4,color:gold,fontSize:11}}>ZERAVYN ROYAL SOCIETY</p>
      <h1 style={{textAlign:"center",fontFamily:"Georgia,serif",fontWeight:500}}>Owner Access</h1>
      <p style={{textAlign:"center",color:"#aaa",fontSize:13,marginBottom:26}}>Private administration portal</p>
      <label style={{display:"block",fontSize:12,color:"#c9b98f",marginBottom:7}}>ADMIN ID</label>
      <input value={id} onChange={e=>setId(e.target.value)} autoComplete="username" placeholder="Masukkan ID admin" style={inputStyle}/>
      <label style={{display:"block",fontSize:12,color:"#c9b98f",margin:"16px 0 7px"}}>ONE-TIME PASSWORD</label>
      <input value={otp} onChange={e=>setOtp(e.target.value)} autoComplete="current-password" inputMode="numeric" type="password" placeholder="Masukkan OTP" style={inputStyle}/>
      {error&&<p style={{color:"#ff8b8b",fontSize:13}}>{error}</p>}
      <button disabled={busy} style={{width:"100%",marginTop:22,padding:14,border:0,borderRadius:9,background:gold,color:"#17130b",fontWeight:700}}>{busy?"MEMVERIFIKASI...":"MASUK KE DASHBOARD"}</button>
      <p style={{textAlign:"center",fontSize:11,color:"#777",marginTop:20}}>AUTHORIZED PERSONNEL ONLY</p>
    </form>
  </main>;

  return <main style={shell}>
    <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,maxWidth:1100,margin:"0 auto 28px"}}>
      <div><a href="/" className="ownerBackHome">← Website Utama</a><p style={{color:gold,letterSpacing:3,fontSize:11,marginTop:14}}>♛ ZERAVYN ROYAL SOCIETY</p><h1 style={{fontFamily:"Georgia,serif",fontWeight:500,margin:"5px 0"}}>Owner Dashboard</h1><small style={{color:"#999"}}>Private administration panel</small></div>
      <button onClick={logout} style={{background:"transparent",border:"1px solid #705c34",color:gold,padding:"10px 14px",borderRadius:8}}>Logout</button>
    </header>
    <section style={{maxWidth:1100,margin:"auto"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(135px,1fr))",gap:12,marginBottom:22}}>
        {Object.entries(data?.counts||{}).map(([k,v])=><div key={k} style={card}><small style={{color:"#b9a77d",textTransform:"uppercase"}}>{k}</small><div style={{fontSize:30,color:gold,marginTop:8}}>{v}</div></div>)}
      </div>
      <div style={card}>
        <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap"}}>
          <button onClick={()=>setTab("applications")} style={tabStyle(tab==="applications",gold)}>Applications</button>
          <button onClick={()=>setTab("members")} style={tabStyle(tab==="members",gold)}>Members</button>
          <button onClick={load} style={{...tabStyle(false,gold),marginLeft:"auto"}}>Refresh</button>
        </div>
        {notice && <p role="status" style={{padding:12,border:"1px solid #75613a",borderRadius:8,color:gold,fontSize:13,marginBottom:16}}>{notice}</p>}
        {tab==="applications" ? <>
        <div className="ownerApplicationsDesktop" style={{overflowX:"auto"}}><table style={{...tableStyle,minWidth:850}}><thead><tr>{["Applicant","TikTok","Followers","Status","Submitted","Actions"].map(x=><th style={thStyle} key={x}>{x}</th>)}</tr></thead><tbody>{(data?.applications||[]).map(a=><tr key={a.id}>
          <td style={tdStyle}><b>{a.full_name}</b><br/><small style={{color:"#aaa"}}>{a.nickname} · {a.country}</small></td>
          <td style={tdStyle}>@{a.tiktok_username}</td><td style={tdStyle}>{Number(a.follower_count||0).toLocaleString("id-ID")}</td><td style={tdStyle}><span style={{color:gold}}>{a.status}</span></td><td style={tdStyle}>{new Date(a.created_at).toLocaleDateString("id-ID")}</td>
          <td style={tdStyle}><div style={{display:"flex",gap:6,flexWrap:"wrap",minWidth:230}}><button onClick={()=>showDetail(a.id)} style={actionStyle("#d8b66a")}>Detail</button>
            <button disabled={!!actionId || a.status==="review" || a.status==="approved" || a.status==="rejected"} onClick={()=>changeStatus(a.id,"review")} style={actionStyle("#b9a16a")}>{actionId===a.id?"...":"Proses"}</button>
            <button disabled={!!actionId || a.status==="revision" || a.status==="approved" || a.status==="rejected"} onClick={()=>changeStatus(a.id,"revision")} style={actionStyle("#d49b55")}>Revisi</button>
            <button disabled={!!actionId || a.status==="approved" || a.status==="rejected"} onClick={()=>changeStatus(a.id,"approved")} style={actionStyle("#78a878")}>Setujui</button>
            <button disabled={!!actionId || a.status==="rejected" || a.status==="approved"} onClick={()=>changeStatus(a.id,"rejected")} style={actionStyle("#b96e67")}>Tolak</button>
          </div></td>
        </tr>)}</tbody></table></div>
        <div className="ownerApplicationsMobile">{(data?.applications||[]).map(a=><article key={a.id} className="ownerApplicantCard">
          <div className="ownerApplicantTop"><div><b>{a.full_name||"Nama belum tersedia"}</b><small>{a.nickname||"—"} · {a.country||"—"}</small></div><span className="ownerStatus">{a.status}</span></div>
          <div className="ownerApplicantMeta"><span>TikTok <b>@{a.tiktok_username||"—"}</b></span><span>Followers <b>{Number(a.follower_count||0).toLocaleString("id-ID")}</b></span><span>Dikirim <b>{new Date(a.created_at).toLocaleDateString("id-ID")}</b></span></div>
          <div className="ownerApplicantActions"><button onClick={()=>showDetail(a.id)} style={actionStyle("#d8b66a")}>Detail</button><button disabled={!!actionId||a.status==="review"||a.status==="approved"||a.status==="rejected"} onClick={()=>changeStatus(a.id,"review")} style={actionStyle("#b9a16a")}>Proses</button><button disabled={!!actionId||a.status==="revision"||a.status==="approved"||a.status==="rejected"} onClick={()=>changeStatus(a.id,"revision")} style={actionStyle("#d49b55")}>Revisi</button><button disabled={!!actionId||a.status==="approved"||a.status==="rejected"} onClick={()=>changeStatus(a.id,"approved")} style={actionStyle("#78a878")}>Setujui</button><button disabled={!!actionId||a.status==="rejected"||a.status==="approved"} onClick={()=>changeStatus(a.id,"rejected")} style={actionStyle("#b96e67")}>Tolak</button></div>
        </article>)}</div>
        {!data?.applications?.length&&<p style={{color:"#999"}}>Belum ada data pendaftar.</p>}
        </> :
        <div style={{overflowX:"auto"}}><table style={tableStyle}><thead><tr>{["Member","TikTok","Member No.","Status","Joined"].map(x=><th style={thStyle} key={x}>{x}</th>)}</tr></thead><tbody>{(data?.members||[]).map(m=><tr key={m.id}><td style={tdStyle}>{m.full_name}<br/><small style={{color:"#aaa"}}>{m.nickname}</small></td><td style={tdStyle}>@{m.tiktok_username}</td><td style={tdStyle}>{m.member_number||"—"}</td><td style={tdStyle}>{m.status}</td><td style={tdStyle}>{m.joined_at?new Date(m.joined_at).toLocaleDateString("id-ID"):"—"}</td></tr>)}</tbody></table>{!data?.members?.length&&<p style={{color:"#999"}}>Belum ada member.</p>}</div>}
      </div>
      {detailBusy&&<p style={{color:gold}}>Memuat detail pendaftar...</p>}
      {detail&&<div onClick={()=>setDetail(null)} style={{position:"fixed",inset:0,zIndex:60,background:"#000c",display:"grid",placeItems:"center",padding:14}}>
        <section onClick={e=>e.stopPropagation()} style={{...card,width:"min(100%,620px)",maxHeight:"88vh",overflowY:"auto",boxSizing:"border-box"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><h2 style={{fontFamily:"Georgia,serif",color:gold,fontWeight:500}}>Applicant Details</h2><button onClick={()=>setDetail(null)} style={actionStyle("#d8b66a")}>Tutup ✕</button></div>
          <h3>{detail.full_name}</h3><p style={{color:"#aaa"}}>{detail.nickname} · {detail.status}</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,fontSize:13}}>
            {([["Usia",detail.age],["Gender",detail.gender],["Negara",detail.country],["TikTok","@"+detail.tiktok_username],["Followers",Number(detail.follower_count||0).toLocaleString("id-ID")],["Dari",detail.submitted_via],["Konfirmasi identitas",detail.identity_confirmed?"Ya":"Tidak"]] as any[]).map(([k,v])=><div key={k} style={{padding:10,background:"#111",borderRadius:8}}><small style={{color:"#aa986d"}}>{k}</small><div style={{marginTop:5,overflowWrap:"anywhere"}}>{v??"—"}</div></div>)}
          </div>
          <p style={{color:"#aa986d",fontSize:12,marginBottom:5}}>Profil TikTok</p><a href={detail.tiktok_profile_url||"#"} target="_blank" rel="noreferrer" style={{color:gold,overflowWrap:"anywhere"}}>{detail.tiktok_profile_url||"Tidak tersedia"}</a>
          <p style={{color:"#aa986d",fontSize:12,marginBottom:5}}>Alasan bergabung</p><p style={{whiteSpace:"pre-wrap",lineHeight:1.6}}>{detail.reason}</p>
          <p style={{color:"#aa986d",fontSize:12,marginBottom:5}}>Catatan pemeriksa</p><p>{detail.reviewer_note||"Belum ada catatan."}</p>
          <p style={{color:"#aa986d",fontSize:12}}>Bukti screenshot</p>{detail.evidence_url?<a href={detail.evidence_url} target="_blank" rel="noreferrer" style={{color:gold}}>Buka bukti (tautan berlaku 5 menit)</a>:<span style={{color:"#999"}}>Belum tersedia</span>}
          <p style={{color:"#777",fontSize:11}}>Dikirim: {new Date(detail.created_at).toLocaleString("id-ID")}</p>
        </section>
      </div>}
      <p style={{color:"#777",fontSize:11,textAlign:"center",marginTop:18}}>ZRS SECURE OWNER SESSION · DATA DITAMPILKAN DARI DATABASE</p>
    </section>
  </main>;
}
const inputStyle: React.CSSProperties = {width:"100%",boxSizing:"border-box",padding:14,background:"#101010",border:"1px solid #55482e",borderRadius:8,color:"#fff",outline:"none"};
function tabStyle(active:boolean,gold:string):React.CSSProperties{return {padding:"10px 14px",borderRadius:8,border:"1px solid #5e4a27",background:active?"#d8b66a":"#151515",color:active?"#17130b":gold,fontWeight:700};}
function actionStyle(color:string):React.CSSProperties{return {padding:"8px 10px",borderRadius:7,border:"1px solid "+color,background:"transparent",color,fontSize:12,fontWeight:700,cursor:"pointer"};}
const tableStyle:React.CSSProperties={width:"100%",borderCollapse:"collapse",minWidth:620};
const thStyle:React.CSSProperties={textAlign:"left",padding:12,color:"#cdb77d",fontSize:12,borderBottom:"1px solid #55482e"};
const tdStyle:React.CSSProperties={padding:12,fontSize:13,borderBottom:"1px solid #34302a",verticalAlign:"middle"};
