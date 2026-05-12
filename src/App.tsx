import { useState, useMemo, useEffect, useCallback } from "react";

const API = "https://script.google.com/macros/s/AKfycbzCUVLVzXjRWSQri8XTjOrFh373mp_dU3PkCTODGPhyX1bsYNMWf1CxhS79ntUDer5IwA/exec";

const CATS_IN = ["ค่าออกแบบ", "ค่าก่อสร้าง", "ค่าที่ปรึกษา", "ค่างวดโครงการ", "รายได้อื่น ๆ"];
const CATS_EX = ["ค่าวัสดุก่อสร้าง", "ค่าแรงงาน", "ค่าเช่าเครื่องจักร", "ค่าสาธารณูปโภค", "เงินเดือนพนักงาน", "ค่าซอฟต์แวร์/ใบอนุญาต", "ค่าการตลาด", "ค่าเดินทาง", "ค่าใช้จ่ายอื่น ๆ"];

const fmt = (n: number) => new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2 }).format(n);
const fmtDate = (d: string) => { if (!d) return ""; return new Date(d).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" }); };
const today = () => new Date().toISOString().slice(0, 10);

async function apiGet(action: string, params: Record<string,string> = {}) {
  const url = new URL(API);
  url.searchParams.set("action", action);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  return res.json();
}

async function apiPost(action: string, body: object = {}) {
  const url = new URL(API);
  url.searchParams.set("action", action);
  const res = await fetch(url.toString(), { method: "POST", body: JSON.stringify(body) });
  return res.json();
}

function Donut({ income, expense }: { income: number; expense: number }) {
  const total = income + expense;
  if (total === 0) return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:160, color:"#bbb", fontSize:13 }}>ยังไม่มีข้อมูล</div>;
  const r=60, cx=75, cy=75, sw=20, circ=2*Math.PI*r;
  const incPct=income/total, incDash=circ*incPct, expDash=circ*(1-incPct);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:20 }}>
      <svg width={150} height={150} style={{ flexShrink:0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f0f4ff" strokeWidth={sw}/>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ef5350" strokeWidth={sw} strokeDasharray={`${expDash} ${circ}`} strokeDashoffset={0} transform={`rotate(-90 ${cx} ${cy})`}/>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#43a047" strokeWidth={sw} strokeDasharray={`${incDash} ${circ}`} strokeDashoffset={-expDash} transform={`rotate(-90 ${cx} ${cy})`}/>
        <text x={cx} y={cy-8} textAnchor="middle" fontSize={10} fill="#999" fontFamily="Sarabun">สุทธิ</text>
        <text x={cx} y={cy+9} textAnchor="middle" fontSize={12} fontWeight="700" fill={income>=expense?"#2e7d32":"#c62828"} fontFamily="Sarabun">
          {income>=expense?"+":"-"}฿{fmt(Math.abs(income-expense))}
        </text>
      </svg>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {[{label:"รายรับ",val:income,pct:incPct,color:"#2e7d32",dot:"#43a047"},{label:"รายจ่าย",val:expense,pct:1-incPct,color:"#c62828",dot:"#ef5350"}].map(x=>(
          <div key={x.label}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
              <div style={{ width:10, height:10, borderRadius:3, background:x.dot }}/>
              <span style={{ fontSize:12, color:"#666" }}>{x.label}</span>
            </div>
            <div style={{ fontWeight:700, fontSize:14, color:x.color }}>฿{fmt(x.val)}</div>
            <div style={{ fontSize:11, color:"#aaa" }}>{(x.pct*100).toFixed(1)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ entries }: { entries: any[] }) {
  const months = useMemo(()=>{
    const map: Record<string,{income:number,expense:number}> = {};
    entries.forEach(e=>{ const m=String(e.date).slice(0,7); if(!map[m]) map[m]={income:0,expense:0}; map[m][e.type as "income"|"expense"]+=e.amount; });
    return Object.entries(map).sort(([a],[b])=>a.localeCompare(b)).slice(-6);
  },[entries]);
  if(!months.length) return <div style={{ color:"#bbb", fontSize:13, padding:"20px 0" }}>ยังไม่มีข้อมูล</div>;
  const maxVal=Math.max(...months.flatMap(([,v])=>[v.income,v.expense]),1), H=100;
  return (
    <div style={{ overflowX:"auto" }}>
      <div style={{ display:"flex", alignItems:"flex-end", gap:12, minWidth:months.length*60, padding:"4px 4px 0" }}>
        {months.map(([m,v])=>{
          const [yr,mo]=m.split("-");
          const label=new Date(+yr,+mo-1).toLocaleDateString("th-TH",{month:"short"});
          return (
            <div key={m} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
              <div style={{ display:"flex", alignItems:"flex-end", gap:3, height:H }}>
                <div style={{ width:14, height:Math.max(4,(v.income/maxVal)*H), background:"linear-gradient(to top,#2e7d32,#66bb6a)", borderRadius:"3px 3px 0 0" }}/>
                <div style={{ width:14, height:Math.max(4,(v.expense/maxVal)*H), background:"linear-gradient(to top,#c62828,#ef5350)", borderRadius:"3px 3px 0 0" }}/>
              </div>
              <div style={{ fontSize:9, color:"#aaa", whiteSpace:"nowrap" }}>{label}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display:"flex", gap:12, marginTop:10, fontSize:11, color:"#888" }}>
        {[{c:"#66bb6a",l:"รายรับ"},{c:"#ef5350",l:"รายจ่าย"}].map(x=>(
          <span key={x.l} style={{ display:"flex", alignItems:"center", gap:4 }}><span style={{ width:9, height:9, background:x.c, borderRadius:2, display:"inline-block" }}/>{x.l}</span>
        ))}
      </div>
    </div>
  );
}

interface Entry { id: number; date: string; type: string; category: string; project: string; description: string; amount: number; }
interface FormState { date: string; type: string; category: string; project: string; description: string; amount: string; }

export default function App() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [projects, setProjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [view, setView] = useState("dashboard");
  const [filterType, setFilterType] = useState("all");
  const [filterProject, setFilterProject] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [form, setForm] = useState<FormState>({ date:today(), type:"income", category:CATS_IN[0], project:"", description:"", amount:"" });
  const [editId, setEditId] = useState<number|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<number|null>(null);
  const [showProjMgr, setShowProjMgr] = useState(false);
  const [newProj, setNewProj] = useState("");
  const [toast, setToast] = useState<{msg:string,type:string}|null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [eRes, pRes] = await Promise.all([apiGet("getAll"), apiGet("getProjects")]);
      if (eRes.ok) setEntries(eRes.entries);
      if (pRes.ok) setProjects(pRes.projects);
    } catch { setError("เชื่อมต่อไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต"); }
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  function showToast(msg: string, type="ok") { setToast({msg,type}); setTimeout(()=>setToast(null),2800); }
  function openAdd() { setEditId(null); setForm({date:today(),type:"income",category:CATS_IN[0],project:projects[0]||"",description:"",amount:""}); setShowForm(true); }
  function openEdit(e: Entry) { setEditId(e.id); setForm({...e,amount:String(e.amount)}); setShowForm(true); }
  function handleTypeChange(type: string) { setForm(f=>({...f,type,category:type==="income"?CATS_IN[0]:CATS_EX[0]})); }

  async function saveEntry() {
    if (!form.description.trim()||!form.amount||isNaN(+form.amount)||+form.amount<=0) { showToast("กรุณากรอกข้อมูลให้ครบถ้วน","err"); return; }
    setSaving(true);
    try {
      const body={...form,amount:+form.amount};
      if (editId) {
        await apiPost("updateEntry",{...body,id:editId});
        setEntries(es=>es.map(e=>e.id===editId?{...body,id:editId}:e));
        showToast("แก้ไขรายการสำเร็จ");
      } else {
        const res=await apiPost("addEntry",body);
        if(res.ok) setEntries(es=>[...es,{...body,id:res.id}]);
        showToast("เพิ่มรายการสำเร็จ");
      }
      setShowForm(false);
    } catch { showToast("บันทึกไม่สำเร็จ กรุณาลองใหม่","err"); }
    setSaving(false);
  }

  async function doDelete() {
    setSaving(true);
    try { await apiGet("deleteEntry",{id:String(deleteId)}); setEntries(es=>es.filter(e=>e.id!==deleteId)); showToast("ลบรายการแล้ว","err"); }
    catch { showToast("ลบไม่สำเร็จ","err"); }
    setDeleteId(null); setSaving(false);
  }

  async function addProject() {
    if(!newProj.trim()||projects.includes(newProj.trim())) return;
    setSaving(true);
    try { await apiGet("addProject",{name:newProj.trim()}); setProjects(p=>[...p,newProj.trim()]); setNewProj(""); }
    catch { showToast("เพิ่มโครงการไม่สำเร็จ","err"); }
    setSaving(false);
  }

  async function removeProject(p: string) {
    if(entries.some(e=>e.project===p)) { showToast("ไม่สามารถลบโครงการที่มีรายการอยู่","err"); return; }
    setSaving(true);
    try { await apiGet("deleteProject",{name:p}); setProjects(ps=>ps.filter(x=>x!==p)); }
    catch { showToast("ลบโครงการไม่สำเร็จ","err"); }
    setSaving(false);
  }

  function exportCSV() {
    const rows=[["วันที่","ประเภท","หมวดหมู่","โครงการ","รายละเอียด","จำนวน"]];
    filtered.forEach(e=>rows.push([e.date,e.type==="income"?"รายรับ":"รายจ่าย",e.category,e.project,e.description,String(e.amount)]));
    const csv="\uFEFF"+rows.map(r=>r.map(c=>`"${c.replace(/"/g,'""')}"`).join(",")).join("\n");
    const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8;"}));
    a.download=`บัญชี_${today()}.csv`; a.click(); showToast("ส่งออก CSV สำเร็จ");
  }

  const totalIncome=useMemo(()=>entries.filter(e=>e.type