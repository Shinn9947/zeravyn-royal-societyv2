"use client";
import { useEffect, useState } from "react";
import { Crown, LogOut, ClipboardCheck, Clock3, CheckCircle2, XCircle, RefreshCw } from "lucide-react";

type Application = { full_name:string; nickname:string; country:string; tiktok_username:string; status:string; reviewer_note:string|null; created_at:string; updated_at:string; reviewed_at:string|null };
const steps = [
  { key:"pending", title:"Pengajuan diterima", text:"Data pendaftaran sudah masuk dan menunggu pemeriksaan tim ZRS." },
  { key:"review", title:"Sedang ditinjau", text:"Tim ZRS sedang memeriksa data dan bukti pendaftaran." },
  { key:"approved", title:"Pendaftaran disetujui", text:"Selamat! Pendaftaran kamu diterima menjadi anggota ZRS." },
  { key:"rejected", title:"Pendaftaran belum disetujui", text:"Pengajuan belum dapat diterima. Baca catatan admin jika tersedia." },
];
export default function ApplicantPage(){
  const [id,setId]=useState(""); const [otp,setOtp]=useState("");
  const [application,setApplication]=useState<Application|null>(null);
  const [loading,setLoading]=useState(true); const [busy,setBusy]=useState(false);
  const [error,setError]=useState(""); const [refreshed,setRefreshed]=useState("");
  async function load(){
    try{const r=await fetch("/api/applicant/me",{cache:"no-store"});const d=await r.json();if(r.ok&&d.authenticated){setApplication(d.application);setError("");}else setApplication(null);}
    catch{setError("Tidak dapat menghubungi server. Coba lagi.");}
    finally{setLoading(false);}
  }
  useEffect(()=>{load();},[]);
  async function login(e:React.FormEvent){e.preventDefault();setBusy(true);setError("");try{
    const r=await fetch("/api/applicant/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,otp})});
    const d=await r.json();if(!r.ok)throw new Error(d.error||"Login gagal.");
    setId("");setOtp("");await load();
  }catch(e){setError(e instanceof Error?e.message:"Login gagal.");}finally{setBusy(false);}}
  async function logout(){await fetch("/api/applicant/logout",{method:"POST"});setApplication(null);setError("");}
  async function refresh(){setBusy(true);await load();setRefreshed(new Date().toLocaleTimeString("id-ID"));setBusy(false);}
  const gold="#d8b66a";
  const card:React.CSSProperties={background:"rgba(25,24,21,.92)",border:"1px solid #5e4a27",borderRadius:16,padding:20,boxShadow:"0 12px 36px #0008"};
  const shell:React.CSSProperties={minHeight:"100vh",background:"radial-gradient(ellipse at top,#292115 0%,#0b0b0b 55%)",color:"#f5f0e6",fontFamily:"Arial,sans-serif",padding:"28px 18px"};
  if(loading)return <main style={{...shell,display:"grid",placeItems:"center"}}><p style={{color:gold}}>Memeriksa sesi...</p></main>;
  if(!application)return <main style={{...shell,display:"grid",placeItems:"center"}}>
    <form onSubmit={login} style={{...card,width:"min(100%,430px)"}}>
      <a href="/" style={{color:gold,fontSize:12}}>← Website Utama</a>
      <div style={{textAlign:"center",color:gold,fontSize:32,marginTop:22}}>♛</div>
      <p style={{textAlign:"center",letterSpacing:3,color:gold,fontSize:11}}>ZERAVYN ROYAL SOCIETY</p>
      <h1 style={{textAlign:"center",fontFamily:"Georgia,serif",fontWeight:500}}>Applicant Portal</h1>
      <p style={{textAlign:"center",color:"#aaa",fontSize:13,marginBottom:25}}>Pantau perkembangan seleksi pendaftaran kamu.</p>
      <label style={label}>APPLICANT ID</label>
      <input value={id} onChange={e=>setId(e.target.value.toUpperCase())} autoComplete="username" placeholder="Contoh: ZRSA-XXXXXXXX" style={input}/>
      <label style={{...label,marginTop:16}}>OTP</label>
      <input value={otp} onChange={e=>setOtp(e.target.value)} autoComplete="one-time-code" inputMode="numeric" type="password" maxLength={6} placeholder="6 digit OTP" style={input}/>
      {error&&<p style={{color:"#ff9999",fontSize:12,marginTop:14}}>{error}</p>}
      <button disabled={busy} style={{width:"100%",padding:14,marginTop:22,border:0,borderRadius:9,background:gold,color:"#17130b",fontWeight:700}}>{busy?"MEMERIKSA...":"LIHAT STATUS PENDAFTARAN"}</button>
      <p style={{color:"#777",fontSize:11,lineHeight:1.6,textAlign:"center",marginTop:20}}>Gunakan ID dan OTP yang diberikan setelah formulir berhasil dikirim. Jangan bagikan kode ini kepada orang lain.</p>
    </form>
  </main>;
  const current=steps.find(s=>s.key===application.status)||steps[0];
  return <main style={shell}><section style={{maxWidth:760,margin:"0 auto"}}>
    <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginBottom:28}}>
      <div><a href="/" style={{color:gold,fontSize:12}}>← Website Utama</a><p style={{color:gold,letterSpacing:3,fontSize:11,marginTop:14}}>♛ ZERAVYN ROYAL SOCIETY</p><h1 style={{fontFamily:"Georgia,serif",fontWeight:500,margin:"5px 0"}}>Applicant Portal</h1><small style={{color:"#999"}}>Private application status</small></div>
      <button onClick={logout} style={logoutStyle}><LogOut size={14}/> Keluar</button>
    </header>
    <article style={card}>
      <small style={{color:gold,letterSpacing:2}}>WELCOME, APPLICANT</small>
      <h2 style={{fontFamily:"Georgia,serif",fontWeight:500,fontSize:27,margin:"10px 0 4px"}}>{application.nickname}</h2>
      <p style={{color:"#aaa",fontSize:13,margin:0}}>{application.full_name} · @{application.tiktok_username}</p>
      <div style={{marginTop:24,padding:18,borderRadius:12,background:"#111",border:"1px solid #403723"}}>
        <div style={{display:"flex",alignItems:"center",gap:9,color:gold}}><ClipboardCheck size={18}/><b style={{fontSize:12,letterSpacing:1}}>STATUS PENDAFTARAN</b></div>
        <h3 style={{fontFamily:"Georgia,serif",fontSize:22,fontWeight:500,margin:"13px 0 7px"}}>{current.title}</h3>
        <p style={{color:"#aaa",fontSize:13,lineHeight:1.7,margin:0}}>{current.text}</p>
        <span style={{display:"inline-block",marginTop:14,padding:"6px 11px",border:"1px solid #75613a",borderRadius:20,color:gold,fontSize:10,textTransform:"uppercase"}}>{application.status}</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(135px,1fr))",gap:10,marginTop:18}}>
        <div style={meta}><small>Negara</small><b>{application.country}</b></div>
        <div style={meta}><small>Tanggal pengajuan</small><b>{new Date(application.created_at).toLocaleDateString("id-ID")}</b></div>
        <div style={meta}><small>Pembaruan terakhir</small><b>{new Date(application.updated_at).toLocaleDateString("id-ID")}</b></div>
      </div>
      {application.reviewer_note&&<div style={{marginTop:18,padding:15,borderLeft:"3px solid "+gold,background:"#111"}}><small style={{color:gold}}>CATATAN DARI TIM ZRS</small><p style={{fontSize:13,lineHeight:1.7,whiteSpace:"pre-wrap",marginBottom:0}}>{application.reviewer_note}</p></div>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap",marginTop:22}}>
        <small style={{color:"#777"}}>Status diperbarui otomatis saat kamu memuat ulang.</small>
        <button onClick={refresh} disabled={busy} style={refreshStyle}><RefreshCw size={14}/> {busy?"Memuat...":"Refresh status"}</button>
      </div>
      {refreshed&&<small style={{display:"block",color:"#777",marginTop:8}}>Terakhir diperiksa: {refreshed}</small>}
    </article>
    <div style={{textAlign:"center",color:"#777",fontSize:11,marginTop:20}}>ZRS SECURE APPLICANT SESSION · DATA PRIBADI HANYA UNTUK PEMILIK AKUN</div>
  </section></main>;
}
const label:React.CSSProperties={display:"block",fontSize:12,color:"#c9b98f",marginBottom:7};
const input:React.CSSProperties={width:"100%",boxSizing:"border-box",padding:14,background:"#101010",border:"1px solid #55482e",borderRadius:8,color:"#fff",outline:"none"};
const meta:React.CSSProperties={padding:12,background:"#111",borderRadius:8};
const logoutStyle:React.CSSProperties={display:"flex",alignItems:"center",gap:7,background:"transparent",border:"1px solid #705c34",color:"#d8b66a",padding:"10px 13px",borderRadius:8};
const refreshStyle:React.CSSProperties={display:"flex",alignItems:"center",gap:8,background:"#d8b66a",border:0,color:"#17130b",padding:"10px 14px",borderRadius:8,fontWeight:700};
