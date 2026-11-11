"use client";

import { useEffect, useRef, useState } from "react";

declare global { interface Window { turnstile?: { render: (el: HTMLElement, options: Record<string, unknown>) => string; reset: (id: string) => void; remove: (id: string) => void }; } }
import { Crown, ShieldCheck, Users, Copy, Check, ArrowRight, Menu, X, UploadCloud } from "lucide-react";

const cnOptions = [
  "—𝐍𝐚𝐦𝐚𝐥𝐮\u0060𝖋𝖙 𝗭𝗥𝗦​᭄",
  "𝗡𝗮𝗺𝗮𝗹𝘂𝗭𝐞𝐫𝐚𝐯𝐲𝐧",
  "—𝗡𝗮𝗺𝐚𝐥𝐮メ𝐙𝐞𝐫𝐚𝐯𝐲𝐧"
];

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return <button className="copy" type="button" onClick={async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }}>{copied ? <Check size={14}/> : <Copy size={14}/>} {copied ? "Tersalin" : "Salin"}</button>;
}

export default function Home() {
  const [menu, setMenu] = useState(false);
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [notice, setNotice] = useState("");
  const [data, setData] = useState({name:"",nick:"",age:"",gender:"",country:"Indonesia",username:"",url:"",followers:"",reason:""});
  const [confirmed, setConfirmed] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileWidgetId = useRef<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [issuedCredentials, setIssuedCredentials] = useState<{id:string;otp:string}|null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
  const update = (key:string,value:string) => setData(old => ({...old,[key]:value}));
  useEffect(() => {
    if (step !== 3 || !siteKey) return;
    const mount = () => {
      const el = document.getElementById("zrs-turnstile");
      if (el && window.turnstile && !turnstileWidgetId.current) {
        turnstileWidgetId.current = window.turnstile.render(el, {
          sitekey: siteKey,
          action: "signup",
          callback: (token: string) => setTurnstileToken(token),
          "expired-callback": () => setTurnstileToken(""),
          "error-callback": () => setTurnstileToken("")
        });
      }
    };
    if (window.turnstile) mount();
    else {
      const existing = document.querySelector<HTMLScriptElement>('script[data-zrs-turnstile]');
      if (existing) existing.addEventListener("load", mount);
      else { const script = document.createElement("script"); script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"; script.async = true; script.defer = true; script.dataset.zrsTurnstile = "true"; script.onload = mount; document.head.appendChild(script); }
    }
    return () => { if (turnstileWidgetId.current && window.turnstile) window.turnstile.remove(turnstileWidgetId.current); turnstileWidgetId.current = null; setTurnstileToken(""); };
  }, [step, siteKey]);
  const next = () => {
    if (step===1 && (!data.name || !data.nick || Number(data.age)<13 || !data.gender)) return setNotice("Lengkapi data pribadi. Usia minimum 13 tahun.");
    if (step===2 && (!data.username || !data.url || !data.followers || !data.reason)) return setNotice("Lengkapi seluruh informasi TikTok.");
    setNotice(""); setStep(s=>Math.min(3,s+1));
  };
  const submit = async (e:React.FormEvent) => {
    e.preventDefault();
    if (!file || !confirmed) return setNotice("Unggah screenshot dan centang konfirmasi identitas.");
    if (file.size>5*1024*1024 || !["image/png","image/jpeg","image/webp"].includes(file.type)) return setNotice("Gunakan PNG, JPG, atau WEBP maksimal 5 MB.");
    if (!siteKey) return setNotice("Verifikasi keamanan belum dikonfigurasi. Silakan hubungi admin ZRS.");
    if (!turnstileToken) return setNotice("Selesaikan verifikasi keamanan terlebih dahulu.");
    setSubmitting(true); setNotice("");
    try {
      const body = new FormData();
      body.append("full_name", data.name); body.append("nickname", data.nick); body.append("age", data.age);
      body.append("gender", data.gender); body.append("country", data.country); body.append("tiktok_username", data.username);
      body.append("tiktok_profile_url", data.url); body.append("follower_count", data.followers); body.append("reason", data.reason);
      body.append("identity_confirmed", String(confirmed)); body.append("evidence", file); body.append("turnstile_token", turnstileToken);
      body.append("website", "");
      const response = await fetch("https://eqrcwyzmnwmayuwzuoae.supabase.co/functions/v1/zrs-submit-application", { method: "POST", body });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || result.message || "Pengajuan gagal dikirim. Coba lagi.");
      if (typeof result.applicant_id !== "string" || typeof result.applicant_otp !== "string") throw new Error("Pengajuan tersimpan, tetapi ID dan OTP belum diterima. Hubungi admin ZRS.");
      setIssuedCredentials({ id: result.applicant_id, otp: result.applicant_otp });
      setNotice("Pengajuan berhasil dikirim! Simpan Applicant ID dan OTP untuk memantau status seleksi.");
      setFile(null); setConfirmed(false); setTurnstileToken("");
    } catch (err) { setNotice(err instanceof Error ? err.message : "Terjadi kesalahan saat mengirim pengajuan."); }
    finally {
      setSubmitting(false);
      if (turnstileWidgetId.current && window.turnstile) window.turnstile.reset(turnstileWidgetId.current);
      setTurnstileToken("");
    }
  };
  const Input = ({label,value,onChange,placeholder,type="text"}:{label:string;value:string;onChange:(v:string)=>void;placeholder:string;type?:string}) => <div className="field"><label>{label}</label><input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/></div>;
  return <>
    <nav className="nav"><a className="brand" href="#home"><span className="crest"><Crown size={19}/></span><span><b>ZERAVYN ROYAL SOCIETY</b><small>THE ROYAL FAMILY</small></span></a><div className={`navlinks ${menu?"open":""}`}><a href="#about">About</a><a href="#requirements">Requirements</a><a href="#identity">Identity</a><a href="#how">How to Join</a><a className="navCta" href="#apply">Apply Now <ArrowRight size={15}/></a><a className="applicantNavLink" href="/applicant">Application Status <ShieldCheck size={13}/></a><a className="ownerNavLink" href="/owner">Owner Portal <Crown size={13}/></a></div><button className="menuBtn" onClick={()=>setMenu(!menu)} aria-label="Menu">{menu?<X/>:<Menu/>}</button></nav>
    <main>
      <section className="hero" id="home"><div className="heroContent"><div className="eyebrow">EST. FOR THE EXTRAORDINARY</div><div className="heroCrown"><Crown size={35}/></div><p className="welcome">WELCOME TO THE LEGACY</p><h1>ZERAVYN <em>ROYAL</em><br/>SOCIETY</h1><div className="goldLine"/><p className="tagline">A LEGACY BEYOND ORDINARY</p><p className="heroDesc">Bukan sekadar nama. Ini tentang identitas, persaudaraan,<br className="desktop"/> dan perjalanan membangun legacy bersama.</p><a className="primaryBtn" href="#apply">BECOME A MEMBER <ArrowRight size={16}/></a></div></section>
      <section className="section" id="about"><div className="sectionTitle"><span>01 — OUR FOUNDATION</span><h2>More than a name.<br/><em>It's a belonging.</em></h2><p>Zeravyn Royal Society adalah ruang untuk tumbuh, berkarya, dan saling menguatkan dalam satu identitas.</p></div><div className="pillars"><article><ShieldCheck/><h3>IDENTITY</h3><p>Memiliki karakter dan ciri khas sebagai bagian dari keluarga ZRS.</p></article><article><Users/><h3>COMMUNITY</h3><p>Membangun lingkungan yang solid, suportif, dan saling menghargai.</p></article><article><Crown/><h3>LEGACY</h3><p>Menciptakan karya dan jejak positif bersama.</p></article></div></section>
      <section className="section" id="requirements"><div className="sectionTitle centered"><span>02 — THE STANDARD</span><h2>Requirements to <em>Join</em></h2><p>Pastikan kamu memenuhi ketentuan berikut sebelum mendaftar.</p></div><div className="reqGrid">{[["CREATOR INTEREST","Tertarik pada konten anime, preset, manipulation, atau donghua."],["FOLLOWER MINIMUM","Laki-laki minimal 100 followers dan perempuan minimal 50 followers."],["FOLLOW OFFICIAL","Mengikuti akun TikTok resmi Zeravyn Royal Society."],["ACTIVE ACCOUNT","Memiliki minimal 3 video yang dipublikasikan."],["ORIGINALITY","Bersedia membuat video original minimal 1 menit."],["ZRS IDENTITY","Menggunakan CN, bio, dan kedua hashtag resmi ZRS."]].map((x,i)=><article className="req" key={x[0]}><span className="reqNo">0{i+1}</span><div><h3>{x[0]}</h3><p>{x[1]}</p></div></article>)}</div></section>
      <section className="section identity" id="identity"><div className="sectionTitle"><span>03 — WEAR THE IDENTITY</span><h2>One name.<br/><em>One family.</em></h2><p>Gunakan identitas resmi berikut pada akun TikTok kamu.</p></div><div className="identityCard"><div className="identityTop"><Crown/> OFFICIAL ZRS IDENTITY</div><label>CHOOSE YOUR CN</label>{cnOptions.map(v=><div className="identityRow" key={v}><span>{v}</span><CopyButton value={v}/></div>)}<label>OFFICIAL BIO</label><div className="identityRow"><span>𝐙𝐑𝐒 𝐅𝐀𝐌𝐈𝐋𝐘🍁</span><CopyButton value="𝐙𝐑𝐒 𝐅𝐀𝐌𝐈𝐋𝐘🍁"/></div><label>OFFICIAL HASHTAGS</label><div className="identityRow"><span>#margazeravynroyalsociety #family_zrs</span><CopyButton value="#margazeravynroyalsociety #family_zrs"/></div></div></section>
      <section className="section" id="how"><div className="sectionTitle centered"><span>04 — THE JOURNEY</span><h2>How to <em>Become One</em></h2></div><div className="steps">{[["01","PREPARE","Pelajari persyaratan dan lengkapi identitas ZRS."],["02","APPLY","Isi formulir dengan data yang benar."],["03","REVIEW","Tim ZRS akan memeriksa pengajuan kamu."],["04","RESULT","Pantau hasil seleksi melalui informasi resmi."]].map(x=><article className="step" key={x[0]}><span>{x[0]}</span><h3>{x[1]}</h3><p>{x[2]}</p></article>)}</div></section>
      <section className="section apply" id="apply"><div className="sectionTitle centered"><span>05 — YOUR JOURNEY STARTS HERE</span><h2>Member <em>Application</em></h2><p>Isi data dengan teliti dan pastikan sesuai akun kamu.</p></div><div className="formShell"><div className="formHead"><div><span>APPLICATION FORM</span><h3>Join the Royal Family</h3></div><div className="stepCount">STEP {step} <small>/ 3</small></div></div><div className="progress"><i style={{width:`${step*33.333}%`}}/></div><form onSubmit={submit}>
      {step===1&&<div className="formGrid"><Input label="Full Name" value={data.name} onChange={v=>update("name",v)} placeholder="Nama lengkap"/><Input label="Nickname" value={data.nick} onChange={v=>update("nick",v)} placeholder="Nama panggilan"/><Input label="Age" value={data.age} onChange={v=>update("age",v)} placeholder="Minimal 13 tahun" type="number"/><div className="field"><label>Gender</label><select value={data.gender} onChange={e=>update("gender",e.target.value)}><option value="">Pilih gender</option><option>Laki-laki</option><option>Perempuan</option></select></div><Input label="Country" value={data.country} onChange={v=>update("country",v)} placeholder="Negara"/></div>}
      {step===2&&<div className="formGrid"><Input label="TikTok Username" value={data.username} onChange={v=>update("username",v)} placeholder="@username"/><Input label="TikTok Profile URL" value={data.url} onChange={v=>update("url",v)} placeholder="https://tiktok.com/@username"/><Input label="Follower Count" value={data.followers} onChange={v=>update("followers",v)} placeholder="Jumlah followers" type="number"/><div className="field full"><label>WHY DO YOU WANT TO JOIN ZRS?</label><textarea rows={4} value={data.reason} onChange={e=>update("reason",e.target.value)} placeholder="Ceritakan alasan kamu..."/></div></div>}
      {step===3&&<div className="formGrid"><div className="field full"><label>SCREENSHOT EVIDENCE (MAX 5 MB)</label><label className="uploadBox"><UploadCloud size={28}/><b>{file?file.name:"Upload screenshot bukti akun"}</b><small>PNG, JPG, atau WEBP · Maksimal 5 MB</small><input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>setFile(e.target.files?.[0]||null)}/></label></div><label className="confirm full"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/> Saya mengonfirmasi bahwa akun saya telah menggunakan identitas ZRS sesuai ketentuan.</label><div className="full"><div id="zrs-turnstile"/>{!siteKey&&<p className="privacy">Verifikasi keamanan sedang disiapkan oleh admin ZRS.</p>}</div><p className="privacy full">Data pendaftaran dan bukti digunakan hanya untuk proses seleksi ZRS.</p></div>}
      {notice&&<div className="notice">{notice}</div>}{issuedCredentials&&<div className="credentialReveal"><b>SIMpan AKSES PORTAL KAMU</b><p>Catat ID dan OTP ini sekarang. OTP hanya ditampilkan setelah pengajuan berhasil dan tidak dapat dilihat ulang.</p><div><span>APPLICANT ID</span><strong>{issuedCredentials.id}</strong></div><div><span>OTP</span><strong>{issuedCredentials.otp}</strong></div><button type="button" onClick={async()=>{await navigator.clipboard.writeText("Applicant ID: "+issuedCredentials.id+"\\nOTP: "+issuedCredentials.otp);setNotice("ID dan OTP berhasil disalin. Simpan di tempat aman.");}}>SALIN ID & OTP</button><a href="/applicant">BUKA APPLICANT DASHBOARD <ArrowRight size={14}/></a></div>}<div className="formActions">{step>1&&<button type="button" className="backBtn" onClick={()=>{setNotice("");setStep(s=>s-1)}}>BACK</button>}{step<3?<button type="button" className="primaryBtn" onClick={next}>CONTINUE <ArrowRight size={16}/></button>:<button type="submit" className="primaryBtn" disabled={submitting}>{submitting?"SENDING...":"SUBMIT APPLICATION"} <ArrowRight size={16}/></button>}</div></form></div></section>
    </main><footer><div className="footerBrand"><Crown/><b>ZERAVYN ROYAL SOCIETY</b></div><p>A LEGACY BEYOND ORDINARY</p><small>© 2026 ZERAVYN ROYAL SOCIETY. ALL RIGHTS RESERVED.</small><a className="ownerPortalLink" href="/owner">Owner Portal <ArrowRight size={12}/></a></footer>
  </>;
}