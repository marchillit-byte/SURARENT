import { useState, useEffect, useRef } from "react";
import { loadFromCloud, saveToCloud } from "./firebase.js";

const STORAGE_KEY = "rent-manager-v4";
const SETTINGS_KEY = "rent-manager-settings";

// ===== FILE UTILS =====
function compressImage(file, maxW = 1200, quality = 0.7) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (!file.type.startsWith("image/")) { resolve({ data: e.target.result, name: file.name, type: file.type, isImage: false }); return; }
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width, h = img.height;
        if (w > maxW) { h = (h * maxW) / w; w = maxW; }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve({ data: canvas.toDataURL("image/jpeg", quality), name: file.name, type: "image/jpeg", isImage: true });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
async function processFile(file) {
  if (file.type.startsWith("image/")) return compressImage(file);
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve({ data: e.target.result, name: file.name, type: file.type, isImage: false });
    reader.readAsDataURL(file);
  });
}

// ===== DEFAULT DATA =====
const defaultTenants = [
  {
    id: "t1", name: "คุณสมชาย วิริยะ", phone: "081-234-5678", contactType: "line", contactId: "@somchai",
    property: "คอนโด The Base สุขุมวิท 50 ห้อง 1205", type: "condo",
    rentAmount: 15000, depositAmount: 30000, depositPaid: true,
    advanceRent: 15000, advanceRentPaid: true,
    contractStart: "2025-01-15", contractEnd: "2026-01-14", dueDay: 5,
    manager: "มิ้ง", collector: "พี่แจ๋ว",
    documents: { contractFile: null, photos: [] },
    payments: [
      { id: "p1", month: "2025-01", amount: 15000, water: 350, electric: 1200, date: "2025-01-05", status: "paid", slip: null, note: "ชำระตรงเวลา" },
      { id: "p2", month: "2025-02", amount: 15000, water: 400, electric: 1100, date: "2025-02-05", status: "paid", slip: null, note: "" },
      { id: "p3", month: "2025-03", amount: 15000, water: 380, electric: 1300, date: "2025-03-07", status: "paid", slip: null, note: "ล่าช้า 2 วัน" },
      { id: "p4", month: "2025-04", amount: 15000, water: 0, electric: 0, date: null, status: "overdue", slip: null, note: "" },
    ],
  },
  {
    id: "t2", name: "คุณวิภา แสงทอง", phone: "089-876-5432", contactType: "line", contactId: "@wipa_s",
    property: "ทาวน์โฮม หมู่บ้านพฤกษา 48 หลังที่ 22", type: "house",
    rentAmount: 12000, depositAmount: 24000, depositPaid: true,
    advanceRent: 12000, advanceRentPaid: true,
    contractStart: "2024-06-01", contractEnd: "2025-05-31", dueDay: 1,
    manager: "มิ้ง", collector: "มิ้ง",
    documents: { contractFile: null, photos: [] },
    payments: [
      { id: "p5", month: "2025-02", amount: 12000, water: 0, electric: 0, date: "2025-02-01", status: "paid", slip: null, note: "" },
      { id: "p6", month: "2025-03", amount: 12000, water: 0, electric: 0, date: "2025-03-01", status: "paid", slip: null, note: "" },
      { id: "p7", month: "2025-04", amount: 12000, water: 0, electric: 0, date: "2025-04-01", status: "paid", slip: null, note: "" },
    ],
  },
  {
    id: "t3", name: "คุณธนา ปิยะกุล", phone: "062-111-2233", contactType: "wechat", contactId: "thana_py",
    property: "คอนโด Lumpini Suite เพชรบุรี ห้อง 808", type: "condo",
    rentAmount: 18000, depositAmount: 36000, depositPaid: true,
    advanceRent: 18000, advanceRentPaid: false,
    contractStart: "2025-03-01", contractEnd: "2026-02-28", dueDay: 5,
    manager: "พี่แจ๋ว", collector: "พี่แจ๋ว",
    documents: { contractFile: null, photos: [] },
    payments: [
      { id: "p8", month: "2025-03", amount: 18000, water: 300, electric: 900, date: "2025-03-05", status: "paid", slip: null, note: "" },
      { id: "p9", month: "2025-04", amount: 18000, water: 0, electric: 0, date: null, status: "pending", slip: null, note: "" },
    ],
  },
  {
    id: "t4", name: "คุณนภัส จันทร์เพ็ญ", phone: "095-444-5566", contactType: "line", contactId: "@naphat.c",
    property: "อาคารพาณิชย์ ถ.รัชดาภิเษก ชั้น 2", type: "commercial",
    rentAmount: 35000, depositAmount: 70000, depositPaid: true,
    advanceRent: 35000, advanceRentPaid: true,
    contractStart: "2024-09-01", contractEnd: "2026-08-31", dueDay: 10,
    manager: "คุณพ่อ", collector: "มิ้ง",
    documents: { contractFile: null, photos: [] },
    payments: [
      { id: "p10", month: "2025-02", amount: 35000, water: 0, electric: 0, date: "2025-02-10", status: "paid", slip: null, note: "" },
      { id: "p11", month: "2025-03", amount: 35000, water: 0, electric: 0, date: "2025-03-12", status: "paid", slip: null, note: "ล่าช้า 2 วัน" },
      { id: "p12", month: "2025-04", amount: 35000, water: 0, electric: 0, date: null, status: "overdue", slip: null, note: "" },
    ],
  },
];

const defaultSettings = { bankName: "", bankAccount: "", bankAccountName: "" };

