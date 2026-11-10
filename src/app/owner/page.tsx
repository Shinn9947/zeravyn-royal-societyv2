"use client";
import { useEffect, useState } from "react";

type Overview = { applications: any[]; members: any[]; counts: Record<string, number> };
export default function OwnerPage() {
  const [id, setId] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [logged, setLogged] = useState(false);
  const [data, setData] = useState<Overview | null>(null);
  const [tab, setTab] = useState<"applications" | "members">("applications");

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
  async function logout() {
    await fetch("/api/owner/logout", { method: "POST" });
    setLogged(false); setData(null);
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
      <div><p style={{color:gold,letterSpacing:3,fontSize:11}}>♛ ZERAVYN ROYAL SOCIETY</p><h1 style={{fontFamily:"Georgia,serif",fontWeight:500,margin:"5px 0"}}>Owner Dashboard</h1><small style={{color:"#999"}}>Private administration panel</small></div>
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
        {tab==="applications" ? <div style={{overflowX:"auto"}}><table style={tableStyle}><thead><tr>{["Applicant","TikTok","Followers","Status","Submitted"].map(x=><th style={thStyle} key={x}>{x}</th>)}</tr></thead><tbody>{(data?.applications||[]).map(a=><tr key={a.id}><td style={tdStyle}><b>{a.full_name}</b><br/><small style={{color:"#aaa"}}>{a.nickname} · {a.country}</small></td><td style={tdStyle}>@{a.tiktok_username}</td><td style={tdStyle}>{a.follower_count}</td><td style={tdStyle}><span style={{color:gold}}>{a.status}</span></td><td style={tdStyle}>{new Date(a.created_at).toLocaleDateString("id-ID")}</td></tr>)}</tbody></table>{!data?.applications?.length&&<p style={{color:"#999"}}>Belum ada data pendaftar.</p>}</div> :
        <div style={{overflowX:"auto"}}><table style={tableStyle}><thead><tr>{["Member","TikTok","Member No.","Status","Joined"].map(x=><th style={thStyle} key={x}>{x}</th>)}</tr></thead><tbody>{(data?.members||[]).map(m=><tr key={m.id}><td style={tdStyle}>{m.full_name}<br/><small style={{color:"#aaa"}}>{m.nickname}</small></td><td style={tdStyle}>@{m.tiktok_username}</td><td style={tdStyle}>{m.member_number||"—"}</td><td style={tdStyle}>{m.status}</td><td style={tdStyle}>{m.joined_at?new Date(m.joined_at).toLocaleDateString("id-ID"):"—"}</td></tr>)}</tbody></table>{!data?.members?.length&&<p style={{color:"#999"}}>Belum ada member.</p>}</div>}
      </div>
      <p style={{color:"#777",fontSize:11,textAlign:"center",marginTop:18}}>ZRS SECURE OWNER SESSION · DATA DITAMPILKAN DARI DATABASE</p>
    </section>
  </main>;
}
const inputStyle: React.CSSProperties = {width:"100%",boxSizing:"border-box",padding:14,background:"#101010",border:"1px solid #55482e",borderRadius:8,color:"#fff",outline:"none"};
function tabStyle(active:boolean,gold:string):React.CSSProperties{return {padding:"10px 14px",borderRadius:8,border:"1px solid #5e4a27",background:active?"#d8b66a":"#151515",color:active?"#17130b":gold,fontWeight:700};}
const tableStyle:React.CSSProperties={width:"100%",borderCollapse:"collapse",minWidth:620};
const thStyle:React.CSSProperties={textAlign:"left",padding:12,color:"#cdb77d",fontSize:12,borderBottom:"1px solid #55482e"};
const tdStyle:React.CSSProperties={padding:12,fontSize:13,borderBottom:"1px solid #34302a"};