// ===== UTILS =====
const fmt = (n) => n?.toLocaleString("th-TH") ?? "0";
const thaiMonth = (m) => { const [y, mo] = m.split("-"); const ms = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."]; return `${ms[parseInt(mo)-1]} ${parseInt(y)+543}`; };
const fmtDate = (d) => { if(!d) return "-"; const dt=new Date(d); const ms=["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."]; return `${dt.getDate()} ${ms[dt.getMonth()]} ${dt.getFullYear()+543}`; };
const uid = () => Math.random().toString(36).slice(2, 10);
const payTotal = (p) => (p.amount||0) + (p.water||0) + (p.electric||0);
const statusMap = { paid:{label:"ชำระแล้ว",color:"#22c55e",bg:"#052e16"}, pending:{label:"รอชำระ",color:"#eab308",bg:"#422006"}, overdue:{label:"ค้างชำระ",color:"#ef4444",bg:"#450a0a"} };
const typeMap = { condo:"คอนโด", house:"บ้าน/ทาวน์โฮม", commercial:"อาคารพาณิชย์", land:"ที่ดิน" };

// ===== ICONS =====
const Icon = ({d,size=20,color="currentColor"}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>;
const II = {
  home:"M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
  users:"M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2 M9 11a4 4 0 100-8 4 4 0 000 8 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75",
  bell:"M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0",
  dollar:"M12 1v22 M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
  check:"M20 6L9 17l-5-5", x:"M18 6L6 18 M6 6l12 12", plus:"M12 5v14 M5 12h14",
  search:"M11 17.25a6.25 6.25 0 110-12.5 6.25 6.25 0 010 12.5z M16 16l4.5 4.5",
  trash:"M3 6h18 M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2",
  image:"M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z M8.5 10a1.5 1.5 0 110-3 1.5 1.5 0 010 3z M21 15l-5-5L5 21",
  clock:"M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 6v6l4 2",
  back:"M19 12H5 M12 19l-7-7 7-7",
  copy:"M20 9h-9a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-9a2 2 0 00-2-2z M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1",
  file:"M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6",
  camera:"M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z M12 13m-4 0a4 4 0 108 0 4 4 0 10-8 0",
  edit:"M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  msg:"M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
  upload:"M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M17 8l-5-5-5 5 M12 3v12",
  report:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 012-2h2a2 2 0 012 2 M9 5h6 M9 14h6 M9 18h6 M9 10h2",
  settings:"M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
};

// ===== PALETTE & STYLES =====
const P = { bg:"#0a0a0f",card:"#12121a",border:"#1e1e2e",text:"#e4e4e7",muted:"#71717a",accent:"#6366f1",accentSoft:"rgba(99,102,241,0.15)",green:"#22c55e",greenSoft:"rgba(34,197,94,0.12)",yellow:"#eab308",yellowSoft:"rgba(234,179,8,0.12)",red:"#ef4444",redSoft:"rgba(239,68,68,0.12)",input:"#18182a" };
const btnIcon={width:40,height:40,borderRadius:10,border:`1px solid ${P.border}`,background:P.card,color:P.text,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"};
const cardS={background:P.card,border:`1px solid ${P.border}`,borderRadius:14,padding:16,marginBottom:12};
const btnP={background:P.accent,color:"#fff",border:"none",borderRadius:10,padding:"10px 20px",fontWeight:600,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",gap:8};
const inputS={width:"100%",background:P.input,border:`1px solid ${P.border}`,borderRadius:10,padding:"10px 14px",color:P.text,fontSize:14,outline:"none"};
const smallBtn=(c,bg)=>({padding:"6px 12px",borderRadius:8,border:`1px solid ${c}`,background:bg,color:c,fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4});

// ===== SHARED COMPONENTS =====
function FilePicker({accept,onFile,children,multiple,style:cs}){const ref=useRef();return(<><input ref={ref} type="file" accept={accept} multiple={multiple} style={{display:"none"}} onChange={async(e)=>{const f=Array.from(e.target.files);if(!f.length)return;const r=await Promise.all(f.map(processFile));onFile(multiple?r:r[0]);e.target.value="";}}/><button onClick={()=>ref.current?.click()} style={cs}>{children}</button></>);}
function PreviewModal({src,name,onClose}){if(!src)return null;return(<div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:600,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,animation:"fadeIn .2s ease",cursor:"zoom-out"}}><div style={{color:"#fff",fontSize:14,fontWeight:600,marginBottom:12,textAlign:"center"}}>{name}</div><img src={src} alt={name} style={{maxWidth:"100%",maxHeight:"80vh",borderRadius:8,objectFit:"contain"}}/><button onClick={onClose} style={{marginTop:16,color:"#fff",background:"rgba(255,255,255,0.15)",border:"none",borderRadius:8,padding:"8px 20px",fontSize:13,cursor:"pointer"}}>ปิด</button></div>);}
function Fld({label,value,onChange,ph,type="text"}){return(<div><label style={{fontSize:12,color:P.muted,marginBottom:4,display:"block"}}>{label}</label><input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={ph} style={inputS}/></div>);}
function IC({label,value,hl,st,warn,sub}){return(<div><div style={{fontSize:11,color:P.muted,marginBottom:2}}>{label}</div><div style={{fontSize:13,fontWeight:hl?700:500,color:warn?P.yellow:hl?P.accent:P.text}}>{value}{st&&<span style={{marginLeft:6,fontSize:10,fontWeight:600,color:st==="paid"?P.green:P.yellow,background:st==="paid"?P.greenSoft:P.yellowSoft,padding:"1px 6px",borderRadius:4}}>{st==="paid"?"✓":"⏳ ค้าง"}</span>}</div>{sub&&<div style={{fontSize:10,color:warn?P.red:P.muted,marginTop:1}}>{sub}</div>}</div>);}

// ===== GENERATE MESSAGE =====
function genMsg(t, type, settings) {
  const lp = t.payments.filter(p=>p.status!=="paid").sort((a,b)=>a.month.localeCompare(b.month))[0] || t.payments[t.payments.length-1];
  const month = lp ? thaiMonth(lp.month) : "";
  const total = lp ? payTotal(lp) : t.rentAmount;
  const bankLine = settings?.bankAccount ? `\n\n🏦 โอนเข้าบัญชี:\n${settings.bankName} ${settings.bankAccount}\nชื่อ ${settings.bankAccountName}` : "";
  const overdueList = t.payments.filter(p=>p.status==="overdue");
  const overdueTotal = overdueList.reduce((s,p)=>s+payTotal(p),0);

  if (type==="reminder") return `สวัสดีครับ/ค่ะ ${t.name}\n\nแจ้งเตือนชำระค่าเช่า\n📍 ${t.property}\n💰 ค่าเช่า ฿${fmt(lp?.amount||t.rentAmount)}${(lp?.water||lp?.electric)?`\n💧 ค่าน้ำ ฿${fmt(lp.water)} ⚡ ค่าไฟ ฿${fmt(lp.electric)}\n📊 รวมทั้งหมด ฿${fmt(total)}`:""}\n📅 ประจำเดือน ${month}\n⏰ กำหนดชำระ: วันที่ ${t.dueDay} ของเดือน${bankLine}\n\nกรุณาชำระภายในกำหนดและส่งสลิปยืนยันด้วยนะครับ/ค่ะ\nขอบคุณครับ/ค่ะ 🙏`;
  if (type==="overdue") return `สวัสดีครับ/ค่ะ ${t.name}\n\n🚨 แจ้งเตือน: ค่าเช่าค้างชำระ\n📍 ${t.property}\n💰 ค้างชำระ ${overdueList.length} เดือน รวม ฿${fmt(overdueTotal)}\n${overdueList.map(p=>`  • ${thaiMonth(p.month)} ฿${fmt(payTotal(p))}`).join("\n")}${bankLine}\n\nกรุณาชำระและส่งสลิปยืนยันโดยเร็วด้วยนะครับ/ค่ะ\nขอบคุณครับ/ค่ะ 🙏`;
  if (type==="receipt") return `สวัสดีครับ/ค่ะ ${t.name}\n\n✅ ยืนยันการรับชำระค่าเช่า\n📍 ${t.property}\n💰 จำนวน ฿${fmt(total)}\n📅 ประจำเดือน ${month}\n📆 วันที่รับชำระ: ${fmtDate(new Date().toISOString().split("T")[0])}\n\nขอบคุณครับ/ค่ะ 🙏`;
  return "";
}

// ===== MAIN APP =====
export default function RentManager() {
  const [tenants, setTenants] = useState([]);
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard");
  const [selTenant, setSelTenant] = useState(null);
  const [searchQ, setSearchQ] = useState("");
  const [filterSt, setFilterSt] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [msgModal, setMsgModal] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [toast, setToast] = useState(null);
  const [preview, setPreview] = useState(null);

  // Load from Firebase on start
  useEffect(() => {
    loadFromCloud().then(data => {
      if (data) {
        if (data.tenants) setTenants(data.tenants);
        if (data.settings) setSettings(data.settings);
      }
      setLoading(false);
    });
  }, []);

  // Save to Firebase when data changes (debounced)
  const isFirstLoad = useRef(true);
  useEffect(() => {
    if (loading) return;
    if (isFirstLoad.current) { isFirstLoad.current = false; return; }
    const t = setTimeout(() => {
      saveToCloud({ tenants, settings });
    }, 1000);
    return () => clearTimeout(t);
  }, [tenants, settings, loading]);

  // Auto-generate missing monthly payments
  useEffect(() => {
    const today=new Date(),curY=today.getFullYear(),curM=today.getMonth();
    let changed=false;
    const updated=tenants.map(t=>{
      if(!t.contractStart)return t;
      const start=new Date(t.contractStart),end=t.contractEnd?new Date(t.contractEnd):new Date(curY+1,curM,1);
      const months=[];let y=start.getFullYear(),m=start.getMonth();
      while(y<curY||(y===curY&&m<=curM)){const ym=`${y}-${String(m+1).padStart(2,"0")}`;if(new Date(y,m,1)<=end)months.push(ym);m++;if(m>11){m=0;y++;}}
      const existing=new Set(t.payments.map(p=>p.month));
      const missing=months.filter(ym=>!existing.has(ym));
      if(!missing.length)return t;
      changed=true;
      const np=missing.map(ym=>{const [py,pm]=ym.split("-").map(Number);const due=new Date(py,pm-1,t.dueDay||5);return{id:uid(),month:ym,amount:t.rentAmount,water:0,electric:0,date:null,status:today>due?"overdue":"pending",slip:null,note:""};});
      return{...t,payments:[...t.payments,...np].sort((a,b)=>a.month.localeCompare(b.month))};
    });
    if(changed)setTenants(updated);
  }, [tenants.length, tenants.map(t=>`${t.id}:${t.contractStart}:${t.contractEnd}:${t.payments.length}`).join(",")]);

  // Notifications
  useEffect(() => {
    const today=new Date(),n=[];
    tenants.forEach(t=>{
      const od=t.payments.filter(p=>p.status==="overdue"),pd=t.payments.filter(p=>p.status==="pending");
      if(od.length>0){const tot=od.reduce((s,p)=>s+payTotal(p),0);n.push({id:uid(),type:"overdue",tenant:t.name,tenantId:t.id,property:t.property,amount:tot,message:`ค้างชำระ ${od.length} เดือน รวม ฿${fmt(tot)}`});}
      if(pd.length>0){const lp=pd[0];n.push({id:uid(),type:"pending",tenant:t.name,tenantId:t.id,property:t.property,amount:lp.amount,month:lp.month,message:`ใกล้กำหนดชำระ ${thaiMonth(lp.month)} วันที่ ${t.dueDay}`});}
      const dl=Math.ceil((new Date(t.contractEnd)-today)/864e5);
      if(dl<=60&&dl>0)n.push({id:uid(),type:"contract",tenant:t.name,tenantId:t.id,property:t.property,message:`สัญญาหมดอายุใน ${dl} วัน`});
      if(!t.advanceRentPaid)n.push({id:uid(),type:"advance",tenant:t.name,tenantId:t.id,property:t.property,amount:t.advanceRent,message:`ยังไม่เก็บค่าเช่าล่วงหน้า ฿${fmt(t.advanceRent)}`});
    });
    setNotifications(n);
  }, [tenants]);

  const showT=(msg,tp="success")=>{setToast({msg,tp});setTimeout(()=>setToast(null),3000);};
  const updateT=(id,fn)=>setTenants(p=>p.map(t=>t.id===id?fn(t):t));
  const markPaid=(tid,pid)=>{updateT(tid,t=>({...t,payments:t.payments.map(p=>p.id===pid?{...p,status:"paid",date:new Date().toISOString().split("T")[0]}:p)}));showT("บันทึกการชำระสำเร็จ");};
  const addTenant=(tenant)=>{setTenants(p=>[...p,{...tenant,id:uid(),payments:[],documents:{contractFile:null,photos:[]}}]);showT("เพิ่มผู้เช่าสำเร็จ");};
  const deleteTenant=(id)=>{setTenants(p=>p.filter(t=>t.id!==id));setView("tenants");showT("ลบผู้เช่าสำเร็จ");};

  const cmk=`${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,"0")}`;
  const totalRent=tenants.reduce((s,t)=>s+t.rentAmount,0);
  const paidMonth=tenants.reduce((s,t)=>{const p=t.payments.find(p=>p.month===cmk);return s+(p?.status==="paid"?payTotal(p):0);},0);
  const overdueAmt=tenants.reduce((s,t)=>s+t.payments.filter(p=>p.status==="overdue").reduce((a,p)=>a+payTotal(p),0),0);
  const overdueCnt=tenants.filter(t=>t.payments.some(p=>p.status==="overdue")).length;

  const openDetail=(t)=>{setSelTenant(t);setView("tenant-detail");};
  const cur=selTenant?tenants.find(t=>t.id===selTenant.id)||selTenant:null;

  if (loading) return (
    <div style={{minHeight:"100vh",background:P.bg,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,fontFamily:"'Sarabun',system-ui,sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
      <div style={{fontSize:40}}>🏠</div>
      <div style={{color:P.text,fontSize:16,fontWeight:600}}>Rent Manager</div>
      <div style={{color:P.muted,fontSize:13}}>กำลังโหลดข้อมูล...</div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:P.bg,color:P.text,fontFamily:"'Sarabun','Noto Sans Thai',system-ui,sans-serif",maxWidth:960,margin:"0 auto",padding:"0 16px"}}>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
      {toast&&<div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",background:toast.tp==="success"?P.green:P.red,color:"#fff",padding:"10px 24px",borderRadius:10,fontSize:14,fontWeight:600,zIndex:9999,boxShadow:"0 8px 32px rgba(0,0,0,0.4)",animation:"slideDown .3s ease"}}>{toast.msg}</div>}

      <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 0 16px",borderBottom:`1px solid ${P.border}`,position:"sticky",top:0,background:P.bg,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {!["dashboard"].includes(view)&&<button onClick={()=>setView("dashboard")} style={{...btnIcon,marginRight:4}}><Icon d={II.back} size={18}/></button>}
          <div><h1 style={{fontSize:20,fontWeight:700,margin:0}}>🏠 Rent Manager</h1><p style={{fontSize:12,color:P.muted,margin:0}}>ระบบจัดการค่าเช่า</p></div>
        </div>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>setView("settings")} style={btnIcon}><Icon d={II.settings} size={18}/></button>
          <button onClick={()=>setView("notifications")} style={{...btnIcon,position:"relative"}}><Icon d={II.bell} size={18}/>{notifications.length>0&&<span style={{position:"absolute",top:-2,right:-2,width:18,height:18,borderRadius:"50%",background:P.red,color:"#fff",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{notifications.length}</span>}</button>
        </div>
      </header>

      <div style={{paddingBottom:100}}>
        {view==="dashboard"&&<Dashboard tenants={tenants} totalRent={totalRent} paidMonth={paidMonth} overdueAmt={overdueAmt} overdueCnt={overdueCnt} notifications={notifications} onViewTenants={()=>setView("tenants")} onViewNotifs={()=>setView("notifications")} onViewReport={()=>setView("report")} onSelect={openDetail} onLoadDemo={()=>{setTenants(defaultTenants);showT("โหลดข้อมูลตัวอย่างแล้ว");}}/>}
        {view==="tenants"&&<TenantList tenants={tenants} sq={searchQ} setSq={setSearchQ} fs={filterSt} setFs={setFilterSt} onSelect={openDetail} onAdd={()=>setShowAddModal(true)}/>}
        {view==="tenant-detail"&&cur&&(
          <TenantDetail tenant={cur} settings={settings} onBack={()=>setView("tenants")}
            onMarkPaid={(pid)=>markPaid(cur.id,pid)}
            onDelete={()=>deleteTenant(cur.id)}
            onOpenMsg={(type)=>setMsgModal({tenant:cur,type})}
            onSaveSlip={(pid,slip)=>{updateT(cur.id,t=>({...t,payments:t.payments.map(p=>p.id===pid?{...p,slip,status:"paid",date:new Date().toISOString().split("T")[0]}:p)}));showT("บันทึกสลิปสำเร็จ");}}
            onUpdateDocs={(docs)=>{updateT(cur.id,t=>({...t,documents:docs}));showT("บันทึกเอกสารสำเร็จ");}}
            onPreview={(src,name)=>setPreview({src,name})}
            onAddPayment={(payment)=>{updateT(cur.id,t=>({...t,payments:[...t.payments,payment].sort((a,b)=>a.month.localeCompare(b.month))}));showT("เพิ่มรอบเก็บสำเร็จ");}}
            onDeletePayment={(pid)=>{updateT(cur.id,t=>({...t,payments:t.payments.filter(p=>p.id!==pid)}));showT("ลบรายการสำเร็จ");}}
            onEditTenant={(data)=>{updateT(cur.id,t=>({...t,...data}));showT("แก้ไขข้อมูลสำเร็จ");}}
            onUpdatePayment={(pid,data)=>{updateT(cur.id,t=>({...t,payments:t.payments.map(p=>p.id===pid?{...p,...data}:p)}));showT("บันทึกค่าสาธารณูปโภคสำเร็จ");}}
          />
        )}
        {view==="notifications"&&<NotificationView notifications={notifications} tenants={tenants} onSelect={(id)=>{const t=tenants.find(te=>te.id===id);if(t)openDetail(t);}} onOpenMsg={(tid,type)=>{const t=tenants.find(te=>te.id===tid);if(t)setMsgModal({tenant:t,type});}}/>}
        {view==="report"&&<ReportView tenants={tenants}/>}
        {view==="settings"&&<SettingsView settings={settings} onSave={(s)=>{setSettings(s);showT("บันทึกตั้งค่าสำเร็จ");}} onClearAll={()=>{if(confirm("⚠️ ล้างข้อมูลผู้เช่าทั้งหมด? (ย้อนกลับไม่ได้)")){setTenants([]);saveToCloud({tenants:[],settings});showT("ล้างข้อมูลทั้งหมดแล้ว");}}}/>}
      </div>

      {showAddModal&&<AddTenantModal onClose={()=>setShowAddModal(false)} onAdd={addTenant}/>}
      {msgModal&&<MessageModal tenant={msgModal.tenant} type={msgModal.type} settings={settings} onClose={()=>setMsgModal(null)} onCopied={()=>showT("คัดลอกข้อความแล้ว")}/>}
      {preview&&<PreviewModal src={preview.src} name={preview.name} onClose={()=>setPreview(null)}/>}

      <nav style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:960,background:"rgba(10,10,15,0.95)",backdropFilter:"blur(20px)",borderTop:`1px solid ${P.border}`,display:"flex",justifyContent:"space-around",padding:"8px 0 env(safe-area-inset-bottom, 8px)",zIndex:200}}>
        {[{key:"dashboard",icon:II.home,label:"หน้าหลัก"},{key:"tenants",icon:II.users,label:"ผู้เช่า"},{key:"report",icon:II.report,label:"รายงาน"},{key:"notifications",icon:II.bell,label:"แจ้งเตือน",badge:notifications.length}].map(item=>(
          <button key={item.key} onClick={()=>setView(item.key)} style={{background:"none",border:"none",color:view===item.key?P.accent:P.muted,display:"flex",flexDirection:"column",alignItems:"center",gap:2,cursor:"pointer",padding:"4px 12px",position:"relative"}}>
            <div style={{position:"relative"}}><Icon d={item.icon} size={20} color={view===item.key?P.accent:P.muted}/>{item.badge>0&&<span style={{position:"absolute",top:-6,right:-10,width:16,height:16,borderRadius:"50%",background:P.red,color:"#fff",fontSize:9,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{item.badge}</span>}</div>
            <span style={{fontSize:10,fontWeight:view===item.key?600:400}}>{item.label}</span>
          </button>
        ))}
      </nav>

      <style>{`@keyframes slideDown{from{transform:translateX(-50%) translateY(-20px);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}*{box-sizing:border-box}input,select,textarea{font-family:'Sarabun',system-ui,sans-serif}textarea{resize:vertical}`}</style>
    </div>
  );
}

// ===== MESSAGE MODAL =====
function MessageModal({tenant,type,settings,onClose,onCopied}){
  const [msg,setMsg]=useState(()=>genMsg(tenant,type,settings));
  const [copied,setCopied]=useState(false);
  const handleCopy=async()=>{try{await navigator.clipboard.writeText(msg);}catch{const ta=document.createElement("textarea");ta.value=msg;document.body.appendChild(ta);ta.select();document.execCommand("copy");document.body.removeChild(ta);}setCopied(true);onCopied();setTimeout(()=>setCopied(false),2000);};
  const labels={reminder:"แจ้งเตือนชำระ",overdue:"ทวงค่าเช่าค้าง",receipt:"ยืนยันรับชำระ"};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center",animation:"fadeIn .2s ease"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:P.bg,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:500,maxHeight:"85vh",overflow:"auto",padding:24,animation:"slideUp .3s ease"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div><h3 style={{fontSize:16,fontWeight:700,margin:0}}>📋 {labels[type]}</h3><p style={{fontSize:12,color:P.muted,margin:"4px 0 0"}}>{tenant.name} — แก้ไขได้ก่อนก๊อปปี้</p></div>
          <button onClick={onClose} style={btnIcon}><Icon d={II.x} size={18}/></button>
        </div>
        <textarea value={msg} onChange={e=>setMsg(e.target.value)} rows={14} style={{...inputS,fontSize:13,lineHeight:1.7,minHeight:220}}/>
        <div style={{display:"flex",gap:8,marginTop:16}}>
          {["reminder","overdue","receipt"].map(tp=>(<button key={tp} onClick={()=>setMsg(genMsg(tenant,tp,settings))} style={{padding:"6px 10px",borderRadius:8,border:`1px solid ${type===tp?P.accent:P.border}`,background:type===tp?P.accentSoft:"transparent",color:type===tp?P.accent:P.muted,fontSize:11,fontWeight:600,cursor:"pointer"}}>{tp==="reminder"?"แจ้งเตือน":tp==="overdue"?"ทวงหนี้":"ยืนยัน"}</button>))}
        </div>
        <button onClick={handleCopy} style={{...btnP,width:"100%",justifyContent:"center",marginTop:16,background:copied?P.green:P.accent,transition:"background .2s"}}><Icon d={copied?II.check:II.copy} size={16} color="#fff"/>{copied?"คัดลอกแล้ว ✓":"คัดลอกข้อความ"}</button>
        <p style={{fontSize:11,color:P.muted,textAlign:"center",marginTop:10}}>ก๊อปปี้แล้ววางใน LINE / WeChat / SMS ได้เลย</p>
      </div>
    </div>
  );
}

// ===== SETTINGS VIEW =====
function SettingsView({settings,onSave,onClearAll}){
  const [s,setS]=useState(settings);
  return(
    <div style={{animation:"fadeIn .3s ease",marginTop:16}}>
      <h2 style={{fontSize:18,fontWeight:700,marginBottom:16}}>⚙️ ตั้งค่า</h2>
      <div style={cardS}>
        <h3 style={{fontSize:14,fontWeight:600,marginBottom:12}}>🏦 บัญชีธนาคาร (แนบในข้อความทวง)</h3>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <Fld label="ธนาคาร" value={s.bankName} onChange={v=>setS(p=>({...p,bankName:v}))} ph="เช่น กสิกรไทย, กรุงเทพ, SCB"/>
          <Fld label="เลขบัญชี" value={s.bankAccount} onChange={v=>setS(p=>({...p,bankAccount:v}))} ph="xxx-x-xxxxx-x"/>
          <Fld label="ชื่อบัญชี" value={s.bankAccountName} onChange={v=>setS(p=>({...p,bankAccountName:v}))} ph="ชื่อ-นามสกุล"/>
        </div>
        <button onClick={()=>onSave(s)} style={{...btnP,width:"100%",justifyContent:"center",marginTop:16}}><Icon d={II.check} size={16} color="#fff"/> บันทึก</button>
        {s.bankAccount&&<div style={{...cardS,marginTop:16,background:P.accentSoft,borderColor:P.accent}}>
          <div style={{fontSize:12,color:P.muted,marginBottom:4}}>ตัวอย่างที่จะแนบในข้อความ:</div>
          <div style={{fontSize:13,color:P.text,whiteSpace:"pre-line"}}>🏦 โอนเข้าบัญชี:{"\n"}{s.bankName} {s.bankAccount}{"\n"}ชื่อ {s.bankAccountName}</div>
        </div>}
      </div>
      <div style={{...cardS,marginTop:16,borderColor:P.red}}>
        <h3 style={{fontSize:14,fontWeight:600,marginBottom:8,color:P.red}}>🗑️ ล้างข้อมูล</h3>
        <p style={{fontSize:12,color:P.muted,marginBottom:12}}>ลบข้อมูลผู้เช่าทั้งหมดออกจากระบบ (ย้อนกลับไม่ได้)</p>
        <button onClick={onClearAll} style={{...smallBtn(P.red,P.redSoft),width:"100%",justifyContent:"center"}}><Icon d={II.trash} size={14} color={P.red}/> ล้างข้อมูลทั้งหมด</button>
      </div>
    </div>
  );
}

// ===== REPORT VIEW =====
function ReportView({tenants}){
  const [selMonth,setSelMonth]=useState(()=>{const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;});
  const data=tenants.map(t=>{const p=t.payments.find(pp=>pp.month===selMonth);return{...t,payment:p};}).filter(d=>d.payment);
  const paid=data.filter(d=>d.payment.status==="paid");
  const unpaid=data.filter(d=>d.payment.status!=="paid");
  const totalExpected=data.reduce((s,d)=>s+payTotal(d.payment),0);
  const totalCollected=paid.reduce((s,d)=>s+payTotal(d.payment),0);
  const totalPending=unpaid.reduce((s,d)=>s+payTotal(d.payment),0);

  return(
    <div style={{animation:"fadeIn .3s ease",marginTop:16}}>
      <h2 style={{fontSize:18,fontWeight:700,marginBottom:16}}>📊 สรุปรายงาน</h2>
      <div style={{marginBottom:16}}>
        <label style={{fontSize:12,color:P.muted,marginBottom:4,display:"block"}}>เลือกเดือน</label>
        <input type="month" value={selMonth} onChange={e=>setSelMonth(e.target.value)} style={inputS}/>
      </div>

      <div style={{fontSize:16,fontWeight:700,marginBottom:12}}>{thaiMonth(selMonth)}</div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
        <div style={{...cardS,background:P.accentSoft,borderColor:"transparent",textAlign:"center"}}><div style={{fontSize:10,color:P.muted}}>คาดว่าเก็บได้</div><div style={{fontSize:16,fontWeight:700,color:P.accent}}>฿{fmt(totalExpected)}</div></div>
        <div style={{...cardS,background:P.greenSoft,borderColor:"transparent",textAlign:"center"}}><div style={{fontSize:10,color:P.muted}}>เก็บแล้ว</div><div style={{fontSize:16,fontWeight:700,color:P.green}}>฿{fmt(totalCollected)}</div></div>
        <div style={{...cardS,background:P.redSoft,borderColor:"transparent",textAlign:"center"}}><div style={{fontSize:10,color:P.muted}}>ค้าง</div><div style={{fontSize:16,fontWeight:700,color:P.red}}>฿{fmt(totalPending)}</div></div>
      </div>

      {/* Detail Table */}
      <div style={cardS}>
        <div style={{fontSize:13,fontWeight:600,marginBottom:10}}>รายละเอียด ({data.length} ราย)</div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{borderBottom:`1px solid ${P.border}`}}>
              <th style={{textAlign:"left",padding:"8px 6px",color:P.muted,fontWeight:500}}>ผู้เช่า</th>
              <th style={{textAlign:"left",padding:"8px 6px",color:P.muted,fontWeight:500}}>ผู้รับเงิน</th>
              <th style={{textAlign:"right",padding:"8px 6px",color:P.muted,fontWeight:500}}>ค่าเช่า</th>
              <th style={{textAlign:"right",padding:"8px 6px",color:P.muted,fontWeight:500}}>น้ำ/ไฟ</th>
              <th style={{textAlign:"right",padding:"8px 6px",color:P.muted,fontWeight:500}}>รวม</th>
              <th style={{textAlign:"center",padding:"8px 6px",color:P.muted,fontWeight:500}}>สถานะ</th>
            </tr></thead>
            <tbody>
              {data.map(d=>{const p=d.payment;const s=statusMap[p.status];const ut=(p.water||0)+(p.electric||0);return(
                <tr key={d.id} style={{borderBottom:`1px solid ${P.border}`}}>
                  <td style={{padding:"10px 6px"}}><div style={{fontWeight:600}}>{d.name}</div><div style={{fontSize:11,color:P.muted}}>{d.property}</div></td>
                  <td style={{padding:"10px 6px",fontSize:12,color:P.muted}}>{d.collector||"-"}</td>
                  <td style={{textAlign:"right",padding:"10px 6px"}}>฿{fmt(p.amount)}</td>
                  <td style={{textAlign:"right",padding:"10px 6px",color:ut>0?P.text:P.muted}}>{ut>0?`฿${fmt(ut)}`:"-"}</td>
                  <td style={{textAlign:"right",padding:"10px 6px",fontWeight:700}}>฿{fmt(payTotal(p))}</td>
                  <td style={{textAlign:"center",padding:"10px 6px"}}><span style={{fontSize:10,fontWeight:600,color:s.color,background:s.bg,padding:"2px 8px",borderRadius:6}}>{s.label}</span></td>
                </tr>
              );})}
            </tbody>
            <tfoot><tr style={{borderTop:`2px solid ${P.border}`}}>
              <td style={{padding:"10px 6px",fontWeight:700}}>รวมทั้งหมด</td>
              <td></td>
              <td style={{textAlign:"right",padding:"10px 6px",fontWeight:700}}>฿{fmt(data.reduce((s,d)=>s+d.payment.amount,0))}</td>
              <td style={{textAlign:"right",padding:"10px 6px",fontWeight:700}}>฿{fmt(data.reduce((s,d)=>s+(d.payment.water||0)+(d.payment.electric||0),0))}</td>
              <td style={{textAlign:"right",padding:"10px 6px",fontWeight:700,color:P.accent}}>฿{fmt(totalExpected)}</td>
              <td style={{textAlign:"center",padding:"10px 6px",fontSize:11,color:P.green,fontWeight:600}}>{totalExpected>0?Math.round(totalCollected/totalExpected*100):0}%</td>
            </tr></tfoot>
          </table>
        </div>
      </div>

      {data.length===0&&<div style={{textAlign:"center",padding:40,color:P.muted}}><div style={{fontSize:28,marginBottom:8}}>📭</div>ไม่มีข้อมูลเดือนนี้</div>}
    </div>
  );
}

// ===== DASHBOARD =====
function Dashboard({tenants,totalRent,paidMonth,overdueAmt,overdueCnt,notifications,onViewTenants,onViewNotifs,onViewReport,onSelect,onLoadDemo}){
  if(tenants.length===0) return(
    <div style={{animation:"fadeIn .3s ease",textAlign:"center",padding:"60px 20px"}}>
      <div style={{fontSize:48,marginBottom:16}}>🏠</div>
      <div style={{fontSize:18,fontWeight:700,marginBottom:8}}>ยินดีต้อนรับ!</div>
      <div style={{fontSize:14,color:P.muted,marginBottom:24}}>เริ่มต้นใช้งานโดยเพิ่มผู้เช่ารายแรก</div>
      <button onClick={onViewTenants} style={{...btnP,margin:"0 auto",justifyContent:"center"}}><Icon d={II.plus} size={16} color="#fff"/> เพิ่มผู้เช่า</button>
      <button onClick={onLoadDemo} style={{background:"none",border:`1px solid ${P.border}`,borderRadius:10,padding:"10px 20px",color:P.muted,fontSize:13,cursor:"pointer",marginTop:12,display:"block",margin:"12px auto 0"}}>หรือ โหลดข้อมูลตัวอย่างดูก่อน</button>
    </div>
  );
  return(
    <div style={{animation:"fadeIn .3s ease"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:20}}>
        <div style={{...cardS,background:P.accentSoft,borderColor:"transparent"}}><div style={{display:"flex",justifyContent:"space-between"}}><div><div style={{fontSize:11,color:P.muted,marginBottom:4}}>ค่าเช่ารวม/เดือน</div><div style={{fontSize:22,fontWeight:700,color:P.accent}}>฿{fmt(totalRent)}</div></div><div style={{opacity:.4}}><Icon d={II.dollar} size={20} color={P.accent}/></div></div></div>
        <div style={{...cardS,background:P.greenSoft,borderColor:"transparent"}}><div style={{display:"flex",justifyContent:"space-between"}}><div><div style={{fontSize:11,color:P.muted,marginBottom:4}}>เก็บได้เดือนนี้</div><div style={{fontSize:22,fontWeight:700,color:P.green}}>฿{fmt(paidMonth)}</div></div><div style={{opacity:.4}}><Icon d={II.check} size={20} color={P.green}/></div></div></div>
        <div style={{...cardS,background:P.redSoft,borderColor:"transparent"}}><div style={{display:"flex",justifyContent:"space-between"}}><div><div style={{fontSize:11,color:P.muted,marginBottom:4}}>ค้างชำระทั้งหมด</div><div style={{fontSize:22,fontWeight:700,color:P.red}}>฿{fmt(overdueAmt)}</div><div style={{fontSize:11,color:P.muted,marginTop:2}}>{overdueCnt} ราย</div></div><div style={{opacity:.4}}><Icon d={II.clock} size={20} color={P.red}/></div></div></div>
        <div style={{...cardS,background:P.yellowSoft,borderColor:"transparent"}}><div style={{display:"flex",justifyContent:"space-between"}}><div><div style={{fontSize:11,color:P.muted,marginBottom:4}}>ผู้เช่าทั้งหมด</div><div style={{fontSize:22,fontWeight:700,color:P.yellow}}>{tenants.length}</div></div><div style={{opacity:.4}}><Icon d={II.users} size={20} color={P.yellow}/></div></div></div>
      </div>
      <div style={{...cardS,marginTop:16}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><span style={{fontSize:13,color:P.muted}}>อัตราเก็บค่าเช่าเดือนนี้</span><span style={{fontSize:14,fontWeight:700,color:P.green}}>{totalRent>0?Math.round(paidMonth/totalRent*100):0}%</span></div><div style={{height:8,background:P.input,borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:`${totalRent>0?paidMonth/totalRent*100:0}%`,background:`linear-gradient(90deg,${P.accent},${P.green})`,borderRadius:4,transition:"width .8s"}}/></div></div>
      {notifications.filter(n=>["overdue","contract","advance"].includes(n.type)).length>0&&(<div style={{marginTop:16}}><h3 style={{fontSize:14,fontWeight:600,marginBottom:10,color:P.muted}}>⚡ ต้องดำเนินการ</h3>{notifications.filter(n=>["overdue","contract","advance"].includes(n.type)).slice(0,4).map(n=>(<button key={n.id} onClick={()=>onSelect(tenants.find(t=>t.id===n.tenantId))} style={{...cardS,display:"flex",alignItems:"center",gap:12,cursor:"pointer",width:"100%",textAlign:"left",borderLeft:`3px solid ${n.type==="overdue"?P.red:n.type==="advance"?P.yellow:P.accent}`}}><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{n.tenant}</div><div style={{fontSize:12,color:P.muted,marginTop:2}}>{n.message}</div></div></button>))}</div>)}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginTop:20}}>
        <button onClick={onViewTenants} style={{...cardS,cursor:"pointer",textAlign:"center"}}><Icon d={II.users} size={22} color={P.accent}/><div style={{fontSize:12,fontWeight:600,marginTop:6}}>ผู้เช่า</div></button>
        <button onClick={onViewReport} style={{...cardS,cursor:"pointer",textAlign:"center"}}><Icon d={II.report} size={22} color={P.green}/><div style={{fontSize:12,fontWeight:600,marginTop:6}}>รายงาน</div></button>
        <button onClick={onViewNotifs} style={{...cardS,cursor:"pointer",textAlign:"center"}}><Icon d={II.bell} size={22} color={P.yellow}/><div style={{fontSize:12,fontWeight:600,marginTop:6}}>แจ้งเตือน</div></button>
      </div>
    </div>
  );
}

// ===== TENANT LIST =====
function TenantList({tenants,sq,setSq,fs,setFs,onSelect,onAdd}){
  const filtered=tenants.filter(t=>{const ms=t.name.includes(sq)||t.property.includes(sq);if(fs==="all")return ms;const hasStatus=t.payments.some(p=>p.status===fs);return ms&&hasStatus;});
  return(
    <div style={{animation:"fadeIn .3s ease",marginTop:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h2 style={{fontSize:18,fontWeight:700,margin:0}}>ผู้เช่าทั้งหมด</h2><button onClick={onAdd} style={btnP}><Icon d={II.plus} size={16} color="#fff"/><span>เพิ่ม</span></button></div>
      <div style={{position:"relative",marginBottom:12}}><div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)"}}><Icon d={II.search} size={16} color={P.muted}/></div><input value={sq} onChange={e=>setSq(e.target.value)} placeholder="ค้นหาชื่อ หรือทรัพย์สิน..." style={{...inputS,paddingLeft:38}}/></div>
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>{[{key:"all",label:"ทั้งหมด"},{key:"paid",label:"ชำระแล้ว"},{key:"pending",label:"รอชำระ"},{key:"overdue",label:"ค้างชำระ"}].map(f=>(<button key={f.key} onClick={()=>setFs(f.key)} style={{padding:"6px 14px",borderRadius:20,border:`1px solid ${fs===f.key?P.accent:P.border}`,background:fs===f.key?P.accentSoft:"transparent",color:fs===f.key?P.accent:P.muted,fontSize:12,fontWeight:600,cursor:"pointer"}}>{f.label}</button>))}</div>
      {filtered.map((t,i)=>{const od=t.payments.filter(p=>p.status==="overdue").length;const pd=t.payments.filter(p=>p.status==="pending").length;const statusLabel=od>0?{label:`ค้าง ${od} ด.`,color:P.red,bg:"#450a0a"}:pd>0?{label:"รอชำระ",color:P.yellow,bg:"#422006"}:{label:"ปกติ",color:P.green,bg:"#052e16"};return(
        <button key={t.id} onClick={()=>onSelect(t)} style={{...cardS,display:"flex",alignItems:"center",gap:14,cursor:"pointer",width:"100%",textAlign:"left",animation:`slideUp .3s ease ${i*0.05}s both`}}>
          <div style={{width:44,height:44,borderRadius:12,background:P.accentSoft,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:18}}>{t.type==="condo"?"🏢":t.type==="house"?"🏠":t.type==="commercial"?"🏪":"🏗️"}</div>
          <div style={{flex:1,minWidth:0}}><div style={{fontSize:14,fontWeight:600,marginBottom:2}}>{t.name}</div><div style={{fontSize:12,color:P.muted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.property}</div></div>
          <div style={{textAlign:"right",flexShrink:0}}><div style={{fontSize:14,fontWeight:700}}>฿{fmt(t.rentAmount)}</div><span style={{fontSize:11,fontWeight:600,color:statusLabel.color,background:statusLabel.bg,padding:"2px 8px",borderRadius:6,display:"inline-block",marginTop:2}}>{statusLabel.label}</span></div>
        </button>
      );})}
      {filtered.length===0&&<div style={{textAlign:"center",padding:40,color:P.muted}}><div style={{fontSize:32,marginBottom:8}}>🔍</div>ไม่พบผู้เช่า</div>}
    </div>
  );
}

// ===== TENANT DETAIL =====
function TenantDetail({tenant:t,settings,onBack,onMarkPaid,onDelete,onOpenMsg,onSaveSlip,onUpdateDocs,onPreview,onAddPayment,onDeletePayment,onEditTenant,onUpdatePayment}){
  const [showAddPay,setShowAddPay]=useState(false);
  const [showEdit,setShowEdit]=useState(false);
  const [editUtils,setEditUtils]=useState(null); // payment id being edited
  const [uWater,setUWater]=useState("0");
  const [uElec,setUElec]=useState("0");
  const [newMonth,setNewMonth]=useState(()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;});
  const [newAmt,setNewAmt]=useState(String(t.rentAmount));
  const [newNote,setNewNote]=useState("");
  const [ef,setEf]=useState({name:t.name,phone:t.phone,contactType:t.contactType||"line",contactId:t.contactId||"",property:t.property,type:t.type,rentAmount:String(t.rentAmount),depositAmount:String(t.depositAmount),depositPaid:t.depositPaid,advanceRent:String(t.advanceRent),advanceRentPaid:t.advanceRentPaid,contractStart:t.contractStart,contractEnd:t.contractEnd,dueDay:String(t.dueDay),manager:t.manager||"",collector:t.collector||""});
  const setE=(k,v)=>setEf(p=>({...p,[k]:v}));
  const dl=Math.ceil((new Date(t.contractEnd)-new Date())/864e5);
  const docs=t.documents||{contractFile:null,photos:[]};
  const lp=t.payments[t.payments.length-1];
  const showOverdue=t.payments.some(p=>p.status==="overdue");
  const showPending=t.payments.some(p=>p.status==="pending");

  const handleAddPay=()=>{if(!newMonth)return;if(t.payments.find(p=>p.month===newMonth)){alert("เดือนนี้มีรายการอยู่แล้ว");return;}onAddPayment({id:uid(),month:newMonth,amount:+newAmt||t.rentAmount,water:0,electric:0,date:null,status:"pending",slip:null,note:newNote});setShowAddPay(false);setNewNote("");};
  const handleSaveEdit=()=>{onEditTenant({name:ef.name,phone:ef.phone,contactType:ef.contactType,contactId:ef.contactId,property:ef.property,type:ef.type,rentAmount:+ef.rentAmount,depositAmount:+ef.depositAmount||+ef.rentAmount*2,depositPaid:ef.depositPaid,advanceRent:+ef.advanceRent||+ef.rentAmount,advanceRentPaid:ef.advanceRentPaid,contractStart:ef.contractStart,contractEnd:ef.contractEnd,dueDay:+ef.dueDay,manager:ef.manager,collector:ef.collector});setShowEdit(false);};
  const startEditUtils=(p)=>{setEditUtils(p.id);setUWater(String(p.water||0));setUElec(String(p.electric||0));};
  const saveUtils=(pid)=>{onUpdatePayment(pid,{water:+uWater||0,electric:+uElec||0});setEditUtils(null);};

  return(
    <div style={{animation:"fadeIn .3s ease",marginTop:16}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:P.accent,fontSize:13,fontWeight:600,cursor:"pointer",padding:0,marginBottom:16,display:"flex",alignItems:"center",gap:6}}><Icon d={II.back} size={16} color={P.accent}/> กลับ</button>

      {!showEdit?(
        <div style={{...cardS,borderColor:P.accent}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div><h2 style={{fontSize:18,fontWeight:700,margin:0}}>{t.name}</h2><p style={{fontSize:13,color:P.muted,margin:"4px 0 0"}}>{t.property}</p></div>
            <button onClick={()=>setShowEdit(true)} style={{...smallBtn(P.accent,P.accentSoft),padding:"4px 8px"}}><Icon d={II.edit} size={14} color={P.accent}/> แก้ไข</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:16}}>
            <IC label="โทรศัพท์" value={t.phone}/><IC label={t.contactType==="wechat"?"WeChat":"LINE"} value={t.contactId}/>
            <IC label="ค่าเช่า/เดือน" value={`฿${fmt(t.rentAmount)}`} hl/><IC label="กำหนดชำระ" value={`วันที่ ${t.dueDay}`}/>
            <IC label="เงินมัดจำ" value={`฿${fmt(t.depositAmount)}`} st={t.depositPaid?"paid":"pending"}/><IC label="ค่าเช่าล่วงหน้า" value={`฿${fmt(t.advanceRent)}`} st={t.advanceRentPaid?"paid":"pending"}/>
            <IC label="เริ่มสัญญา" value={fmtDate(t.contractStart)}/><IC label="สิ้นสุดสัญญา" value={fmtDate(t.contractEnd)} warn={dl<=60} sub={dl>0?`เหลือ ${dl} วัน`:"หมดอายุแล้ว"}/>
            <IC label="👤 ผู้รับผิดชอบ" value={t.manager||"-"}/><IC label="💰 ผู้รับค่าเช่า" value={t.collector||"-"}/>
          </div>
        </div>
      ):(
        <div style={{...cardS,borderColor:P.yellow}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><h3 style={{fontSize:15,fontWeight:700,margin:0}}>✏️ แก้ไขข้อมูล</h3><button onClick={()=>setShowEdit(false)} style={{background:"none",border:"none",cursor:"pointer"}}><Icon d={II.x} size={18} color={P.muted}/></button></div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <Fld label="ชื่อ" value={ef.name} onChange={v=>setE("name",v)} ph=""/>
            <Fld label="เบอร์โทร" value={ef.phone} onChange={v=>setE("phone",v)} ph=""/>
            <div><label style={{fontSize:12,color:P.muted,marginBottom:4,display:"block"}}>ช่องทางติดต่อ</label><div style={{display:"flex",gap:8}}>{[{key:"line",label:"LINE",emoji:"💚"},{key:"wechat",label:"WeChat",emoji:"💬"}].map(opt=>(<button key={opt.key} onClick={()=>setE("contactType",opt.key)} style={{flex:1,padding:"8px 0",borderRadius:10,border:`1px solid ${ef.contactType===opt.key?P.accent:P.border}`,background:ef.contactType===opt.key?P.accentSoft:"transparent",color:ef.contactType===opt.key?P.accent:P.muted,fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>{opt.emoji} {opt.label}</button>))}</div></div>
            <Fld label={ef.contactType==="wechat"?"WeChat ID":"LINE ID"} value={ef.contactId} onChange={v=>setE("contactId",v)} ph=""/>
            <div><label style={{fontSize:12,color:P.muted,marginBottom:4,display:"block"}}>ประเภท</label><select value={ef.type} onChange={e=>setE("type",e.target.value)} style={inputS}><option value="condo">คอนโด</option><option value="house">บ้าน/ทาวน์โฮม</option><option value="commercial">อาคารพาณิชย์</option><option value="land">ที่ดิน</option></select></div>
            <Fld label="ทรัพย์สิน/ห้อง" value={ef.property} onChange={v=>setE("property",v)} ph=""/>
            <Fld label="ค่าเช่า/เดือน" value={ef.rentAmount} onChange={v=>setE("rentAmount",v)} type="number"/>
            <Fld label="เงินมัดจำ" value={ef.depositAmount} onChange={v=>setE("depositAmount",v)} type="number"/>
            <label style={{fontSize:13,display:"flex",alignItems:"center",gap:6,cursor:"pointer"}}><input type="checkbox" checked={ef.depositPaid} onChange={e=>setE("depositPaid",e.target.checked)}/> เก็บมัดจำแล้ว</label>
            <Fld label="ค่าเช่าล่วงหน้า" value={ef.advanceRent} onChange={v=>setE("advanceRent",v)} type="number"/>
            <label style={{fontSize:13,display:"flex",alignItems:"center",gap:6,cursor:"pointer"}}><input type="checkbox" checked={ef.advanceRentPaid} onChange={e=>setE("advanceRentPaid",e.target.checked)}/> เก็บค่าเช่าล่วงหน้าแล้ว</label>
            <Fld label="กำหนดชำระวันที่" value={ef.dueDay} onChange={v=>setE("dueDay",v)} type="number"/>
            <Fld label="เริ่มสัญญา" value={ef.contractStart} onChange={v=>setE("contractStart",v)} type="date"/>
            <Fld label="สิ้นสุดสัญญา" value={ef.contractEnd} onChange={v=>setE("contractEnd",v)} type="date"/>
            <Fld label="👤 ผู้รับผิดชอบ" value={ef.manager} onChange={v=>setE("manager",v)} ph="เช่น มิ้ง, พี่แจ๋ว"/>
            <Fld label="💰 ผู้รับค่าเช่า" value={ef.collector} onChange={v=>setE("collector",v)} ph="เช่น มิ้ง, คุณพ่อ"/>
          </div>
          <button onClick={handleSaveEdit} style={{...btnP,width:"100%",justifyContent:"center",marginTop:14}}><Icon d={II.check} size={16} color="#fff"/> บันทึก</button>
        </div>
      )}

      {/* Actions */}
      <div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap"}}>
        {showOverdue&&<button onClick={()=>onOpenMsg("overdue")} style={{...smallBtn(P.red,P.redSoft),flex:1,justifyContent:"center"}}><Icon d={II.msg} size={14} color={P.red}/> สร้างข้อความทวง</button>}
        {showPending&&<button onClick={()=>onOpenMsg("reminder")} style={{...smallBtn(P.yellow,P.yellowSoft),flex:1,justifyContent:"center"}}><Icon d={II.msg} size={14} color={P.yellow}/> แจ้งเตือน</button>}
        <button onClick={()=>onOpenMsg("receipt")} style={{...smallBtn(P.green,P.greenSoft),justifyContent:"center"}}><Icon d={II.msg} size={14} color={P.green}/> ยืนยัน</button>
        <button onClick={()=>{if(confirm("ลบผู้เช่านี้?"))onDelete();}} style={{...btnIcon,borderColor:P.red}}><Icon d={II.trash} size={16} color={P.red}/></button>
      </div>

      {/* Documents */}
      <div style={{marginTop:24}}>
        <h3 style={{fontSize:15,fontWeight:700,marginBottom:12}}>📁 เอกสารและรูปถ่าย</h3>
        <div style={cardS}>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:12,color:P.muted,marginBottom:8,display:"flex",alignItems:"center",gap:4}}><Icon d={II.file} size={14} color={P.muted}/> ไฟล์สัญญาเช่า</div>
            {docs.contractFile?(<div style={{display:"flex",alignItems:"center",gap:8}}><button onClick={()=>{if(docs.contractFile.isImage)onPreview(docs.contractFile.data,docs.contractFile.name);else{const a=document.createElement("a");a.href=docs.contractFile.data;a.download=docs.contractFile.name;a.click();}}} style={{...smallBtn(P.accent,P.accentSoft),flex:1}}><Icon d={docs.contractFile.isImage?II.image:II.file} size={14} color={P.accent}/> {docs.contractFile.name}</button><button onClick={()=>onUpdateDocs({...docs,contractFile:null})} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><Icon d={II.x} size={16} color={P.red}/></button></div>):(<FilePicker accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.heic" onFile={f=>onUpdateDocs({...docs,contractFile:f})} style={{...smallBtn(P.accent,P.accentSoft),width:"100%",justifyContent:"center"}}><Icon d={II.upload} size={14} color={P.accent}/> <span style={{marginLeft:4}}>เลือกไฟล์สัญญา</span></FilePicker>)}
          </div>
          <div>
            <div style={{fontSize:12,color:P.muted,marginBottom:8,display:"flex",alignItems:"center",gap:4}}><Icon d={II.camera} size={14} color={P.muted}/> รูปถ่ายก่อนส่งมอบ ({docs.photos?.length||0} รูป)</div>
            {docs.photos?.length>0&&(<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:10}}>{docs.photos.map((ph,i)=>(<div key={i} style={{position:"relative",borderRadius:10,overflow:"hidden",aspectRatio:"1",background:P.input}}>{ph.isImage?<img src={ph.data} alt={ph.name} onClick={()=>onPreview(ph.data,ph.name)} style={{width:"100%",height:"100%",objectFit:"cover",cursor:"pointer"}}/>:<div onClick={()=>onPreview(ph.data,ph.name)} style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",gap:4}}><Icon d={II.file} size={24} color={P.muted}/><span style={{fontSize:10,color:P.muted,textAlign:"center",padding:"0 4px",wordBreak:"break-all"}}>{ph.name}</span></div>}<button onClick={()=>onUpdateDocs({...docs,photos:docs.photos.filter((_,j)=>j!==i)})} style={{position:"absolute",top:4,right:4,width:22,height:22,borderRadius:"50%",background:"rgba(0,0,0,0.6)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon d={II.x} size={12} color="#fff"/></button></div>))}</div>)}
            <FilePicker accept="image/*,.heic" multiple onFile={files=>onUpdateDocs({...docs,photos:[...(docs.photos||[]),...files]})} style={{...smallBtn(P.accent,P.accentSoft),width:"100%",justifyContent:"center"}}><Icon d={II.camera} size={14} color={P.accent}/> <span style={{marginLeft:4}}>ถ่ายรูป / เลือกรูป</span></FilePicker>
          </div>
        </div>
      </div>

      {/* Payments */}
      <div style={{marginTop:24}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><h3 style={{fontSize:15,fontWeight:700,margin:0}}>📋 ประวัติการชำระ</h3><button onClick={()=>setShowAddPay(!showAddPay)} style={smallBtn(P.accent,P.accentSoft)}><Icon d={showAddPay?II.x:II.plus} size={14} color={P.accent}/> {showAddPay?"ยกเลิก":"เพิ่มรอบ"}</button></div>
        {showAddPay&&(<div style={{...cardS,borderColor:P.accent,background:P.accentSoft}}><div style={{fontSize:13,fontWeight:600,marginBottom:10}}>➕ เพิ่มรอบเก็บค่าเช่า</div><div style={{display:"flex",flexDirection:"column",gap:8}}><div><label style={{fontSize:12,color:P.muted,marginBottom:4,display:"block"}}>เดือน/ปี</label><input type="month" value={newMonth} onChange={e=>setNewMonth(e.target.value)} style={inputS}/></div><Fld label="จำนวนเงิน" value={newAmt} onChange={v=>setNewAmt(v)} ph={String(t.rentAmount)} type="number"/><Fld label="หมายเหตุ" value={newNote} onChange={v=>setNewNote(v)} ph=""/><button onClick={handleAddPay} style={{...btnP,justifyContent:"center"}}><Icon d={II.check} size={16} color="#fff"/> เพิ่ม</button></div></div>)}
        {t.payments.length===0&&!showAddPay&&<div style={{textAlign:"center",padding:30,color:P.muted}}><div style={{fontSize:28,marginBottom:8}}>📭</div><div style={{fontSize:13}}>ยังไม่มีรายการ กดเพิ่มรอบเก็บ</div></div>}

        {[...t.payments].reverse().map(p=>{
          const s=statusMap[p.status];const ut=(p.water||0)+(p.electric||0);const total=payTotal(p);
          return(
            <div key={p.id} style={{...cardS,display:"flex",flexDirection:"column",gap:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:14,fontWeight:600}}>{thaiMonth(p.month)}</div>
                  <div style={{fontSize:12,color:P.muted}}>{p.date?`ชำระ ${fmtDate(p.date)}`:"ยังไม่ชำระ"}</div>
                  {p.note&&<div style={{fontSize:11,color:P.yellow,marginTop:2}}>📝 {p.note}</div>}
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:15,fontWeight:700}}>฿{fmt(total)}</div>
                  <span style={{fontSize:11,fontWeight:600,color:s.color,background:s.bg,padding:"2px 8px",borderRadius:6,display:"inline-block",marginTop:2}}>{s.label}</span>
                </div>
              </div>

              {/* Utility breakdown */}
              {(ut>0||editUtils===p.id)&&editUtils!==p.id&&(
                <div style={{fontSize:11,color:P.muted,display:"flex",gap:12,flexWrap:"wrap",paddingTop:4,borderTop:`1px solid ${P.border}`}}>
                  <span>💰 เช่า ฿{fmt(p.amount)}</span>
                  {p.water>0&&<span>💧 น้ำ ฿{fmt(p.water)}</span>}
                  {p.electric>0&&<span>⚡ ไฟ ฿{fmt(p.electric)}</span>}
                </div>
              )}

              {/* Edit utilities inline */}
              {editUtils===p.id&&(
                <div style={{paddingTop:8,borderTop:`1px solid ${P.border}`,display:"flex",flexDirection:"column",gap:6}}>
                  <div style={{fontSize:12,fontWeight:600,color:P.accent}}>💧⚡ ค่าน้ำ/ค่าไฟ</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                    <div><label style={{fontSize:10,color:P.muted}}>💧 ค่าน้ำ</label><input value={uWater} onChange={e=>setUWater(e.target.value)} type="number" style={{...inputS,fontSize:12,padding:"6px 8px"}}/></div>
                    <div><label style={{fontSize:10,color:P.muted}}>⚡ ค่าไฟ</label><input value={uElec} onChange={e=>setUElec(e.target.value)} type="number" style={{...inputS,fontSize:12,padding:"6px 8px"}}/></div>
                  </div>
                  <div style={{display:"flex",gap:6}}><button onClick={()=>saveUtils(p.id)} style={smallBtn(P.green,P.greenSoft)}><Icon d={II.check} size={12} color={P.green}/> บันทึก</button><button onClick={()=>setEditUtils(null)} style={smallBtn(P.muted,"transparent")}><Icon d={II.x} size={12} color={P.muted}/> ยกเลิก</button></div>
                </div>
              )}

              <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                {p.status!=="paid"&&<button onClick={()=>onMarkPaid(p.id)} style={smallBtn(P.green,P.greenSoft)}><Icon d={II.check} size={14} color={P.green}/> ยืนยัน</button>}
                {editUtils!==p.id&&<button onClick={()=>startEditUtils(p)} style={smallBtn(P.accent,P.accentSoft)}><span>💧⚡</span> ค่าน้ำ/ไฟ</button>}
                {p.slip?(<button onClick={()=>{if(p.slip.isImage)onPreview(p.slip.data,p.slip.name);else{const a=document.createElement("a");a.href=p.slip.data;a.download=p.slip.name;a.click();}}} style={smallBtn(P.accent,P.accentSoft)}>{p.slip.isImage?<img src={p.slip.data} alt="slip" style={{width:20,height:20,borderRadius:3,objectFit:"cover"}}/>:<Icon d={II.file} size={14} color={P.accent}/>}<span> สลิป</span></button>):(<FilePicker accept="image/*,.pdf,.heic" onFile={f=>onSaveSlip(p.id,f)} style={smallBtn(P.muted,"transparent")}><Icon d={II.upload} size={14} color={P.muted}/> <span style={{marginLeft:2}}>สลิป</span></FilePicker>)}
                <button onClick={()=>{if(confirm(`ลบ ${thaiMonth(p.month)}?`))onDeletePayment(p.id);}} style={{background:"none",border:"none",cursor:"pointer",padding:4,marginLeft:"auto"}}><Icon d={II.trash} size={14} color={P.muted}/></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===== NOTIFICATIONS =====
function NotificationView({notifications,tenants,onSelect,onOpenMsg}){
  const overdue=notifications.filter(n=>n.type==="overdue"),pending=notifications.filter(n=>n.type==="pending"),contracts=notifications.filter(n=>n.type==="contract"),advances=notifications.filter(n=>n.type==="advance");
  return(
    <div style={{animation:"fadeIn .3s ease",marginTop:16}}>
      <h2 style={{fontSize:18,fontWeight:700,marginBottom:16}}>🔔 การแจ้งเตือน</h2>
      {notifications.length===0&&<div style={{textAlign:"center",padding:60,color:P.muted}}><div style={{fontSize:48,marginBottom:12}}>🎉</div><div style={{fontSize:16,fontWeight:600}}>ไม่มีรายการแจ้งเตือน</div></div>}
      {overdue.length>0&&<NS title="🚨 ค้างชำระ" items={overdue} color={P.red} onSelect={onSelect} onMsg={tid=>onOpenMsg(tid,"overdue")} msgLabel="สร้างข้อความทวง"/>}
      {advances.length>0&&<NS title="⚠️ ค่าเช่าล่วงหน้ายังไม่เก็บ" items={advances} color={P.yellow} onSelect={onSelect}/>}
      {pending.length>0&&<NS title="⏰ ใกล้กำหนดชำระ" items={pending} color={P.yellow} onSelect={onSelect} onMsg={tid=>onOpenMsg(tid,"reminder")} msgLabel="แจ้งเตือน"/>}
      {contracts.length>0&&<NS title="📄 สัญญาใกล้หมดอายุ" items={contracts} color={P.accent} onSelect={onSelect}/>}
    </div>
  );
}
function NS({title,items,color,onSelect,onMsg,msgLabel}){return(<div style={{marginBottom:20}}><h3 style={{fontSize:14,fontWeight:600,color,marginBottom:10}}>{title}</h3>{items.map(n=>(<div key={n.id} style={{...cardS,borderLeft:`3px solid ${color}`}}><button onClick={()=>onSelect(n.tenantId)} style={{background:"none",border:"none",color:P.text,cursor:"pointer",padding:0,width:"100%",textAlign:"left"}}><div style={{fontSize:14,fontWeight:600}}>{n.tenant}</div><div style={{fontSize:12,color:P.muted,marginTop:2}}>{n.message}</div><div style={{fontSize:11,color:P.muted,marginTop:2}}>{n.property}</div></button>{onMsg&&<button onClick={()=>onMsg(n.tenantId)} style={{...smallBtn(color,"transparent"),marginTop:8,fontSize:11}}><Icon d={II.copy} size={12} color={color}/> {msgLabel}</button>}</div>))}</div>);}

// ===== ADD TENANT MODAL =====
function AddTenantModal({onClose,onAdd}){
  const [f,sF]=useState({name:"",phone:"",contactType:"line",contactId:"",property:"",type:"condo",rentAmount:"",depositAmount:"",depositPaid:false,advanceRent:"",advanceRentPaid:false,contractStart:"",contractEnd:"",dueDay:"5",manager:"",collector:""});
  const set=(k,v)=>sF(p=>({...p,[k]:v}));
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center",animation:"fadeIn .2s ease"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:P.bg,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:500,maxHeight:"85vh",overflow:"auto",padding:24,animation:"slideUp .3s ease"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><h2 style={{fontSize:18,fontWeight:700,margin:0}}>เพิ่มผู้เช่าใหม่</h2><button onClick={onClose} style={btnIcon}><Icon d={II.x} size={18}/></button></div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Fld label="ชื่อผู้เช่า *" value={f.name} onChange={v=>set("name",v)} ph="คุณ..."/>
          <Fld label="เบอร์โทร" value={f.phone} onChange={v=>set("phone",v)} ph="08x-xxx-xxxx"/>
          <div><label style={{fontSize:12,color:P.muted,marginBottom:4,display:"block"}}>ช่องทางติดต่อ</label><div style={{display:"flex",gap:8}}>{[{key:"line",label:"LINE",emoji:"💚"},{key:"wechat",label:"WeChat",emoji:"💬"}].map(opt=>(<button key={opt.key} onClick={()=>set("contactType",opt.key)} style={{flex:1,padding:"10px 0",borderRadius:10,border:`1px solid ${f.contactType===opt.key?P.accent:P.border}`,background:f.contactType===opt.key?P.accentSoft:"transparent",color:f.contactType===opt.key?P.accent:P.muted,fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>{opt.emoji} {opt.label}</button>))}</div></div>
          <Fld label={f.contactType==="wechat"?"WeChat ID":"LINE ID"} value={f.contactId} onChange={v=>set("contactId",v)} ph={f.contactType==="wechat"?"wechat_id":"@line_id"}/>
          <div><label style={{fontSize:12,color:P.muted,marginBottom:4,display:"block"}}>ประเภท</label><select value={f.type} onChange={e=>set("type",e.target.value)} style={inputS}><option value="condo">คอนโด</option><option value="house">บ้าน/ทาวน์โฮม</option><option value="commercial">อาคารพาณิชย์</option><option value="land">ที่ดิน</option></select></div>
          <Fld label="ทรัพย์สิน/ห้อง *" value={f.property} onChange={v=>set("property",v)} ph="ชื่อโครงการ..."/>
          <Fld label="ค่าเช่า/เดือน (บาท) *" value={f.rentAmount} onChange={v=>set("rentAmount",v)} ph="15000" type="number"/>
          <Fld label="เงินมัดจำ (บาท)" value={f.depositAmount} onChange={v=>set("depositAmount",v)} ph="ค่าเช่า x 2" type="number"/>
          <label style={{fontSize:13,display:"flex",alignItems:"center",gap:6,cursor:"pointer"}}><input type="checkbox" checked={f.depositPaid} onChange={e=>set("depositPaid",e.target.checked)}/> เก็บมัดจำแล้ว</label>
          <Fld label="ค่าเช่าล่วงหน้า (บาท)" value={f.advanceRent} onChange={v=>set("advanceRent",v)} ph="= ค่าเช่า" type="number"/>
          <label style={{fontSize:13,display:"flex",alignItems:"center",gap:6,cursor:"pointer"}}><input type="checkbox" checked={f.advanceRentPaid} onChange={e=>set("advanceRentPaid",e.target.checked)}/> เก็บค่าเช่าล่วงหน้าแล้ว</label>
          <Fld label="วันกำหนดชำระ" value={f.dueDay} onChange={v=>set("dueDay",v)} ph="5" type="number"/>
          <Fld label="เริ่มสัญญา" value={f.contractStart} onChange={v=>set("contractStart",v)} type="date"/>
          <Fld label="สิ้นสุดสัญญา" value={f.contractEnd} onChange={v=>set("contractEnd",v)} type="date"/>
          <Fld label="👤 ผู้รับผิดชอบ" value={f.manager} onChange={v=>set("manager",v)} ph="เช่น มิ้ง, พี่แจ๋ว"/>
          <Fld label="💰 ผู้รับค่าเช่า" value={f.collector} onChange={v=>set("collector",v)} ph="เช่น มิ้ง, คุณพ่อ"/>
        </div>
        <button onClick={()=>{if(!f.name||!f.property||!f.rentAmount){alert("กรุณากรอก: ชื่อ, ทรัพย์สิน, ค่าเช่า");return;}onAdd({...f,rentAmount:+f.rentAmount,depositAmount:+f.depositAmount||+f.rentAmount*2,advanceRent:+f.advanceRent||+f.rentAmount,dueDay:+f.dueDay});onClose();}} style={{...btnP,width:"100%",justifyContent:"center",marginTop:20}}><Icon d={II.check} size={16} color="#fff"/> บันทึกผู้เช่า</button>
      </div>
    </div>
  );
}
