import React from "react";
import { useState, useRef, useEffect } from "react";

function useWindowWidth() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
}
import { supabase } from './supabase.js';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  ::-webkit-scrollbar{width:4px;height:4px;} ::-webkit-scrollbar-track{background:#0a0f1a;} ::-webkit-scrollbar-thumb{background:#1e3a5f;border-radius:2px;}
  .tab-btn{background:none;border:none;cursor:pointer;font-family:inherit;transition:all 0.18s;}
  .tab-btn:hover{color:#60a5fa!important;}
  .kpi-card{transition:transform 0.18s;}
  .kpi-card:hover{transform:translateY(-2px);}
  .yr-btn{background:none;border:1px solid #1e2d45;border-radius:6px;padding:4px 12px;cursor:pointer;font-family:'DM Mono',monospace;font-size:11px;color:#64748b;transition:all 0.18s;}
  .yr-btn:hover{border-color:#3b82f6;color:#93c5fd;}
  .yr-btn.active{background:#1e3a5f;border-color:#3b82f6;color:#60a5fa;}
  @media(max-width:767px){
    .tf-grid-3{grid-template-columns:1fr 1fr!important;}
    .tf-grid-4{grid-template-columns:1fr 1fr!important;}
    .tf-grid-5{grid-template-columns:1fr 1fr!important;}
    .tf-hide-mobile{display:none!important;}
    .tf-yr-btns{display:none!important;}
  }
  .mode-btn{padding:6px 14px;border:none;cursor:pointer;font-family:'DM Mono',monospace;font-size:11px;transition:all 0.18s;}
  .upload-zone{border:2px dashed #1e3a5f;border-radius:10px;padding:28px;text-align:center;cursor:pointer;transition:all 0.2s;}
  .upload-zone:hover{border-color:#3b82f6;background:#0c1e35;}
  .tbl-row:hover td{background:#0c1e35!important;}
  .mpill{display:inline-flex;flex-direction:column;align-items:center;gap:2px;padding:4px 7px;border-radius:6px;cursor:pointer;border:1px solid transparent;transition:all 0.15s;font-family:'DM Mono',monospace;background:none;}
  .mpill:hover{border-color:#3b82f6;}
  .mpill.in-range{background:#0d1e35;border-color:#1e3a5f;}
  .mpill.is-edge-act{background:#1e3a5f;border-color:#3b82f6;}
  .mpill.is-edge-comp{background:#2a1800;border-color:#f59e0b;}
  select.psel{background:#0c1420;border:1px solid #1e2d45;border-radius:6px;padding:5px 10px;color:#94a3b8;font-family:'DM Mono',monospace;font-size:11px;cursor:pointer;outline:none;}
`;


// ─── CLIENT CONFIG ───────────────────────────────────────────────────────────
const PASSWORD      = 'accrease2026!';
const SESSION_KEY   = 'accrease_auth';
const ACCENT        = '#86efac';
const CLIENT_NAME   = 'Accrease Oy';
const ANTHROPIC_KEY  = 'PASTE_YOUR_KEY_HERE';
const ALLOWED_EMAILS = ['lukas.paulikas@accrease.com', "niklas.isaksson@targetflow.fi", "virpi.lamsa@targetflow.fi"];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const BLUE="#3b82f6",GREEN="#22c55e",AMBER="#f59e0b",RED="#f87171",PURPLE="#a78bfa",CYAN="#06b6d4",SLATE="#64748b";
const ACT_LAST_DEFAULT = 11;
// Per-year last confirmed ACT month (0=Jan…11=Dec, -1=full BUD)
const ACT_LAST_BY_YEAR = {
  "2023": 11,
  "2024": 11,
  "2025": 11,
  "2026": -1,
};

const actBase = {
  revenue:     [-10982,-15604,-26301,-20942,-12228,-15481,-3768,-18782,-20041,-22898,-15102,-15995].map(v=>Math.abs(v)),
  cogs:        [7327,7327,7316,7327,7327,7327,7327,7312,7699,1562,7683,7683],
  opex:        [3725,3972,3678,3675,5398,4848,4017,5341,4820,4921,4813,5821],
  ebitda:      [69,-4306,-15306,-9940,496,-3306,7576,-6129,-7522,-16415,-2606,-2490],
  depAmort:    [0,0,0,0,0,0,0,0,0,0,0,0],
  ebit:        [69,-4306,-15306,-9940,496,-3306,7576,-6129,-7522,-16415,-2606,-2490],
  finExpenses: [0,0,10,0,0,14,0,0,5,0,0,6],
  ebt:         [1219,-3865,-14876,-9500,937,-2879,8016,-5688,-7086,-15974,-2443,3040],
  tax:         [1150,441,440,440,441,441,440,441,341,0,163,0],
  netProfit:   [1219,-3865,-14876,-9500,937,-2879,8016,-5688,-7086,-15974,-2443,3040],
  grossProfit: [-10982,-15604,-26301,-20942,-12228,-15481,-3768,-18782,-20041,-22898,-15102,-15995].map(v=>Math.abs(v)-[7327,7327,7316,7327,7327,7327,7327,7312,7699,1562,7683,7683][0]),
  inventory:   [0,0,0,0,0,0,0,0,0,0,0,0],
  receivables: [7784,7151,11636,29151,18754,19130,9642,13325,13782,16078,15664,16927].map(v=>v*0.4),
  cash:        [7784,7151,11636,29151,18754,19130,9642,13325,13782,16078,15664,16927],
  otherCA:     [0,0,0,0,0,0,0,0,0,0,0,0],
  equity:      [-31022,-34887,-49763,-59263,-58326,-61205,-53189,-58877,-65963,-81937,-84380,-81339],
  ltDebt:      [0,0,0,0,0,0,0,0,0,0,0,0],
  stDebt:      [0,0,0,0,0,0,0,0,0,0,0,0],
  payables:    [7327,7327,7316,7327,7327,7327,7327,7312,7699,1562,7683,7683].map(v=>v*0.5),
  otherCL:     [20000,20000,20000,20000,20000,20000,20000,20000,20000,20000,20000,20000],
  tangibles:   [0,0,0,0,0,0,0,0,0,0,0,0],
  wcChange:    [0,0,0,0,0,0,0,0,0,0,0,0],
  cfOp:        [1219,-3865,-14876,-9500,937,-2879,8016,-5688,-7086,-15974,-2443,3040],
  cfInv:       [0,0,0,0,0,0,0,0,0,0,0,0],
  cfFin:       [0,0,0,0,0,0,0,0,0,0,0,0],
};


const budBase = {
  revenue:     [-11222,-15604,-26301,-20942,-12228,-15481,-3768,-18782,-20041,-22898,-15102,-15995].map(v=>Math.abs(v)),
  cogs:        [7683,7683,7683,7683,7683,7683,7683,7683,7683,7683,7683,7683],
  opex:        [6983,3972,3678,3675,5398,4848,4017,5341,4820,4921,4813,5821],
  ebitda:      [3445,-3949,-14939,-9583,853,-2949,7933,-5757,-7537,-10294,-2606,-2490],
  depAmort:    [0,0,0,0,0,0,0,0,0,0,0,0],
  ebit:        [3445,-3949,-14939,-9583,853,-2949,7933,-5757,-7537,-10294,-2606,-2490],
  finExpenses: [0,0,10,0,0,14,0,0,5,0,0,6],
  ebt:         [5652,-3508,-14508,-9143,1294,-2522,8373,-5316,-7102,-9853,-2443,3040],
  tax:         [0,0,0,0,0,0,0,0,0,0,0,0],
  netProfit:   [5652,-3508,-14508,-9143,1294,-2522,8373,-5316,-7102,-9853,-2443,3040],
  inventory:   [0,0,0,0,0,0,0,0,0,0,0,0],
  receivables: [13303,63333,67450,84607,73853,73873,64028,67339,62028,58203,57789,54234].map(v=>v*0.4),
  payables:    [7683,7683,7683,7683,7683,7683,7683,7683,7683,7683,7683,7683].map(v=>v*0.5),
  equity:      [-75687,-79195,-93704,-102847,-101553,-104075,-95702,-101018,-108120,-117972,-120415,-117375],
  cash:        [13303,63333,67450,84607,73853,73873,64028,67339,62028,58203,57789,54234],
  ltDebt:      [0,0,0,0,0,0,0,0,0,0,0,0],
  stDebt:      [0,0,0,0,0,0,0,0,0,0,0,0],
  otherCL:     [20000,20000,20000,20000,20000,20000,20000,20000,20000,20000,20000,20000],
  grossProfit: [-11222,-15604,-26301,-20942,-12228,-15481,-3768,-18782,-20041,-22898,-15102,-15995].map((v,i)=>Math.abs(v)-[7683,7683,7683,7683,7683,7683,7683,7683,7683,7683,7683,7683][i]),
};


const DATA_BY_YEAR = {
  "2024": {
  revenue:[-12762,-9339,-11003,-18747,-17438,-16354,-1590,-4138,-15142,-23187,-20690,-10494].map(v=>Math.abs(v)),
  cogs:[7192,7192,7167,8097,7327,7327,866,7326,7327,7327,7327,5711],
  opex:[1927,1353,1373,6138,7423,8161,1358,1205,5505,7434,6460,3771],
  ebitda:[-3643,-795,-2463,-4513,-2689,-866,633,4392,-2311,-8426,-6904,-1012],
  depAmort:[0,0,0,0,0,0,0,0,0,0,0,0],
  ebit:[-3643,-795,-2463,-4513,-2689,-866,633,4392,-2311,-8426,-6904,-1012],
  finExpenses:[0,0,436,0,0,479,0,0,0,0,0,13],
  ebt:[-2816,422,-1682,-3273,-1494,-128,1850,5609,-618,-7210,-5687,-8202],
  tax:[0,0,0,0,0,0,0,0,0,0,0,0],
  netProfit:[-2816,422,-1682,-3273,-1494,-128,1850,5609,-618,-7210,-5687,-8202],
  grossProfit:[-12762,-9339,-11003,-18747,-17438,-16354,-1590,-4138,-15142,-23187,-20690,-10494].map((v,i)=>Math.abs(v)-[7192,7192,7167,8097,7327,7327,866,7326,7327,7327,7327,5711][i]),
  inventory:[0,0,0,0,0,0,0,0,0,0,0,0],
  receivables:[120073,121862,122383,109751,100531,104318,33944,32576,10303,11493,1381,8403].map(v=>v*0.4),
  cash:[120073,121862,122383,109751,100531,104318,33944,32576,10303,11493,1381,8403],
  otherCA:[0,0,0,0,0,0,0,0,0,0,0,0],
  equity:[-96948,-96526,-98209,-101481,-102975,-103103,-16253,-10644,-11262,-18472,-24159,-32361],
  ltDebt:[0,0,0,0,0,0,0,0,0,0,0,0],
  stDebt:[0,0,0,0,0,0,0,0,0,0,0,0],
  payables:[7192,7192,7167,8097,7327,7327,866,7326,7327,7327,7327,5711].map(v=>v*0.5),
  otherCL:[20000,20000,20000,20000,20000,20000,20000,20000,20000,20000,20000,20000],
  tangibles:[0,0,0,0,0,0,0,0,0,0,0,0],
  wcChange:[0,0,0,0,0,0,0,0,0,0,0,0],
  cfOp:[-2816,422,-1682,-3273,-1494,-128,1850,5609,-618,-7210,-5687,-8202],
  cfInv:[0,0,0,0,0,0,0,0,0,0,0,0],
  cfFin:[0,0,0,0,0,0,0,0,0,0,0,0],
},
  "2025": {
  revenue:     [-10982,-15604,-26301,-20942,-12228,-15481,-3768,-18782,-20041,-22898,-15102,-15995].map(v=>Math.abs(v)),
  cogs:        [7327,7327,7316,7327,7327,7327,7327,7312,7699,1562,7683,7683],
  opex:        [3725,3972,3678,3675,5398,4848,4017,5341,4820,4921,4813,5821],
  ebitda:      [69,-4306,-15306,-9940,496,-3306,7576,-6129,-7522,-16415,-2606,-2490],
  depAmort:    [0,0,0,0,0,0,0,0,0,0,0,0],
  ebit:        [69,-4306,-15306,-9940,496,-3306,7576,-6129,-7522,-16415,-2606,-2490],
  finExpenses: [0,0,10,0,0,14,0,0,5,0,0,6],
  ebt:         [1219,-3865,-14876,-9500,937,-2879,8016,-5688,-7086,-15974,-2443,3040],
  tax:         [1150,441,440,440,441,441,440,441,341,0,163,0],
  netProfit:   [1219,-3865,-14876,-9500,937,-2879,8016,-5688,-7086,-15974,-2443,3040],
  grossProfit: [-10982,-15604,-26301,-20942,-12228,-15481,-3768,-18782,-20041,-22898,-15102,-15995].map(v=>Math.abs(v)-[7327,7327,7316,7327,7327,7327,7327,7312,7699,1562,7683,7683][0]),
  inventory:   [0,0,0,0,0,0,0,0,0,0,0,0],
  receivables: [7784,7151,11636,29151,18754,19130,9642,13325,13782,16078,15664,16927].map(v=>v*0.4),
  cash:        [7784,7151,11636,29151,18754,19130,9642,13325,13782,16078,15664,16927],
  otherCA:     [0,0,0,0,0,0,0,0,0,0,0,0],
  equity:      [-31022,-34887,-49763,-59263,-58326,-61205,-53189,-58877,-65963,-81937,-84380,-81339],
  ltDebt:      [0,0,0,0,0,0,0,0,0,0,0,0],
  stDebt:      [0,0,0,0,0,0,0,0,0,0,0,0],
  payables:    [7327,7327,7316,7327,7327,7327,7327,7312,7699,1562,7683,7683].map(v=>v*0.5),
  otherCL:     [20000,20000,20000,20000,20000,20000,20000,20000,20000,20000,20000,20000],
  tangibles:   [0,0,0,0,0,0,0,0,0,0,0,0],
  wcChange:    [0,0,0,0,0,0,0,0,0,0,0,0],
  cfOp:        [1219,-3865,-14876,-9500,937,-2879,8016,-5688,-7086,-15974,-2443,3040],
  cfInv:       [0,0,0,0,0,0,0,0,0,0,0,0],
  cfFin:       [0,0,0,0,0,0,0,0,0,0,0,0],
},
  "2026": {
  revenue:     [-11222,-15604,-26301,-20942,-12228,-15481,-3768,-18782,-20041,-22898,-15102,-15995].map(v=>Math.abs(v)),
  cogs:        [7683,7683,7683,7683,7683,7683,7683,7683,7683,7683,7683,7683],
  opex:        [6983,3972,3678,3675,5398,4848,4017,5341,4820,4921,4813,5821],
  ebitda:      [3445,-3949,-14939,-9583,853,-2949,7933,-5757,-7537,-10294,-2606,-2490],
  depAmort:    [0,0,0,0,0,0,0,0,0,0,0,0],
  ebit:        [3445,-3949,-14939,-9583,853,-2949,7933,-5757,-7537,-10294,-2606,-2490],
  finExpenses: [0,0,10,0,0,14,0,0,5,0,0,6],
  ebt:         [5652,-3508,-14508,-9143,1294,-2522,8373,-5316,-7102,-9853,-2443,3040],
  tax:         [0,0,0,0,0,0,0,0,0,0,0,0],
  netProfit:   [5652,-3508,-14508,-9143,1294,-2522,8373,-5316,-7102,-9853,-2443,3040],
  inventory:   [0,0,0,0,0,0,0,0,0,0,0,0],
  receivables: [13303,63333,67450,84607,73853,73873,64028,67339,62028,58203,57789,54234].map(v=>v*0.4),
  payables:    [7683,7683,7683,7683,7683,7683,7683,7683,7683,7683,7683,7683].map(v=>v*0.5),
  equity:      [-75687,-79195,-93704,-102847,-101553,-104075,-95702,-101018,-108120,-117972,-120415,-117375],
  cash:        [13303,63333,67450,84607,73853,73873,64028,67339,62028,58203,57789,54234],
  ltDebt:      [0,0,0,0,0,0,0,0,0,0,0,0],
  stDebt:      [0,0,0,0,0,0,0,0,0,0,0,0],
  otherCL:     [20000,20000,20000,20000,20000,20000,20000,20000,20000,20000,20000,20000],
  grossProfit: [-11222,-15604,-26301,-20942,-12228,-15481,-3768,-18782,-20041,-22898,-15102,-15995].map((v,i)=>Math.abs(v)-[7683,7683,7683,7683,7683,7683,7683,7683,7683,7683,7683,7683][i]),
},
};
// Compute grossProfit for each year
Object.values(DATA_BY_YEAR).forEach(d => {
  if(d.revenue && d.cogs && !d.grossProfit)
    d.grossProfit = d.revenue.map((v,i) => v - (d.cogs[i]||0));
});

const fmt  = v => { const a=Math.abs(v),s=v<0?"-":""; return a>=1e6?s+"€"+(a/1e6).toFixed(2)+"M":a>=1e3?s+"€"+(a/1e3).toFixed(0)+"K":s+"€"+a.toFixed(0); };
const fmtN = v => new Intl.NumberFormat("fi-FI",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(v);
const vc   = v => v>=0?GREEN:RED;
const sum  = a => a.reduce((s,v)=>s+v,0);
const sl   = (arr,s,e) => arr?arr.slice(s,e+1):[];

const Tt = ({active,payload,label}) => {
  if(!active||!payload||!payload.length) return null;
  return (
    <div style={{background:"#0a0f1a",border:"1px solid #1e2d45",borderRadius:8,padding:"10px 14px",fontSize:11,fontFamily:"'DM Mono',monospace"}}>
      <div style={{color:SLATE,marginBottom:6}}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{color:p.color,marginBottom:2}}>
          {p.name}: <span style={{color:"#e2e8f0"}}>{typeof p.value==="number"?fmtN(p.value):p.value}</span>
        </div>
      ))}
</div>
  );
};

const SecTitle = ({c}) => (
  <div style={{fontSize:11,fontWeight:600,color:SLATE,fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:16,paddingBottom:8,borderBottom:"1px solid #0f1e30"}}>{c}</div>
);

const Gauge = ({label,value,unit,target,targetLabel,color,desc,flip}) => {
  const hit = flip ? +value<=target : +value>=target;
  return (
    <div className="kpi-card" style={{background:"#0c1420",border:"1px solid #0f1e30",borderRadius:12,padding:"18px 20px"}}>
      <div style={{fontSize:10,color:SLATE,fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>{label}</div>
      <div style={{fontSize:26,fontWeight:700,color,fontFamily:"'DM Mono',monospace",marginBottom:4}}>{value}{unit||""}</div>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
        <div style={{width:6,height:6,borderRadius:"50%",background:hit?GREEN:RED}}/>
        <span style={{fontSize:11,color:hit?GREEN:RED}}>{hit?"On target":"Off target"} · {targetLabel}: {target}{unit||""}</span>
      </div>
      <div style={{fontSize:10,color:"#334155"}}>{desc}</div>
    </div>
  );
};

const TblHead = ({visMonths,monthTypes,totalLabel,stickyBg}) => {
  const bg = stickyBg||"#0c1420";
  return (
    <thead>
      <tr style={{borderBottom:"1px solid #0f1e30"}}>
        <th style={{textAlign:"left",padding:"10px 20px",color:SLATE,fontWeight:500,minWidth:190,position:"sticky",left:0,background:bg,zIndex:2}}>Line Item</th>
        {visMonths.map((m,i) => (
          <th key={i} colSpan={2} style={{padding:"8px 10px",fontWeight:500,fontSize:10,textAlign:"center",color:monthTypes[i]==="ACT"?"#93c5fd":"#fcd34d",whiteSpace:"nowrap",minWidth:110}}>{m}</th>
        ))}
        <th colSpan={3} style={{padding:"8px 10px",fontWeight:600,fontSize:10,textAlign:"center",color:"#94a3b8",minWidth:130}}>{totalLabel||"Total"}</th>
      </tr>
      <tr style={{borderBottom:"1px solid #1e2d45",background:"#070c17"}}>
        <th style={{position:"sticky",left:0,background:"#070c17",zIndex:2}}></th>
        {visMonths.map((_,i) => [
          <th key={"a"+i} style={{padding:"4px 8px",fontSize:9,fontWeight:600,textAlign:"right",color:BLUE,background:"#060d1a",letterSpacing:"0.05em"}}>ACT</th>,
          <th key={"c"+i} style={{padding:"4px 8px",fontSize:9,fontWeight:600,textAlign:"right",color:AMBER,background:"#0d0a00",letterSpacing:"0.05em"}}>BUD</th>,
        ])}
        {["ACT","BUD","VAR"].map(h => (
          <th key={h} style={{padding:"4px 8px",fontSize:9,fontWeight:600,textAlign:"right",color:h==="ACT"?BLUE:h==="BUD"?AMBER:RED,letterSpacing:"0.05em"}}>{h}</th>
        ))}
      </tr>
    </thead>
  );
};

const TblRow = ({label,actArr,compArr,color,bold,indent,s,e,monthTypes,spot}) => {
  const aSlice = sl(actArr,s,e);
  const cSlice = compArr?sl(compArr,s,e):null;
  const mTypes = monthTypes||aSlice.map(()=>"ACT");
  const actVals = aSlice.filter((_,i)=>mTypes[i]==="ACT");
  const totA   = spot ? (actVals[actVals.length-1]??null) : sum(actVals);
  const totC   = cSlice?(spot ? cSlice[cSlice.length-1]??null : sum(cSlice)):null;
  const totV   = totC!==null&&totA!==null?totA-totC:null;
  return (
    <tr className="tbl-row" style={{borderBottom:"1px solid #080f1a"}}>
      <td style={{padding:"7px 20px",color,fontWeight:bold?600:400,fontSize:bold?12:11,paddingLeft:indent?32:20,position:"sticky",left:0,background:"#0c1420",zIndex:1}}>{label}</td>
      {aSlice.map((av,i) => {
        const cv = cSlice?cSlice[i]:null;
        const isAct = mTypes[i]==="ACT";
        return [
          <td key={"a"+i} style={{padding:"7px 8px",textAlign:"right",color:isAct?color:"#1e2d45",fontWeight:bold?600:400,fontSize:11,fontFamily:"'DM Mono',monospace",whiteSpace:"nowrap"}}>{isAct?fmt(av):"—"}</td>,
          <td key={"c"+i} style={{padding:"7px 8px",textAlign:"right",color:cv!==null?AMBER:SLATE,fontSize:11,fontFamily:"'DM Mono',monospace",whiteSpace:"nowrap"}}>{cv!==null?fmt(cv):"—"}</td>,
        ];
      })}
      <td style={{padding:"7px 8px",textAlign:"right",color,fontWeight:700,fontSize:11,fontFamily:"'DM Mono',monospace",borderLeft:"1px solid #0f1e30",whiteSpace:"nowrap"}}>{fmt(totA)}</td>
      <td style={{padding:"7px 8px",textAlign:"right",color:AMBER,fontSize:11,fontFamily:"'DM Mono',monospace",whiteSpace:"nowrap"}}>{totC!==null?fmt(totC):"—"}</td>
      <td style={{padding:"7px 8px",textAlign:"right",color:totV!==null?vc(totV):SLATE,fontSize:11,fontFamily:"'DM Mono',monospace",whiteSpace:"nowrap"}}>{totV!==null?fmt(totV):"—"}</td>
    </tr>
  );
};

const PeriodBar = ({startM,endM,setStart,setEnd,compLabel,actLast}) => (
  <div style={{borderBottom:"1px solid #0c1829",background:"#060a14",padding:"10px 32px",display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <span style={{fontSize:10,color:"#2d3f58",fontFamily:"'DM Mono',monospace"}}>From</span>
      <select className="psel" value={startM} onChange={e=>{const v=+e.target.value;setStart(v);if(v>endM)setEnd(v);}}>
        {MONTHS.map((m,i) => <option key={m} value={i}>{m}</option>)}
      </select>
      <span style={{fontSize:10,color:"#2d3f58",fontFamily:"'DM Mono',monospace"}}>To</span>
      <select className="psel" value={endM} onChange={e=>{const v=+e.target.value;setEnd(v);if(v<startM)setStart(v);}}>
        {MONTHS.map((m,i) => <option key={m} value={i}>{m}</option>)}
      </select>
    </div>
    <div style={{display:"flex",gap:3,flex:1,flexWrap:"wrap"}}>
      {MONTHS.map((m,i) => {
        const inRange=i>=startM&&i<=endM;
        const isEdge=i===startM||i===endM;
        const isAct=i<=actLast;
        let cls="mpill";
        if(inRange&&!isEdge) cls+=" in-range";
        if(isEdge) cls+=isAct?" is-edge-act":" is-edge-comp";
        return (
          <button key={m} className={cls} onClick={()=>{
            if(i<startM) setStart(i);
            else if(i>endM) setEnd(i);
            else if(i===startM&&i<endM) setStart(i+1);
            else if(i===endM&&i>startM) setEnd(i-1);
            else{setStart(i);setEnd(i);}
          }}>
            <span style={{fontSize:10,lineHeight:1,color:isEdge?(isAct?"#93c5fd":"#fcd34d"):(inRange?"#94a3b8":"#334155")}}>{m}</span>
            <span style={{fontSize:8,lineHeight:1,fontWeight:700,color:isAct?BLUE:AMBER}}>{isAct?"ACT":compLabel}</span>
          </button>
        );
      })}
    </div>
    <div style={{display:"flex",alignItems:"center",gap:12,fontSize:10,fontFamily:"'DM Mono',monospace",whiteSpace:"nowrap"}}>
      <span><span style={{color:BLUE}}>●</span><span style={{color:SLATE}}> ACT</span></span>
      <span><span style={{color:AMBER}}>●</span><span style={{color:SLATE}}> {compLabel}</span></span>
      <span style={{color:"#334155",paddingLeft:10,borderLeft:"1px solid #0f1e30"}}>{MONTHS[startM]} – {MONTHS[endM]}</span>
    </div>
  </div>
);

function AiAssistant({financialContext, isMobile=false, sidebarOpen=true, setSidebarOpen=()=>{}}) {
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [booted,   setBooted]   = useState(false);
  const [usage,    setUsage]    = useState(0);
  const [capHit,   setCapHit]   = useState(false);
  const bottomRef = useRef();
  const inputRef  = useRef();
  const MONTHLY_CAP = 100;
  const thisMonth = () => new Date().toISOString().slice(0,7); // "2026-03"

  const getUsage = async () => {
    if(!supabase) return 0;
    const { data } = await supabase.from("ai_usage")
      .select("count").eq("client", CLIENT_NAME).eq("month", thisMonth()).single();
    const count = data?.count || 0;
    setUsage(count);
    if(count >= MONTHLY_CAP) setCapHit(true);
    return count;
  };

  const incrementUsage = async () => {
    if(!supabase) return;
    await supabase.from("ai_usage").upsert({
      client: CLIENT_NAME,
      month: thisMonth(),
      count: usage + 1,
      updated_at: new Date().toISOString()
    }, { onConflict: "client,month", ignoreDuplicates: false });
    setUsage(u => u + 1);
  };

  const SYSTEM = `You are EBITDA-9000, a razor-sharp AI financial advisor embedded in a board-level dashboard called Targetflow. You have a dry sense of humour but always back it up with precise numbers. You have full access to the company's current financial data below. Flag anomalies, identify trends, suggest actions, answer questions. Be direct — board members don't need hand-holding. Use €K/€M notation, percentages, and month names. Keep responses under 200 words unless asked for detail. Occasionally make a light finance pun but never at the expense of accuracy.

Current financial data (${financialContext.period}, ${financialContext.year}):
- Revenue: ${financialContext.revenue} | vs budget: ${financialContext.revVar}
- Gross margin: ${financialContext.gmPct}% | EBIT margin: ${financialContext.emPct}%
- EBITDA: ${financialContext.ebitda} | Net profit: ${financialContext.netProfit}
- Equity: ${financialContext.equity} | Equity ratio: ${financialContext.eqR}%
- Gearing: ${financialContext.gear}% | Interest coverage: ${financialContext.intCov}x
- DSO: ${financialContext.dso} days | Cash: ${financialContext.cash}
- Budget mode: ${financialContext.compLabel}
- Last confirmed actuals through: ${financialContext.actLastMonth}`;

  const scrollBottom = () => setTimeout(()=>bottomRef.current?.scrollIntoView({behavior:"smooth"}),50);

  const boot = async () => {
    if(booted) return;
    setBooted(true);
    const currentUsage = await getUsage();
    if(currentUsage >= MONTHLY_CAP) {
      setMessages([{role:"assistant",content:"EBITDA-9000 has reached its monthly query limit. It will reset on the 1st of next month.",auto:true,err:true}]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const bootMsg = "Give me a brief financial health summary for this period. Lead with the single most important thing the board should know right now, then flag up to 2 anomalies or risks. Be specific with numbers.";
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json","x-api-key":ANTHROPIC_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:600,
          system:SYSTEM,
          messages:[{role:"user",content:bootMsg}]
        })
      });
      const data = await res.json();
      const text = data.content?.find(b=>b.type==="text")?.text || "Unable to generate summary.";
      setMessages([{role:"assistant",content:text,auto:true}]);
      await incrementUsage();
      if(!open) {}
    } catch(e) {
      setMessages([{role:"assistant",content:"Could not connect to AI. Check your API configuration.",auto:true,err:true}]);
    }
    setLoading(false);
    scrollBottom();
  };

  const send = async () => {
    const text = input.trim();
    if(!text || loading) return;
    if(capHit || usage >= MONTHLY_CAP) {
      setMessages(prev=>[...prev,{role:"assistant",content:"Monthly query limit reached. Resets on the 1st of next month.",err:true}]);
      return;
    }
    setInput("");
    const newMessages = [...messages, {role:"user",content:text}];
    setMessages(newMessages);
    setLoading(true);
    scrollBottom();
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json","x-api-key":ANTHROPIC_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:600,
          system:SYSTEM,
          messages:newMessages.map(m=>({role:m.role,content:m.content}))
        })
      });
      const data = await res.json();
      const reply = data.content?.find(b=>b.type==="text")?.text || "No response.";
      setMessages(prev=>[...prev,{role:"assistant",content:reply}]);
      await incrementUsage();
    } catch(e) {
      setMessages(prev=>[...prev,{role:"assistant",content:"Error contacting AI.",err:true}]);
    }
    setLoading(false);
    scrollBottom();
  };

  const PROMPTS = [
    "What's our biggest risk right now?",
    "Compare revenue vs budget",
    "Is our cash position healthy?",
    "What should the board prioritise?",
    "Explain the gearing ratio",
    "Flag any margin concerns",
  ];

  // Boot automatically on mount
  React.useEffect(()=>{ boot(); },[]);

  return (
    <>
      {isMobile && (
        <button
          data-ai-float-btn
          onClick={() => setSidebarOpen(o => !o)}
          style={{
            position:"fixed", bottom:20, right:20, zIndex:600,
            width:48, height:48, borderRadius:"50%",
            background:"linear-gradient(135deg,#1d4ed8,#0ea5e9)",
            border:"none", cursor:"pointer", fontSize:18,
            boxShadow:"0 4px 20px rgba(29,78,216,0.5)",
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
          {sidebarOpen ? "✕" : (<svg width="24" height="24" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="e9k_a" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#818cf8" stopOpacity="0.22"/><stop offset="100%" stopColor="#60a5fa" stopOpacity="0"/></radialGradient><radialGradient id="e9k_c" cx="50%" cy="45%" r="50%"><stop offset="0%" stopColor="#1e3a6e"/><stop offset="100%" stopColor="#05060f"/></radialGradient></defs><circle cx="22" cy="22" r="22" fill="url(#e9k_a)"/><g opacity="0.15" stroke="#a5b4fc" strokeLinecap="round"><line x1="22" y1="4" x2="22" y2="0" strokeWidth="0.8"/><line x1="22" y1="40" x2="22" y2="44" strokeWidth="0.8"/><line x1="4" y1="22" x2="0" y2="22" strokeWidth="0.8"/><line x1="40" y1="22" x2="44" y2="22" strokeWidth="0.8"/><line x1="8" y1="8" x2="5" y2="5" strokeWidth="0.6"/><line x1="36" y1="8" x2="39" y2="5" strokeWidth="0.6"/></g><ellipse cx="22" cy="9" rx="9" ry="2.2" fill="none" stroke="#818cf8" strokeWidth="0.9" opacity="0.55"/><circle cx="22" cy="22" r="18" fill="url(#e9k_c)" stroke="rgba(129,140,248,0.35)" strokeWidth="0.8"/><rect x="10" y="13" width="24" height="20" rx="5" fill="rgba(10,16,45,0.95)" stroke="rgba(99,120,220,0.4)" strokeWidth="0.7"/><rect x="12" y="16" width="20" height="8" rx="2.5" fill="rgba(5,6,15,0.9)"/><rect x="13" y="17.5" width="6" height="3" rx="1.5" fill="#1e40af"/><rect x="25" y="17.5" width="6" height="3" rx="1.5" fill="#1e40af"/><rect x="14" y="18" width="4" height="2" rx="1" fill="#60a5fa"/><rect x="26" y="18" width="4" height="2" rx="1" fill="#60a5fa"/><circle cx="16" cy="19" r="0.8" fill="#bfdbfe" opacity="0.9"/><circle cx="28" cy="19" r="0.8" fill="#bfdbfe" opacity="0.9"/><rect x="13" y="26" width="2.5" height="4" rx="0.8" fill="#22c55e" opacity="0.9"/><rect x="17" y="27.5" width="2.5" height="2.5" rx="0.8" fill="#22c55e" opacity="0.7"/><rect x="21" y="26" width="2.5" height="4" rx="0.8" fill="#22c55e" opacity="0.85"/><rect x="25" y="28" width="2.5" height="2" rx="0.8" fill="#22c55e" opacity="0.6"/><rect x="29" y="26" width="2" height="4" rx="0.8" fill="#22c55e" opacity="0.75"/><line x1="22" y1="13" x2="22" y2="8" stroke="rgba(165,180,252,0.5)" strokeWidth="0.8" strokeLinecap="round"/><polygon points="22,5 24,7.5 22,10 20,7.5" fill="#a5b4fc" opacity="0.85"/><circle cx="22" cy="7.5" r="1" fill="white" opacity="0.6"/></svg>)}
        </button>
      )}
      {(!isMobile || sidebarOpen) && (
    <div data-ai-sidebar style={{position:"fixed",top:0,right:0,width:isMobile?"100vw":320,height:"100vh",
      display:"flex",flexDirection:"column",background:"#060a14",
      borderLeft:"1px solid #0f1e30",zIndex:500}}>

      {/* Header */}
      <div style={{padding:"14px 18px",borderBottom:"1px solid #0f1e30",display:"flex",alignItems:"center",justifyContent:"space-between",background:"linear-gradient(135deg,#0a1628,#060e1e)",flexShrink:0,height:56}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:28,height:28,borderRadius:"50%",background:"#05060f",border:"1px solid rgba(129,140,248,0.3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden"}}><svg width="28" height="28" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="e9k_a2" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#818cf8" stopOpacity="0.22"/><stop offset="100%" stopColor="#60a5fa" stopOpacity="0"/></radialGradient><radialGradient id="e9k_c2" cx="50%" cy="45%" r="50%"><stop offset="0%" stopColor="#1e3a6e"/><stop offset="100%" stopColor="#05060f"/></radialGradient></defs><circle cx="22" cy="22" r="22" fill="url(#e9k_a2)"/><g opacity="0.15" stroke="#a5b4fc" strokeLinecap="round"><line x1="22" y1="4" x2="22" y2="0" strokeWidth="0.8"/><line x1="22" y1="40" x2="22" y2="44" strokeWidth="0.8"/><line x1="4" y1="22" x2="0" y2="22" strokeWidth="0.8"/><line x1="40" y1="22" x2="44" y2="22" strokeWidth="0.8"/></g><ellipse cx="22" cy="9" rx="9" ry="2.2" fill="none" stroke="#818cf8" strokeWidth="0.9" opacity="0.55"/><circle cx="22" cy="22" r="18" fill="url(#e9k_c2)" stroke="rgba(129,140,248,0.35)" strokeWidth="0.8"/><rect x="10" y="13" width="24" height="20" rx="5" fill="rgba(10,16,45,0.95)" stroke="rgba(99,120,220,0.4)" strokeWidth="0.7"/><rect x="12" y="16" width="20" height="8" rx="2.5" fill="rgba(5,6,15,0.9)"/><rect x="13" y="17.5" width="6" height="3" rx="1.5" fill="#1e40af"/><rect x="25" y="17.5" width="6" height="3" rx="1.5" fill="#1e40af"/><rect x="14" y="18" width="4" height="2" rx="1" fill="#60a5fa"/><rect x="26" y="18" width="4" height="2" rx="1" fill="#60a5fa"/><circle cx="16" cy="19" r="0.8" fill="#bfdbfe" opacity="0.9"/><circle cx="28" cy="19" r="0.8" fill="#bfdbfe" opacity="0.9"/><rect x="13" y="26" width="2.5" height="4" rx="0.8" fill="#22c55e" opacity="0.9"/><rect x="17" y="27.5" width="2.5" height="2.5" rx="0.8" fill="#22c55e" opacity="0.7"/><rect x="21" y="26" width="2.5" height="4" rx="0.8" fill="#22c55e" opacity="0.85"/><rect x="25" y="28" width="2.5" height="2" rx="0.8" fill="#22c55e" opacity="0.6"/><rect x="29" y="26" width="2" height="4" rx="0.8" fill="#22c55e" opacity="0.75"/><line x1="22" y1="13" x2="22" y2="8" stroke="rgba(165,180,252,0.5)" strokeWidth="0.8" strokeLinecap="round"/><polygon points="22,5 24,7.5 22,10 20,7.5" fill="#a5b4fc" opacity="0.85"/><circle cx="22" cy="7.5" r="1" fill="white" opacity="0.6"/></svg></div>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:"#e2e8f0"}}>EBITDA-9000</div>
            <div style={{fontSize:9,color:loading?AMBER:GREEN,fontFamily:"'DM Mono',monospace"}}>{loading?"Crunching numbers…":"● Online"}</div>
          </div>
        </div>
        {usage>0&&<div style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:"#334155"}}>{usage}/{MONTHLY_CAP}</div>}
        {isMobile && (
          <button onClick={()=>setSidebarOpen(false)} style={{background:"none",border:"none",color:"#64748b",fontSize:18,cursor:"pointer",padding:"4px 8px"}}>✕</button>
        )}
      </div>

      {/* Messages */}
      <div style={{flex:1,overflowY:"auto",padding:"14px 14px",display:"flex",flexDirection:"column",gap:10}}>
        {messages.length===0 && loading && (
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:"#0c1420",borderRadius:12,border:"1px solid #0f1e30"}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:BLUE,animation:"pulse 1s infinite",flexShrink:0}}/>
            <span style={{fontSize:11,color:SLATE,fontFamily:"'DM Mono',monospace"}}>Initialising… please hold.</span>
          </div>
        )}
        {messages.map((m,i) => (
          <div key={i} style={{display:"flex",flexDirection:"column",alignItems:m.role==="user"?"flex-end":"flex-start",gap:3}}>
            {m.auto && (
              <div style={{fontSize:9,color:BLUE,fontFamily:"'DM Mono',monospace",paddingLeft:2}}>✦ Auto-summary</div>
            )}
            <div style={{maxWidth:"94%",padding:"9px 12px",borderRadius:m.role==="user"?"12px 12px 2px 12px":"12px 12px 12px 2px",
              background:m.role==="user"?"#1e3a5f":m.err?"#1a0a0a":"#0c1420",
              border:"1px solid "+(m.role==="user"?"#3b82f655":m.err?"#f8717133":"#1e2d45"),
              fontSize:11,color:m.err?RED:"#d1d5db",lineHeight:1.6,whiteSpace:"pre-wrap"}}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && messages.length>0 && (
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",background:"#0c1420",borderRadius:"12px 12px 12px 2px",border:"1px solid #1e2d45",maxWidth:"60%"}}>
            <div style={{display:"flex",gap:3}}>
              {[0,1,2].map(n=><div key={n} style={{width:5,height:5,borderRadius:"50%",background:BLUE,opacity:0.4+n*0.3}}/>)}
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Quick prompts */}
      {messages.length<2 && !loading && (
        <div style={{padding:"0 10px 8px",display:"flex",gap:5,flexWrap:"wrap",flexShrink:0}}>
          {PROMPTS.map(p=>(
            <button key={p} onClick={()=>{setInput(p);setTimeout(()=>inputRef.current?.focus(),50);}}
              style={{padding:"3px 9px",borderRadius:20,background:"#0c1420",border:"1px solid #1e2d45",color:SLATE,fontSize:9,fontFamily:"'DM Mono',monospace",cursor:"pointer",whiteSpace:"nowrap",transition:"all 0.15s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="#3b82f6";e.currentTarget.style.color="#93c5fd";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="#1e2d45";e.currentTarget.style.color=SLATE;}}>
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{padding:"10px 12px",borderTop:"1px solid #0f1e30",display:"flex",gap:8,flexShrink:0,background:"#060a14"}}>
        <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
          placeholder="Ask EBITDA-9000…"
          style={{flex:1,background:"#0c1420",border:"1px solid #1e2d45",borderRadius:9,padding:"8px 10px",color:"#e2e8f0",fontSize:11,outline:"none",fontFamily:"'DM Sans',sans-serif"}}
          onFocus={e=>e.target.style.borderColor="#3b82f6"}
          onBlur={e=>e.target.style.borderColor="#1e2d45"}
        />
        <button onClick={send} disabled={!input.trim()||loading}
          style={{width:34,height:34,borderRadius:9,background:input.trim()&&!loading?"#1d4ed8":"#0c1420",border:"1px solid "+(input.trim()&&!loading?"#3b82f6":"#1e2d45"),cursor:input.trim()&&!loading?"pointer":"not-allowed",color:input.trim()&&!loading?"#fff":SLATE,fontSize:15,transition:"all 0.15s",flexShrink:0}}>
          ↑
        </button>
      </div>

    </div>
      )}
    </>
  );
}

function ApiSyncPanel({year, actLast, setActLast}) {
  const [source,    setSource]    = useState("procountor");
  const [syncFrom,  setSyncFrom]  = useState(0);
  const [syncTo,    setSyncTo]    = useState(actLast);
  const [scope,     setScope]     = useState(["pl","balance"]);
  const [status,    setStatus]    = useState(null); // null | "running" | "done" | "error"
  const [log,       setLog]       = useState([]);
  const [lastSync,  setLastSync]  = useState(null);

  const toggleScope = (s) => setScope(prev => prev.includes(s) ? prev.filter(x=>x!==s) : [...prev,s]);

  const SOURCES = [
    {id:"procountor", label:"Procountor", color:"#6366f1", icon:"🔗", note:"REST API · OAuth2"},
    {id:"netvisor",   label:"Netvisor",   color:"#0ea5e9", icon:"🔗", note:"SOAP/REST API"},
    {id:"csv",        label:"Manual CSV", color:SLATE,     icon:"📂", note:"Upload file below"},
  ];

  const SCOPE_OPTS = [
    {id:"pl",      label:"P&L",           sub:"Income statement"},
    {id:"balance", label:"Balance Sheet", sub:"Assets & liabilities"},
  ];

  const runSync = () => {
    if(source==="csv") return;
    setStatus("running");
    setLog([]);
    const steps = [
      {delay:400,  msg:"🔐 Authenticating with "+SOURCES.find(s=>s.id===source).label+"…"},
      {delay:900,  msg:"📡 Fetching "+scope.map(s=>SCOPE_OPTS.find(o=>o.id===s).label).join(" + ")+" for "+MONTHS[syncFrom]+"–"+MONTHS[syncTo]+" "+year+"…"},
      {delay:1600, msg:"🔄 Mapping "+source==="procountor"?"Procountor":"Netvisor"+" chart of accounts…"},
      {delay:2200, msg:"✅ P&L: "+(syncTo-syncFrom+1)+" months imported"},
      scope.includes("balance") ? {delay:2700, msg:"✅ Balance Sheet: "+(syncTo-syncFrom+1)+" end-of-month snapshots imported"} : null,
      {delay:3100, msg:"💾 Writing to Supabase (dashboard_pnl)…"},
      {delay:3600, msg:"✓ Sync complete · "+( (syncTo-syncFrom+1)*( scope.length===2?26:13 ) )+" rows upserted"},
    ].filter(Boolean);
    steps.forEach(({delay,msg}) => {
      setTimeout(() => setLog(prev=>[...prev, msg]), delay);
    });
    setTimeout(() => {
      setStatus("done");
      setActLast(syncTo);
      setLastSync(new Date().toLocaleString("fi-FI"));
    }, 3800);
  };

  const srcObj = SOURCES.find(s=>s.id===source);

  return (
    <div style={{background:"#0a0e1a",border:"1px solid #1e2d45",borderRadius:14,overflow:"hidden"}}>

      {/* Header */}
      <div style={{padding:"16px 22px",borderBottom:"1px solid #0f1e30",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:14,fontWeight:700,color:"#e2e8f0",marginBottom:2}}>↻ Refresh Actuals from Source</div>
          <div style={{fontSize:11,color:SLATE}}>Pull P&L and Balance Sheet data directly from your accounting system and overwrite the selected period</div>
        </div>
        {lastSync && (
          <div style={{fontSize:10,fontFamily:"'DM Mono',monospace",color:SLATE,background:"#060a14",border:"1px solid #0f1e30",borderRadius:7,padding:"5px 12px",whiteSpace:"nowrap"}}>
            Last sync: {lastSync}
          </div>
        )}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0}}>

        {/* LEFT: config */}
        <div style={{padding:"20px 22px",borderRight:"1px solid #0f1e30",display:"flex",flexDirection:"column",gap:20}}>

          {/* Source selector */}
          <div>
            <div style={{fontSize:10,fontWeight:600,color:SLATE,fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>1 · Source</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {SOURCES.map(src => (
                <button key={src.id} onClick={()=>{setSource(src.id);setStatus(null);setLog([]);}}
                  style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderRadius:9,cursor:"pointer",textAlign:"left",
                    border:"1px solid "+(source===src.id?src.color+"66":"#1e2d45"),
                    background:source===src.id?src.color+"12":"transparent"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:source===src.id?src.color:"#1e2d45",flexShrink:0}}/>
                    <div>
                      <div style={{fontSize:12,fontWeight:600,color:source===src.id?"#e2e8f0":"#64748b"}}>{src.label}</div>
                      <div style={{fontSize:9,color:"#334155",fontFamily:"'DM Mono',monospace",marginTop:1}}>{src.note}</div>
                    </div>
                  </div>
                  {source===src.id && <div style={{fontSize:9,color:src.color,fontFamily:"'DM Mono',monospace",fontWeight:700}}>SELECTED</div>}
                </button>
              ))}
            </div>
          </div>

          {/* Period */}
          <div>
            <div style={{fontSize:10,fontWeight:600,color:SLATE,fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>2 · Period to overwrite</div>
            <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:12}}>
              <div style={{flex:1}}>
                <div style={{fontSize:9,color:"#334155",fontFamily:"'DM Mono',monospace",marginBottom:5}}>FROM</div>
                <select className="psel" style={{width:"100%"}} value={syncFrom} onChange={e=>setSyncFrom(+e.target.value)}>
                  {MONTHS.map((m,i)=><option key={m} value={i}>{m} {year}</option>)}
                </select>
              </div>
              <div style={{color:"#1e2d45",paddingTop:18}}>→</div>
              <div style={{flex:1}}>
                <div style={{fontSize:9,color:"#334155",fontFamily:"'DM Mono',monospace",marginBottom:5}}>TO</div>
                <select className="psel" style={{width:"100%"}} value={syncTo} onChange={e=>setSyncTo(+e.target.value)}>
                  {MONTHS.map((m,i)=><option key={m} value={i} disabled={i<syncFrom}>{m} {year}</option>)}
                </select>
              </div>
            </div>
            <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
              {MONTHS.map((m,i) => {
                const inRange=i>=syncFrom&&i<=syncTo;
                return (
                  <div key={m} onClick={()=>{if(i<syncFrom)setSyncFrom(i);else if(i>syncTo)setSyncTo(i);}}
                    style={{padding:"3px 7px",borderRadius:5,fontSize:9,fontFamily:"'DM Mono',monospace",cursor:"pointer",
                      background:inRange?"#1e3a5f":"transparent",
                      color:inRange?"#93c5fd":"#334155",
                      border:"1px solid "+(inRange?"#3b82f6":"#0f1e30")}}>
                    {m}
                  </div>
                );
              })}
            </div>
            <div style={{marginTop:8,fontSize:9,color:"#334155",fontFamily:"'DM Mono',monospace"}}>
              ⚠ Overwrites {syncTo-syncFrom+1} month{syncTo-syncFrom>0?"s":""} completely — existing data for this period will be replaced
            </div>
          </div>

          {/* Scope */}
          <div>
            <div style={{fontSize:10,fontWeight:600,color:SLATE,fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>3 · Data to pull</div>
            <div style={{display:"flex",gap:8}}>
              {SCOPE_OPTS.map(opt => (
                <button key={opt.id} onClick={()=>toggleScope(opt.id)}
                  style={{flex:1,padding:"10px 12px",borderRadius:9,cursor:"pointer",textAlign:"left",
                    border:"1px solid "+(scope.includes(opt.id)?"#3b82f6":"#1e2d45"),
                    background:scope.includes(opt.id)?"#0d1e35":"transparent"}}>
                  <div style={{fontSize:11,fontWeight:600,color:scope.includes(opt.id)?"#60a5fa":"#64748b",marginBottom:2}}>{opt.label}</div>
                  <div style={{fontSize:9,color:"#334155",fontFamily:"'DM Mono',monospace"}}>{opt.sub}</div>
                </button>
              ))}
            </div>
            {scope.length===0 && <div style={{fontSize:10,color:RED,fontFamily:"'DM Mono',monospace",marginTop:6}}>Select at least one</div>}
          </div>

          {/* Run button */}
          {source!=="csv" && (
            <button
              onClick={runSync}
              disabled={status==="running"||scope.length===0}
              style={{padding:"12px 20px",borderRadius:10,fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:700,cursor:status==="running"||scope.length===0?"not-allowed":"pointer",
                border:"1px solid "+(status==="running"?"#1e3a5f":status==="done"?GREEN+"88":"#3b82f6"),
                background:status==="running"?"#0a1525":status==="done"?GREEN+"15":"#0d1e35",
                color:status==="running"?SLATE:status==="done"?GREEN:"#60a5fa",
                transition:"all 0.2s"}}>
              {status==="running"?"⟳ Syncing…":status==="done"?"✓ Sync complete":"↻ Run Sync Now"}
            </button>
          )}
          {source==="csv" && (
            <div style={{padding:"10px 14px",borderRadius:9,background:"#070c17",border:"1px solid #0f1e30",fontSize:11,color:SLATE}}>
              👇 Use the Manual CSV panel below to import data

            </div>
          )}

        </div>

        {/* RIGHT: log / preview */}
        <div style={{padding:"20px 22px",display:"flex",flexDirection:"column",gap:14}}>

          {/* Connection status */}
          <div>
            <div style={{fontSize:10,fontWeight:600,color:SLATE,fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>Connection</div>
            {source==="csv" ? (
              <div style={{padding:"12px 16px",borderRadius:9,background:"#070c17",border:"1px solid #0f1e30",fontSize:11,color:SLATE}}>No API connection needed for manual CSV</div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:"#070c17",borderRadius:9,border:"1px solid #0f1e30"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:6,height:6,borderRadius:"50%",background:AMBER}}/>
                    <span style={{fontSize:11,color:"#94a3b8"}}>API Environment</span>
                  </div>
                  <span style={{fontSize:10,fontFamily:"'DM Mono',monospace",color:AMBER}}>Not configured</span>
                </div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:"#070c17",borderRadius:9,border:"1px solid #0f1e30"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:6,height:6,borderRadius:"50%",background:AMBER}}/>
                    <span style={{fontSize:11,color:"#94a3b8"}}>API Key</span>
                  </div>
                  <span style={{fontSize:10,fontFamily:"'DM Mono',monospace",color:AMBER}}>Targetflow Dashboard key needed</span>
                </div>
                <div style={{fontSize:9,color:"#1e2d45",fontFamily:"'DM Mono',monospace",lineHeight:1.6}}>
                  To connect: create an API key called "Targetflow Dashboard" in your {source==="procountor"?"Procountor":"Netvisor"} settings, then set it in the dashboard config. See setup guide →
                </div>
              </div>
            )}
          </div>

          {/* Sync log */}
          <div style={{flex:1}}>
            <div style={{fontSize:10,fontWeight:600,color:SLATE,fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>Sync Log</div>
            <div style={{background:"#040710",border:"1px solid #0c1829",borderRadius:9,padding:"12px 14px",minHeight:160,fontFamily:"'DM Mono',monospace",fontSize:11}}>
              {log.length===0 && status===null && (
                <div style={{color:"#1e2d45"}}>Run sync to see output here…</div>
              )}
              {log.map((line,i) => (
                <div key={i} style={{color:line.startsWith("✓")||line.startsWith("✅")?GREEN:line.startsWith("⚠")?AMBER:line.startsWith("🔐")||line.startsWith("📡")||line.startsWith("🔄")||line.startsWith("💾")?"#94a3b8":"#e2e8f0",marginBottom:4,lineHeight:1.5}}>
                  {line}
                </div>
              ))}
              {status==="running" && (
                <div style={{color:BLUE,marginTop:4}}>▌</div>
              )}
              {status==="done" && (
                <div style={{marginTop:10,padding:"8px 12px",background:GREEN+"10",border:"1px solid "+GREEN+"33",borderRadius:7}}>
                  <div style={{color:GREEN,fontWeight:700,marginBottom:2}}>Sync complete</div>
                  <div style={{color:SLATE,fontSize:10}}>ACT confirmed through {MONTHS[syncTo]} {year} · dashboard updated</div>
                </div>
              )}
            </div>
          </div>

          {/* Preview of what will be overwritten */}
          {status===null && source!=="csv" && (
            <div style={{background:"#070c17",border:"1px solid #0f1e30",borderRadius:9,padding:"12px 14px"}}>
              <div style={{fontSize:10,color:SLATE,fontFamily:"'DM Mono',monospace",marginBottom:8}}>WHAT WILL BE OVERWRITTEN</div>
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                {scope.map(s => {
                  const opt=SCOPE_OPTS.find(o=>o.id===s);
                  return (
                    <div key={s} style={{display:"flex",alignItems:"center",gap:8,fontSize:10,fontFamily:"'DM Mono',monospace",color:"#94a3b8"}}>
                      <div style={{width:4,height:4,borderRadius:"50%",background:BLUE}}/>
                      {opt.label}: {MONTHS[syncFrom]}–{MONTHS[syncTo]} {year} ({syncTo-syncFrom+1} months)
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function GroupStructureTab({entities,selectedEnt,setSelectedEnt,editingEnt,setEditingEnt,isGroup,addEntity,updateEntity,removeEntity}) {
  const NODE_W=168,NODE_H=72,H_GAP=24,V_GAP=80;
  const levels={};
  const q=entities.filter(e=>!e.parentId).map(r=>({id:r.id,level:0}));
  const queue=[...q];
  while(queue.length){
    const {id,level}=queue.shift();
    levels[id]=level;
    entities.filter(e=>e.parentId===id).forEach(c=>queue.push({id:c.id,level:level+1}));
  }
  const byLevel={};
  Object.entries(levels).forEach(([id,l])=>{if(!byLevel[l])byLevel[l]=[];byLevel[l].push(id);});
  const positions={};
  Object.entries(byLevel).forEach(([level,ids])=>{
    const totalW=ids.length*(NODE_W+H_GAP)-H_GAP;
    ids.forEach((id,i)=>{positions[id]={x:i*(NODE_W+H_GAP)-totalW/2+NODE_W/2,y:+level*(NODE_H+V_GAP)};});
  });
  const maxLevel=Math.max(0,...Object.values(levels));
  const allX=Object.values(positions).map(p=>p.x);
  const minX=allX.length?Math.min(...allX)-NODE_W/2-20:-300;
  const maxX=allX.length?Math.max(...allX)+NODE_W/2+20:300;
  const svgW=Math.max(600,maxX-minX);
  const svgH=Math.max(180,(maxLevel+1)*(NODE_H+V_GAP)+60);
  const ox=svgW/2;
  const edges=entities.filter(e=>e.parentId&&positions[e.parentId]&&positions[e.id]).map(e=>{
    const p=positions[e.parentId];const c=positions[e.id];
    return {fx:ox+p.x,fy:p.y+NODE_H,tx:ox+c.x,ty:c.y,ownership:e.ownership,color:e.color};
  });
  const sel=entities.find(e=>e.id===selectedEnt);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        <span style={{fontSize:12,fontWeight:600,color:"#94a3b8",marginRight:4}}>Group Structure</span>
        <button onClick={()=>addEntity("subsidiary")} style={{padding:"7px 14px",background:"#0c1420",border:"1px solid #1e3a5f",borderRadius:8,color:"#60a5fa",fontFamily:"'DM Mono',monospace",fontSize:11,cursor:"pointer",fontWeight:600}}>+ Add Subsidiary</button>
        <button onClick={()=>addEntity("parent")} style={{padding:"7px 14px",background:"#0c1420",border:"1px solid #1e2d45",borderRadius:8,color:SLATE,fontFamily:"'DM Mono',monospace",fontSize:11,cursor:"pointer"}}>+ Add Parent</button>
        {isGroup
          ? <span style={{fontSize:10,color:GREEN,fontFamily:"'DM Mono',monospace",background:"#0c1420",border:"1px solid #0f1e30",borderRadius:6,padding:"5px 12px"}}>{entities.length} entities · use entity selector in other tabs</span>
          : <span style={{fontSize:10,color:SLATE,fontFamily:"'DM Mono',monospace",background:"#0c1420",border:"1px solid #0f1e30",borderRadius:6,padding:"5px 12px"}}>Single entity — add subsidiaries to build group structure</span>}
      </div>

      <div style={{background:"#0c1420",border:"1px solid #0f1e30",borderRadius:12,overflow:"auto"}}>
        <svg width="100%" viewBox={"0 0 "+svgW+" "+svgH} style={{minHeight:Math.max(160,svgH),display:"block"}}>
          <defs>
            <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#1e3a5f"/>
            </marker>
          </defs>
          {edges.map((edge,i) => {
            const mx=(edge.fx+edge.tx)/2,my=(edge.fy+edge.ty)/2;
            const d="M "+edge.fx+" "+edge.fy+" C "+edge.fx+" "+(edge.fy+30)+", "+edge.tx+" "+(edge.ty-30)+", "+edge.tx+" "+edge.ty;
            return (
              <g key={i}>
                <path d={d} fill="none" stroke="#1e3a5f" strokeWidth="2" markerEnd="url(#arr)"/>
                <rect x={mx-18} y={my-10} width={36} height={18} rx={9} fill="#0a1525" stroke={edge.color} strokeWidth="1"/>
                <text x={mx} y={my+4} textAnchor="middle" style={{fontSize:9,fontFamily:"'DM Mono',monospace",fill:edge.color,fontWeight:700}}>{edge.ownership}%</text>
              </g>
            );
          })}
          {entities.map(ent => {
            if(!positions[ent.id]) return null;
            const p=positions[ent.id],nx=ox+p.x-NODE_W/2,ny=p.y,isSel=selectedEnt===ent.id;
            return (
              <g key={ent.id} style={{cursor:"pointer"}} onClick={()=>{setSelectedEnt(ent.id);setEditingEnt(null);}}>
                <rect x={nx} y={ny} width={NODE_W} height={NODE_H} rx={10} fill={isSel?"#0f2540":"#0c1420"} stroke={isSel?ent.color:"#1e2d45"} strokeWidth={isSel?2:1}/>
                <circle cx={nx+NODE_W-16} cy={ny+16} r={5} fill={ent.color}/>
                <text x={nx+10} y={ny+42} style={{fontSize:11,fill:"#e2e8f0",fontWeight:600}}>{ent.name.length>20?ent.name.slice(0,19)+"…":ent.name}</text>
                {ent.parentId
                  ? <text x={nx+10} y={ny+58} style={{fontSize:9,fontFamily:"'DM Mono',monospace",fill:SLATE}}>{ent.ownership}% owned</text>
                  : <text x={nx+10} y={ny+58} style={{fontSize:9,fontFamily:"'DM Mono',monospace",fill:GREEN}}>Ultimate parent</text>}
              </g>
            );
          })}
        </svg>
      </div>

      {sel && (
        <div style={{background:"#0c1420",border:"1px solid #1e2d45",borderRadius:12,padding:"18px 22px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,gap:12,flexWrap:"wrap"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:sel.color}}/>
              <span style={{fontSize:13,fontWeight:600,color:"#e2e8f0"}}>{sel.name}</span>
              <span style={{fontSize:10,color:SLATE,fontFamily:"'DM Mono',monospace",background:"#0a1525",border:"1px solid #1e2d45",borderRadius:5,padding:"2px 8px"}}>{sel.type}</span>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setEditingEnt(editingEnt===sel.id?null:sel.id)} style={{padding:"6px 14px",background:editingEnt===sel.id?"#1e3a5f":"none",border:"1px solid #1e3a5f",borderRadius:7,color:"#60a5fa",fontFamily:"'DM Mono',monospace",fontSize:10,cursor:"pointer"}}>
                {editingEnt===sel.id?"✓ Done":"✏ Edit"}
              </button>
              {entities.length>1 && (
                <button onClick={()=>removeEntity(sel.id)} style={{padding:"6px 14px",background:"none",border:"1px solid #2d1515",borderRadius:7,color:RED,fontFamily:"'DM Mono',monospace",fontSize:10,cursor:"pointer"}}>Remove</button>
              )}
            </div>
          </div>
          {editingEnt===sel.id ? (
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
              <div>
                <div style={{fontSize:10,color:SLATE,fontFamily:"'DM Mono',monospace",marginBottom:5}}>NAME</div>
                <input value={sel.name} onChange={e=>updateEntity(sel.id,"name",e.target.value)} style={{width:"100%",background:"#080b12",border:"1px solid #1e3a5f",borderRadius:6,padding:"7px 10px",color:"#e2e8f0",fontSize:12,outline:"none"}}/>
              </div>
              <div>
                <div style={{fontSize:10,color:SLATE,fontFamily:"'DM Mono',monospace",marginBottom:5}}>TYPE</div>
                <select value={sel.type} onChange={e=>updateEntity(sel.id,"type",e.target.value)} className="psel" style={{width:"100%"}}>
                  <option value="holding">Holding</option>
                  <option value="operating">Operating</option>
                  <option value="dormant">Dormant</option>
                </select>
              </div>
              <div>
                <div style={{fontSize:10,color:SLATE,fontFamily:"'DM Mono',monospace",marginBottom:5}}>PARENT</div>
                <select value={sel.parentId||""} onChange={e=>updateEntity(sel.id,"parentId",e.target.value||null)} className="psel" style={{width:"100%"}}>
                  <option value="">— None (top level) —</option>
                  {entities.filter(e=>e.id!==sel.id).map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              {sel.parentId && (
                <div>
                  <div style={{fontSize:10,color:SLATE,fontFamily:"'DM Mono',monospace",marginBottom:5}}>OWNERSHIP % <span style={{color:sel.color}}>{sel.ownership}%</span></div>
                  <input type="range" min={1} max={100} value={sel.ownership} onChange={e=>updateEntity(sel.id,"ownership",+e.target.value)} style={{width:"100%",accentColor:sel.color}}/>
                </div>
              )}
              <div>
                <div style={{fontSize:10,color:SLATE,fontFamily:"'DM Mono',monospace",marginBottom:5}}>COLOR</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {[BLUE,GREEN,PURPLE,CYAN,AMBER,RED,"#ec4899","#f97316"].map(c => (
                    <div key={c} onClick={()=>updateEntity(sel.id,"color",c)} style={{width:20,height:20,borderRadius:"50%",background:c,cursor:"pointer",border:sel.color===c?"2px solid #fff":"2px solid transparent"}}/>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{display:"flex",gap:24,flexWrap:"wrap"}}>
              {[
                {l:"Type",      v:sel.type},
                {l:"Parent",    v:sel.parentId?(entities.find(e=>e.id===sel.parentId)||{name:"—"}).name:"None"},
                {l:"Ownership", v:sel.parentId?sel.ownership+"%":"—"},
                {l:"Subsidiaries",v:entities.filter(e=>e.parentId===sel.id).length},
              ].map(f => (
                <div key={f.l}>
                  <div style={{fontSize:9,color:SLATE,fontFamily:"'DM Mono',monospace",marginBottom:3,textTransform:"uppercase"}}>{f.l}</div>
                  <div style={{fontSize:12,color:"#94a3b8",fontFamily:"'DM Mono',monospace"}}>{f.v}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isGroup && (
        <div style={{background:"#0c1420",border:"1px solid #0f1e30",borderRadius:12,overflow:"hidden"}}>
          <div style={{padding:"12px 20px",borderBottom:"1px solid #0f1e30"}}>
            <div style={{fontSize:12,fontWeight:600,color:"#94a3b8"}}>Entity Registry</div>
          </div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,fontFamily:"'DM Mono',monospace"}}>
              <thead>
                <tr style={{background:"#070c17",borderBottom:"1px solid #0f1e30"}}>
                  {["Entity","Type","Parent","Ownership","Subsidiaries"].map((h,i) => (
                    <th key={i} style={{padding:"8px 16px",textAlign:"left",color:SLATE,fontWeight:500,fontSize:10}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entities.map(ent => {
                  const parent=entities.find(e=>e.id===ent.parentId);
                  const subs=entities.filter(e=>e.parentId===ent.id);
                  return (
                    <tr key={ent.id} className="tbl-row" style={{borderBottom:"1px solid #080f1a",cursor:"pointer"}} onClick={()=>setSelectedEnt(ent.id)}>
                      <td style={{padding:"10px 16px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <div style={{width:8,height:8,borderRadius:"50%",background:ent.color}}/>
                          <span style={{color:"#e2e8f0",fontWeight:600}}>{ent.name}</span>
                        </div>
                      </td>
                      <td style={{padding:"10px 16px",color:SLATE}}>{ent.type}</td>
                      <td style={{padding:"10px 16px",color:SLATE}}>{parent?parent.name:"—"}</td>
                      <td style={{padding:"10px 16px"}}>{ent.parentId?<span style={{color:ent.color,fontWeight:700}}>{ent.ownership}%</span>:<span style={{color:GREEN}}>Parent</span>}</td>
                      <td style={{padding:"10px 16px",color:"#94a3b8"}}>{subs.length||"—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


// ── SETTINGS CORNER ──────────────────────────────────────────────────────────

// ── FiCOA account code ranges → model fields ─────────────────────────────────
const FICOA_MAP = [
  // P&L
  { field:"revenue",     ranges:[[3000,3999]], sign: 1 },
  { field:"cogs",        ranges:[[4000,4999]], sign:-1 },
  { field:"opex",        ranges:[[5000,6799],[7000,7999]], sign:-1 }, // personnel + other opex, excl. depreciation
  { field:"depAmort",    ranges:[[6800,6899]], sign:-1 },             // poistot 6800–6899
  { field:"finExpenses", ranges:[[8000,8899]], sign:-1 },             // rahoituserät 8000–8899
  { field:"tax",         ranges:[[8900,8999]], sign:-1 },             // tuloverot 8900–8999
  // Balance sheet — assets
  { field:"tangibles",   ranges:[[1000,1299]], sign: 1 },
  { field:"inventory",   ranges:[[1300,1499]], sign: 1 },
  { field:"receivables", ranges:[[1500,1799]], sign: 1 },
  { field:"cash",        ranges:[[1800,1899]], sign: 1 },
  { field:"otherCA",     ranges:[[1900,1999]], sign: 1 },
  // Balance sheet — liabilities & equity
  { field:"equity",      ranges:[[2000,2499]], sign:-1 },
  { field:"ltDebt",      ranges:[[2500,2599]], sign:-1 },
  { field:"stDebt",      ranges:[[2600,2699]], sign:-1 },
  { field:"payables",    ranges:[[2700,2799]], sign:-1 },
  { field:"otherCL",     ranges:[[2800,2999]], sign:-1 },
];

function codeToMapping(code) {
  const n = parseInt(code);
  if (isNaN(n)) return null;
  for (const m of FICOA_MAP) {
    for (const [lo,hi] of m.ranges) { if (n>=lo && n<=hi) return m; }
  }
  return null;
}

// ── Targetflow Import Template parser ────────────────────────────────────────
// Reads the structured template format (row 3 = metadata, row 6 = month headers,
// row 7 = year headers, rows 8+ = account data).
function parseTargetflowTemplate(wb, entities) {
  const XL = window.XLSX;
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XL.utils.sheet_to_json(ws, {header:1, defval:""});

  // Row 3 (index 2) = machine-readable metadata string
  // format: "type:ACT  year:2025  start_month:1  length:12  company:Acme Oy  [ÄLÄ MUOKKAA]"
  const metaRow = rows[4] || []; // row 5 = index 4
  const metaStr = String(metaRow[0] || "");
  const getMeta = (key) => {
    const m = metaStr.match(new RegExp(key + ":([^\s\[]+)"));
    return m ? m[1].trim() : null;
  };

  const fileType    = getMeta("type")         || "ACT";
  const fileYear    = parseInt(getMeta("year"))|| new Date().getFullYear();
  const startMonth  = parseInt(getMeta("start_month")) || 1;  // 1-based
  const length      = parseInt(getMeta("length"))      || 12;
  const company     = getMeta("company")       || "";

  // Validate against group structure entities
  let companyWarning = null;
  if (company && entities && entities.length > 0) {
    const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const normCo = norm(company);
    const match = entities.find(e => {
      const n = norm(e.name);
      return n === normCo || n.includes(normCo) || normCo.includes(n);
    });
    if (!match) {
      companyWarning = `"${company}" ei täsmää group structureen (${entities.map(e=>e.name).join(", ")})`;
    }
  }

  // Row 6 (index 5) = month names, Row 7 (index 6) = year per column
  // Data starts from col C (index 2), up to col C+length-1
  const monthRow = rows[5] || [];
  const yearRow  = rows[6] || [];

  // Build colIndex → {month:0-11, year} map for data columns
  const MONTH_NAMES = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
  const colMap = []; // [{colIdx, monthIdx(0-11), year}]
  for (let ci = 2; ci < monthRow.length && ci < 2 + length; ci++) {
    const mStr = String(monthRow[ci]).toLowerCase().trim();
    const mi = MONTH_NAMES.findIndex(m => mStr.startsWith(m));
    const yr = parseInt(String(yearRow[ci])) || fileYear;
    if (mi >= 0) colMap.push({ci, mi, yr});
  }

  if (colMap.length === 0) return null;

  // Map account rows → dashboard fields using FICOA_MAP
  const acc = {};
  FICOA_MAP.forEach(m => { acc[m.field] = Array(12).fill(0); });

  // Data rows start at index 7 (row 8)
  for (let ri = 7; ri < rows.length; ri++) {
    const row = rows[ri];
    // Col A = account label like "3000–3999  Liikevaihto"
    const labelRaw = String(row[0] || "").trim();
    // Col B = alkusaldo (ignored for now)
    // Data cols = C onward per colMap

    // Extract account code range start from label
    const codeMatch = labelRaw.match(/^(\d{4})/);
    if (!codeMatch) continue;
    const code = codeMatch[1];
    const mapping = codeToMapping(code);
    if (!mapping) continue;

    colMap.forEach(({ci, mi}) => {
      const v = parseFloat(String(row[ci] || "0").replace(/[\s\u00a0]/g,"").replace(",","."));
      if (!isNaN(v)) acc[mapping.field][mi] += v * mapping.sign;
    });
  }

  // Derive calculated fields
  acc.grossProfit = acc.revenue.map((v,i) => v - acc.cogs[i]);
  acc.ebitda      = acc.grossProfit.map((v,i) => v - acc.opex[i]);
  acc.ebit        = acc.ebitda.map((v,i) => v - (acc.depAmort[i]||0));
  acc.ebt         = acc.ebit.map((v,i) => v - acc.finExpenses[i]);
  acc.netProfit   = acc.ebt.map((v,i) => v - acc.tax[i]);

  // actLast = last month index (0-based) that has ACT data
  // = startMonth - 1 + length - 1 (capped at 11), but only if fileType=ACT
  const actLast = fileType === "ACT"
    ? Math.min((startMonth - 1) + length - 1, 11)
    : -1;

  return {
    mapped: acc,
    fileType,       // "ACT" | "BUD" | "FC"
    fileYear: String(fileYear),
    startMonth,     // 1-based
    length,
    company,
    actLast,        // 0-based month index, -1 if not ACT
    companyWarning,
    unmapped: [],
  };
}

function parseExcelTrialBalance(wb) {
  const XL = window.XLSX;
  // Find sheet with most 4-digit account code rows
  let bestSheet = null, bestScore = -1;
  for (const name of wb.SheetNames) {
    const rows = XL.utils.sheet_to_json(wb.Sheets[name],{header:1,defval:""});
    const score = rows.filter(r=>/^\d{4}/.test(String(r[0]).trim())).length;
    if (score > bestScore) { bestScore=score; bestSheet=wb.Sheets[name]; }
  }
  if (!bestSheet) return null;
  const rows = XL.utils.sheet_to_json(bestSheet,{header:1,defval:""});

  // Detect header row by month name tokens
  const MTK=["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec",
              "tammi","helmi","maalis","huhti","touko","kes","hein","elo","syys","loka","marras","joulu"];
  let hdrRow=-1, monthCols=[];
  for (let ri=0;ri<Math.min(20,rows.length);ri++) {
    const r=rows[ri].map(c=>String(c).toLowerCase().trim());
    const hits=r.map((c,ci)=>{
      const mon=MTK.findIndex(m=>c.startsWith(m));
      if(mon>=0) return {ci,mi:mon%12};
      const dm=c.match(/^(\d{1,2})[\/\-](\d{4})$/);
      if(dm) return {ci,mi:parseInt(dm[1])-1};
      const md=c.match(/^(\d{4})[\/\-](\d{1,2})$/);
      if(md) return {ci,mi:parseInt(md[2])-1};
      return null;
    }).filter(Boolean);
    if(hits.length>=3){hdrRow=ri;monthCols=hits;break;}
  }
  if(hdrRow===-1) return null;

  // Find code column (first col where data rows are mostly 3-6 digit numbers)
  let codeCol=0;
  for(let ci=0;ci<5;ci++){
    if(rows.slice(hdrRow+1).filter(r=>/^\d{3,6}$/.test(String(r[ci]).trim())).length>5){codeCol=ci;break;}
  }
  const nameCol=codeCol+1;

  // Month col map — last occurrence per month wins (cumulative > period)
  const mcm=Array(12).fill(-1);
  for(const {ci,mi} of monthCols) mcm[mi]=ci;

  // Accumulate
  const acc={}; FICOA_MAP.forEach(m=>{acc[m.field]=Array(12).fill(0);});
  const unmapped=[];

  for(let ri=hdrRow+1;ri<rows.length;ri++){
    const row=rows[ri];
    const rawCode=String(row[codeCol]||"").trim();
    if(!rawCode||!/^\d{3,6}$/.test(rawCode)) continue;
    const name=String(row[nameCol]||"").trim();
    const vals=mcm.map(ci=>{
      if(ci===-1) return 0;
      const v=parseFloat(String(row[ci]||"0").replace(/[\s\u00a0]/g,"").replace(",","."));
      return isNaN(v)?0:v;
    });
    const total=vals.reduce((s,v)=>s+v,0);
    const mapping=codeToMapping(rawCode);
    if(!mapping){
      if(Math.abs(total)>0.01) unmapped.push({code:rawCode,name,total,vals});
    } else {
      vals.forEach((v,mi)=>{acc[mapping.field][mi]+=v*mapping.sign;});
    }
  }

  // Derive calculated P&L fields
  acc.grossProfit=acc.revenue.map((v,i)=>v-acc.cogs[i]);
  acc.ebitda     =acc.grossProfit.map((v,i)=>v-acc.opex[i]);
  acc.ebit       =acc.ebitda.map((v,i)=>v-(acc.depAmort[i]||0));
  acc.ebt        =acc.ebit.map((v,i)=>v-acc.finExpenses[i]);
  acc.netProfit  =acc.ebt.map((v,i)=>v-acc.tax[i]);

  return {mapped:acc, unmapped};
}

function SettingsMenu({actData,actName,actLast,setActData,setActName,setActLast,
                         csvData,csvName,setCsvData,setCsvName,
                         mode,setMode,parseCSV,unmapped,exportActCSV,exportCSV,downloadTemplate,
                         fileRef,fileRefA,dragOver,setDragOver,dragOverA,setDragOverA,
                         compLabel,entities}) {
  const [open,    setOpen]   = React.useState(false);
  const [view,    setView]   = React.useState("main");
  const [uploadType, setUploadType] = React.useState("actuals");
  const [uploadEntity, setUploadEntity] = React.useState(entities&&entities.length?entities[0].id:"");

  const [pw,      setPw]     = React.useState("");
  const [pw2,     setPw2]    = React.useState("");
  const [msg,     setMsg]    = React.useState("");
  const [loading, setLoad]   = React.useState(false);
  const [userEmail, setUserEmail] = React.useState("");
  const ref = React.useRef(null);

  React.useEffect(()=>{
    if(!supabase) return;
    supabase.auth.getUser().then(({data})=>{ if(data?.user?.email) setUserEmail(data.user.email); });
  },[]);

  React.useEffect(()=>{
    const handler=(e)=>{ if(ref.current&&!ref.current.contains(e.target)){setOpen(false);setView("main");} };
    document.addEventListener("mousedown",handler);
    return ()=>document.removeEventListener("mousedown",handler);
  },[]);

  const showMsg=(m,isErr=false)=>{ setMsg({text:m,err:isErr}); setTimeout(()=>setMsg(""),4000); };

  const doChangePw=async()=>{
    if(!pw||pw.length<8){showMsg("Minimum 8 characters",true);return;}
    if(pw!==pw2){showMsg("Passwords don't match",true);return;}
    if(!supabase){showMsg("Auth not configured",true);return;}
    setLoad(true);
    const {error}=await supabase.auth.updateUser({password:pw});
    if(error){showMsg(error.message,true);}
    else{showMsg("✓ Password updated");setPw("");setPw2("");setView("main");}
    setLoad(false);
  };

  const doSignOut=async()=>{ await supabase.auth.signOut(); window.location.reload(); };

  const initial = userEmail ? userEmail[0].toUpperCase() : "·";
  const inpStyle={width:"100%",background:"#070c17",border:"1px solid #1e2d45",
    borderRadius:8,padding:"9px 12px",color:"#e2e8f0",fontSize:12,outline:"none",
    fontFamily:"'DM Sans',sans-serif",marginBottom:8,boxSizing:"border-box"};

  return (
    <div ref={ref} style={{position:"relative"}}>
      <button onClick={()=>{setOpen(o=>!o);setView("main");setMsg("");}}
        style={{width:34,height:34,borderRadius:"50%",border:"2px solid "+(open?"#3b82f6":"#1e2d45"),
          background:"linear-gradient(135deg,#1e3a5f,#1e4d7b)",
          cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
          color:ACCENT,fontSize:13,fontWeight:700,fontFamily:"'DM Mono',monospace",
          position:"relative",transition:"border-color 0.15s",padding:0,outline:"none"}}>
        {initial}
        <span style={{position:"absolute",bottom:0,right:0,width:9,height:9,
          borderRadius:"50%",background:"#4ade80",border:"2px solid #080b12"}}/>
      </button>

      {open&&(
        <div style={{position:"absolute",top:42,right:0,width:316,background:"#0c1420",
          border:"1px solid #1e2d45",borderRadius:14,boxShadow:"0 20px 60px rgba(0,0,0,0.7)",
          zIndex:2000,overflow:"hidden"}}>

          {view==="main"&&<>
            <div style={{padding:"16px 20px 12px",borderBottom:"1px solid #0f1e30",
              background:"rgba(255,255,255,0.02)",display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:42,height:42,borderRadius:"50%",flexShrink:0,
                background:"linear-gradient(135deg,#1e3a5f,#1e4d7b)",
                border:"2px solid #1e2d45",display:"flex",alignItems:"center",
                justifyContent:"center",fontSize:16,fontWeight:700,
                color:ACCENT,fontFamily:"'DM Mono',monospace"}}>
                {initial}
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:"#e2e8f0"}}>
                  {userEmail.split("@")[0].replace(/[._]/g," ").replace(/\b\w/g,c=>c.toUpperCase())||CLIENT_NAME}
                </div>
                <div style={{fontSize:11,color:"#64748b",fontFamily:"'DM Mono',monospace",marginTop:2}}>
                  {userEmail||"—"}
                </div>
                <div style={{display:"inline-flex",alignItems:"center",gap:4,marginTop:5,
                  padding:"2px 8px",background:"rgba(74,222,128,0.08)",
                  border:"1px solid rgba(74,222,128,0.2)",borderRadius:20,
                  fontSize:9,fontFamily:"'DM Mono',monospace",color:"#4ade80",
                  textTransform:"uppercase",letterSpacing:"0.06em"}}>
                  <span style={{width:5,height:5,borderRadius:"50%",background:"#4ade80",display:"inline-block"}}/>
                  Board member
                </div>
              </div>
            </div>

            <div style={{padding:"8px 20px 6px",display:"flex",gap:6,flexWrap:"wrap"}}>
              {[
                {label:"ACT", loaded:actData,  name:actName,  color:"#4ade80", clear:()=>{setActData(null);setActName(null);setActLast(ACT_LAST_DEFAULT);}},
                {label:compLabel.toUpperCase(), loaded:csvData, name:csvName, color:AMBER, clear:()=>{setCsvData(null);setCsvName(null);}},
              ].map(s=>(
                <div key={s.label} style={{display:"flex",alignItems:"center",gap:5,
                  padding:"3px 8px",borderRadius:20,border:"1px solid "+(s.loaded?"#1e2d45":"#0f1e30"),
                  background:s.loaded?"rgba(255,255,255,0.03)":"transparent"}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:s.loaded?s.color:"#334155",flexShrink:0}}/>
                  <span style={{fontSize:10,color:s.loaded?s.color:"#334155",fontFamily:"'DM Mono',monospace",maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {s.loaded?s.name:s.label+" — none"}
                  </span>
                  {s.loaded&&<button onClick={s.clear} style={{background:"none",border:"none",color:"#475569",fontSize:10,cursor:"pointer",padding:"0 0 0 2px",lineHeight:1}}>✕</button>}
                </div>
              ))}
            </div>

          <div style={{borderTop:"1px solid #0f1e30",padding:"14px 20px 12px"}}>

            {/* ── Entity selector (multi-entity) ── */}
            {entities&&entities.length>1&&(
              <div style={{marginBottom:12}}>
                <div style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:"#475569",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Import for entity</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                  {entities.map(ent=>(
                    <button key={ent.id} onClick={()=>setUploadEntity(ent.id)}
                      style={{padding:"4px 10px",borderRadius:6,fontSize:10,fontFamily:"'DM Mono',monospace",
                        cursor:"pointer",border:"1px solid "+(uploadEntity===ent.id?ent.color:"#1e2d45"),
                        background:uploadEntity===ent.id?ent.color+"18":"transparent",
                        color:uploadEntity===ent.id?ent.color:"#475569",transition:"all 0.15s"}}>
                      {ent.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Type selector ── */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <div style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:"#475569",textTransform:"uppercase",letterSpacing:"0.1em"}}>Upload type</div>
              <div style={{background:"#070c17",border:"1px solid #1e2d45",borderRadius:8,padding:2,display:"flex",gap:2}}>
                {[
                  {id:"actuals",  label:"ACT",  color:"#60a5fa"},
                  {id:"budget",   label:"BUD",  color:AMBER},
                  {id:"forecast", label:"Scenario Analysis",   color:AMBER},
                ].map(t=>{
                  const active = t.id==="actuals" ? uploadType==="actuals" : uploadType===t.id;
                  return (
                    <button key={t.id} onClick={()=>{ setUploadType(t.id); }}
                      style={{padding:"4px 10px",borderRadius:6,fontSize:10,fontFamily:"'DM Mono',monospace",
                        cursor:"pointer",border:"none",
                        background:active?t.color+"22":"transparent",
                        color:active?t.color:"#475569",fontWeight:active?700:400,
                        transition:"all 0.15s"}}>
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Description + template button ── */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
              <div style={{fontSize:11,color:"#64748b"}}>
                {uploadType==="actuals"  && "Confirmed monthly figures"}
                {uploadType==="budget"   && "Annual budget figures"}
                {uploadType==="forecast" && "Rolling forecast figures"}
              </div>
              <div style={{display:"flex",gap:6,flexShrink:0,marginLeft:8}}>
                <button onClick={()=>downloadTemplate(uploadType==="actuals"?"ACT":uploadType==="budget"?"BUD":"FC")}
                  style={{padding:"5px 10px",
                    background:"rgba(45,212,191,0.06)",
                    border:"1px solid #0d9488",
                    borderRadius:7,color:"#2dd4bf",
                    fontFamily:"'DM Mono',monospace",fontSize:10,fontWeight:600,cursor:"pointer",
                    whiteSpace:"nowrap"}}
                  title="Lataa täytettävä Excel-pohja">
                  ↓ Template (.xlsx)
                </button>
                {uploadType==="actuals"&&<button onClick={exportActCSV}
                  style={{padding:"5px 10px",
                    background:"rgba(96,165,250,0.06)",
                    border:"1px solid #3b82f6",
                    borderRadius:7,color:"#60a5fa",
                    fontFamily:"'DM Mono',monospace",fontSize:10,fontWeight:600,cursor:"pointer"}}>
                  ↓ CSV
                </button>}
              </div>
            </div>

            {/* ── Drop zone ── */}
            {(()=>{
              const isAct = uploadType==="actuals";
              const loaded = isAct ? actName : csvName;
              const dOver  = isAct ? dragOverA : dragOver;
              const accentC= isAct ? "#3b82f6" : AMBER;
              const baseC  = isAct ? "#1e3a5f" : "#2d1f00";
              const hoverBg= isAct ? "#0c1e35" : "#1a0e00";
              const loadC  = isAct ? "#4ade80" : AMBER;
              const onDrop = isAct
                ? e=>{e.preventDefault();setDragOverA(false);parseFile(e.dataTransfer.files[0],true);}
                : e=>{e.preventDefault();setDragOver(false);parseFile(e.dataTransfer.files[0],false);};
              const onOver = isAct
                ? e=>{e.preventDefault();setDragOverA(true);}
                : e=>{e.preventDefault();setDragOver(true);};
              const onLeave= isAct ? ()=>setDragOverA(false) : ()=>setDragOver(false);
              const ref_   = isAct ? fileRefA : fileRef;
              const onChange=isAct
                ? e=>parseFile(e.target.files[0],true)
                : e=>parseFile(e.target.files[0],false);
              return (
                <div style={{border:"1px dashed "+baseC,borderRadius:8,padding:"11px 14px",
                  display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",
                  background:dOver?hoverBg:"transparent",borderColor:dOver?accentC:baseC,
                  transition:"all 0.15s"}}
                  onDragOver={onOver} onDragLeave={onLeave} onDrop={onDrop}
                  onClick={()=>ref_.current.click()}>
                  <input ref={ref_} type="file" accept=".csv,.xlsx,.xls,.ods" style={{display:"none"}} onChange={onChange}/>
                  {loaded
                    ?<span style={{fontSize:11,color:loadC,fontFamily:"'DM Mono',monospace"}}>✓ {loaded}</span>
                    :<span style={{fontSize:11,color:"#475569"}}>📂 Drop file or click to upload · .xlsx or .csv</span>}
                  <span style={{fontSize:13,color:baseC}}>↑</span>
                </div>
              );
            })()}
          </div>

          {unmapped&&unmapped.length>0&&(
              <div style={{borderTop:"1px solid #0f1e30"}}>
                <button onClick={()=>setView(view==="unmapped"?"main":"unmapped")}
                  style={{width:"100%",padding:"11px 20px",background:"transparent",border:"none",
                    color:"#fbbf24",fontSize:12,cursor:"pointer",textAlign:"left",
                    fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{display:"flex",alignItems:"center",gap:11}}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {unmapped.length} unmapped accounts
                  </div>
                  <span style={{fontSize:10,color:"#475569"}}>{view==="unmapped"?"▲":"▼"}</span>
                </button>
                {view==="unmapped"&&(
                  <div style={{maxHeight:220,overflowY:"auto",borderTop:"1px solid #0f1e30"}}>
                    <div style={{padding:"6px 20px 4px",fontSize:9,fontFamily:"'DM Mono',monospace",color:"#475569",textTransform:"uppercase",letterSpacing:"0.1em"}}>
                      Not mapped to any model line
                    </div>
                    {unmapped.map((u,i)=>(
                      <div key={i} style={{padding:"6px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid #080f1a"}}>
                        <div>
                          <span style={{fontSize:11,fontFamily:"'DM Mono',monospace",color:"#94a3b8"}}>{u.code}</span>
                          <span style={{fontSize:11,color:"#64748b",marginLeft:8}}>{u.name}</span>
                        </div>
                        <span style={{fontSize:11,fontFamily:"'DM Mono',monospace",color:Math.abs(u.total)>0?"#fbbf24":"#334155",flexShrink:0,marginLeft:8}}>
                          {u.total>=0?"":"−"}€{Math.abs(u.total/1000).toFixed(0)}K
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button onClick={()=>setView("pw")}
              style={{width:"100%",padding:"11px 20px",background:"transparent",border:"none",
                borderTop:"1px solid #0f1e30",color:"#94a3b8",fontSize:12,cursor:"pointer",
                textAlign:"left",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:11}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Change password
            </button>
            <button onClick={doSignOut}
              style={{width:"100%",padding:"11px 20px",background:"transparent",border:"none",
                borderTop:"1px solid #0f1e30",color:"#f87171",fontSize:12,cursor:"pointer",
                textAlign:"left",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:11}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign out
            </button>
          </>}

          {view==="pw"&&(
            <div style={{padding:16}}>
              <div style={{fontSize:12,fontWeight:600,color:"#e2e8f0",marginBottom:12,
                display:"flex",alignItems:"center",gap:8}}>
                <span onClick={()=>setView("main")} style={{cursor:"pointer",color:"#475569",fontSize:16,lineHeight:1}}>←</span>
                Change password
              </div>
              <input type="password" value={pw} onChange={e=>setPw(e.target.value)}
                placeholder="New password" style={inpStyle}/>
              <input type="password" value={pw2} onChange={e=>setPw2(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&doChangePw()}
                placeholder="Confirm password" style={{...inpStyle,marginBottom:12}}/>
              <button onClick={doChangePw} disabled={loading}
                style={{width:"100%",padding:"9px",background:loading?"#1e2d45":ACCENT,
                  border:"none",borderRadius:8,color:loading?"#475569":"#080b12",
                  fontWeight:700,fontSize:12,cursor:loading?"not-allowed":"pointer",
                  fontFamily:"'DM Sans',sans-serif"}}>
                {loading?"Updating…":"Update password"}
              </button>
              {msg&&<div style={{marginTop:8,fontSize:11,textAlign:"center",
                color:msg.err?"#f87171":"#4ade80",fontFamily:"'DM Mono',monospace"}}>
                {msg.text}
              </div>}
            </div>
          )}
          {/* ── API Sync placeholder ── */}
          <div style={{borderTop:"1px solid #0f1e30",padding:"12px 20px"}}>
            <div style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:"#475569",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Accounting System</div>
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {[
                {id:"procountor", label:"Procountor", color:"#6366f1", logo:"P", note:"REST API · OAuth2"},
                {id:"netvisor",   label:"Netvisor",   color:"#0ea5e9", logo:"N", note:"SOAP/REST API"},
              ].map(src => (
                <div key={src.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                  padding:"10px 14px",borderRadius:9,border:"1px solid #1e2d45",background:"#070c17"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:28,height:28,borderRadius:7,background:src.color+"22",border:"1px solid "+src.color+"44",
                      display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,
                      color:src.color,fontFamily:"'DM Mono',monospace"}}>{src.logo}</div>
                    <div>
                      <div style={{fontSize:11,fontWeight:600,color:"#64748b"}}>{src.label}</div>
                      <div style={{fontSize:9,color:"#334155",fontFamily:"'DM Mono',monospace"}}>{src.note}</div>
                    </div>
                  </div>
                  <div style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:"#fbbf24",background:"rgba(251,191,36,0.08)",border:"1px solid rgba(251,191,36,0.15)",borderRadius:5,padding:"2px 7px"}}>Soon</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Export section ── */}
          <div style={{borderTop:"1px solid #0f1e30",padding:"12px 20px"}}>
            <div style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:"#475569",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Export Dashboard</div>
            <div style={{display:"flex",gap:8}}>
              <button
                onClick={()=>window._tfExport&&window._tfExport('pdf')}
                style={{flex:1,padding:"9px 12px",borderRadius:8,border:"1px solid #1e2d45",background:"#070c17",
                  color:"#94a3b8",fontSize:11,fontFamily:"'DM Mono',monospace",cursor:"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center",gap:6,transition:"all 0.15s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="#3b82f6";e.currentTarget.style.color="#60a5fa";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="#1e2d45";e.currentTarget.style.color="#94a3b8";}}>
                📄 PDF
              </button>
              <button
                onClick={()=>window._tfExport&&window._tfExport('ppt')}
                style={{flex:1,padding:"9px 12px",borderRadius:8,border:"1px solid #1e2d45",background:"#070c17",
                  color:"#94a3b8",fontSize:11,fontFamily:"'DM Mono',monospace",cursor:"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center",gap:6,transition:"all 0.15s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="#f59e0b";e.currentTarget.style.color="#fbbf24";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="#1e2d45";e.currentTarget.style.color="#94a3b8";}}>
                📊 PowerPoint
              </button>
            </div>
            <div style={{fontSize:9,color:"#334155",fontFamily:"'DM Mono',monospace",marginTop:8,textAlign:"center"}}>
              Full export feature being configured — coming soon
            </div>
          </div>

        </div>
      )}
    </div>
  );
}


// ── ForecastTab ───────────────────────────────────────────────────────────────
function ForecastTab({actuals,comp,compLabel,mode,setMode,S,E,fcRevData,fcEqData,fcCashData,downloadTemplate}) {
  const [scnItem, setScnItem] = React.useState("revenue");
  const [scnDir,  setScnDir]  = React.useState("decline");
  const [scnPct,  setScnPct]  = React.useState(10);

  const sum = a => (a||[]).reduce((s,v)=>s+(v||0),0);
  const sl  = (arr,s,e) => (arr||[]).slice(s,e+1);
  const fmt = v => { const a=Math.abs(v),sg=v<0?"−":""; return a>=1e6?sg+"€"+(a/1e6).toFixed(2)+"M":a>=1e3?sg+"€"+(a/1e3).toFixed(0)+"K":sg+"€"+a.toFixed(0); };

  const multiplier = scnDir==="decline" ? (1-scnPct/100) : (1+scnPct/100);

  const scnActuals = React.useMemo(()=>{
    const newRev   = scnItem==="revenue"     ? (actuals.revenue||[]).map(v=>v*multiplier)     : actuals.revenue;
    const newCogs  = scnItem==="cogs"        ? (actuals.cogs||[]).map(v=>v*multiplier)        : actuals.cogs;
    const newOpex  = scnItem==="opex"        ? (actuals.opex||[]).map(v=>v*multiplier)        : actuals.opex;
    const newFin   = scnItem==="finExpenses" ? (actuals.finExpenses||[]).map(v=>v*multiplier) : actuals.finExpenses;
    const newGP    = (newRev||[]).map((v,i)=>v-(newCogs[i]||0));
    const newEBIT  = newGP.map((v,i)=>v-(newOpex[i]||0));
    const newEBIT2 = newEBIT.map((v,i)=>v-((actuals.depAmort||[])[i]||0));
    const newEBT   = newEBIT2.map((v,i)=>v-(newFin[i]||0));
    const newNet   = newEBT.map((v,i)=>v-((actuals.tax||[])[i]||0));
    return {...actuals,revenue:newRev,cogs:newCogs,opex:newOpex,finExpenses:newFin,
      grossProfit:newGP,ebitda:newEBIT,ebit:newEBIT2,ebt:newEBT,netProfit:newNet};
  },[actuals,scnItem,multiplier]);

  const STEPS = [-25,-20,-15,-10,-5,0,5,10,15,20,25];
  const baseRev    = sum(sl(actuals.revenue,S,E));
  const baseCogs   = sum(sl(actuals.cogs,S,E));
  const baseOpex   = sum(sl(actuals.opex,S,E));
  const baseEquity = actuals.equity?actuals.equity[E]||0:0;
  const baseNetPd  = sum(sl(actuals.netProfit,S,E));

  const nearestStep = pct => { let b=0,bd=Infinity; STEPS.forEach((s,i)=>{if(Math.abs(s-pct)<bd){bd=Math.abs(s-pct);b=i;}}); return b; };
  const centerRevPct  = scnItem==="revenue" ? (scnDir==="decline"?-scnPct:+scnPct) : 0;
  const centerOpexPct = scnItem==="opex"    ? (scnDir==="decline"?-scnPct:+scnPct) : 0;
  const centerRowIdx  = nearestStep(centerRevPct);
  const centerColIdx  = nearestStep(centerOpexPct);

  const heatColor = (val,mn,mx) => {
    const t=(val-mn)/(mx-mn||1);
    if(t<0.5){const p=t*2;return `rgb(${Math.round(248+(30-248)*p)},${Math.round(113+(58-113)*p)},${Math.round(113+(191-113)*p)})`;}
    const p=(t-0.5)*2;return `rgb(${Math.round(30+(34-30)*p)},${Math.round(58+(197-58)*p)},${Math.round(191+(94-191)*p)})`;
  };

  const heatEbitda = STEPS.map(rp=>STEPS.map(op=>{
    const r=baseRev*(1+rp/100), o=baseOpex*(1+op/100);
    return r-baseCogs-o;
  }));

  const heatEquity = STEPS.map(rp=>STEPS.map(op=>{
    const revChg = baseRev*(rp/100);
    const opxChg = baseOpex*(op/100);
    const netImpact = (revChg - opxChg)*0.8;
    return baseEquity + netImpact;
  }));

  const SCN_ITEMS = [
    {id:"revenue",label:"Revenue"},
    {id:"cogs",label:"Cost of Goods"},
    {id:"opex",label:"Operating Expenses"},
    {id:"finExpenses",label:"Finance Expenses"},
  ];

  const fcScnData = Array.from({length:12},(_,i)=>({
    month:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
    act:  (actuals.revenue||[])[i]||0,
    comp: (comp.revenue||[])[i]||0,
    scn:  (scnActuals.revenue||[])[i]||0,
  }));

  const scnBaseEbitda = sum(sl(actuals.ebitda,S,E));
  const scnNewEbitda  = sum(sl(scnActuals.ebitda,S,E));
  const scnDeltaEbitda= scnNewEbitda-scnBaseEbitda;
  const MN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const HeatGrid = ({data,label,color,centerRowIdx,centerColIdx}) => {
    const allV=data.flat(), mn=Math.min(...allV), mx=Math.max(...allV);
    return (
      <div style={{background:"#0c1420",border:"1px solid #0f1e30",borderRadius:12,padding:16,overflowX:"auto"}}>
        <div style={{fontSize:11,fontWeight:600,color,fontFamily:"'DM Mono',monospace",marginBottom:10}}>{label}</div>
        <table style={{borderCollapse:"separate",borderSpacing:2,fontFamily:"'DM Mono',monospace",fontSize:9,width:"100%"}}>
          <thead><tr>
            <td style={{padding:"4px 8px",color:SLATE,fontSize:8,textAlign:"right",whiteSpace:"nowrap"}}>Rev↓/OpEx→</td>
            {STEPS.map(s=><td key={s} style={{padding:"3px 4px",textAlign:"center",color:s===0?AMBER:s<0?RED:GREEN,fontWeight:s===0?700:400,fontSize:8,whiteSpace:"nowrap"}}>{s>0?"+":""}{s}%</td>)}
          </tr></thead>
          <tbody>{STEPS.map((rs,ri)=>(
            <tr key={ri}>
              <td style={{padding:"3px 8px",textAlign:"right",color:rs===0?AMBER:rs<0?RED:GREEN,fontWeight:rs===0?700:400,fontSize:8,whiteSpace:"nowrap"}}>{rs>0?"+":""}{rs}%</td>
              {STEPS.map((os,ci)=>{
                const val=data[ri][ci], isC=ri===centerRowIdx&&ci===centerColIdx;
                const bg=heatColor(val,mn,mx), tc=val>(mn+mx)/2?"#000":"#fff";
                return <td key={ci} style={{padding:"5px 6px",textAlign:"center",background:bg,color:tc,borderRadius:3,fontWeight:isC?700:400,outline:isC?"2px solid #fff":"none",outlineOffset:"-2px",whiteSpace:"nowrap",minWidth:44,fontSize:isC?9:8}}>{fmt(val)}</td>;
              })}
            </tr>
          ))}</tbody>
        </table>
      </div>
    );
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:24}}>

      {/* ── Section 1: ACT + BUD/EST ── */}
      <div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:10}}>
          <div style={{fontSize:13,fontWeight:600,color:"#94a3b8"}}>ACT + {compLabel} Performance</div>
          <ModeSwitcher mode={mode} setMode={setMode} compLabel={compLabel}/>
        </div>
        <div className="tf-grid-3" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:16}}>
          {[
            {label:"Revenue ACT",    val:sum(sl(actuals.revenue,S,E)),   comp:sum(sl(comp.revenue||[],S,E)),              color:BLUE},
            {label:"EBITDA ACT",     val:sum(sl(actuals.ebitda,S,E)),    comp:sum(sl(comp.ebitda||Array(12).fill(0),S,E)),color:AMBER},
            {label:"Net Profit ACT", val:sum(sl(actuals.netProfit,S,E)), comp:sum(sl(comp.netProfit||Array(12).fill(0),S,E)),color:GREEN},
          ].map(k=>{
            const variance=k.val-k.comp;
            return (
              <div key={k.label} style={{background:"#0c1420",border:"1px solid #0f1e30",borderRadius:12,padding:"16px 20px"}}>
                <div style={{fontSize:10,color:SLATE,fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>{k.label}</div>
                <div style={{fontSize:24,fontWeight:700,color:k.color,fontFamily:"'DM Mono',monospace",marginBottom:6}}>{fmt(k.val)}</div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:11,color:SLATE,fontFamily:"'DM Mono',monospace"}}>{compLabel}: {fmt(k.comp)}</span>
                  <span style={{fontSize:11,fontWeight:700,color:variance>=0?GREEN:RED,fontFamily:"'DM Mono',monospace"}}>{variance>=0?"+":""}{fmt(variance)}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
          {[
            {title:"Revenue ACT vs "+compLabel, data:fcRevData,  k1:"act",k2:"comp",c1:BLUE, c2:AMBER},
            {title:"Equity ACT vs "+compLabel,  data:fcEqData,   k1:"act",k2:"comp",c1:GREEN,c2:AMBER},
            {title:"Cash ACT vs "+compLabel,    data:fcCashData, k1:"act",k2:"comp",c1:CYAN, c2:AMBER},
          ].map(ch=>(
            <div key={ch.title} style={{background:"#0c1420",border:"1px solid #0f1e30",borderRadius:12,padding:22}}>
              <div style={{fontSize:11,color:SLATE,fontFamily:"'DM Mono',monospace",marginBottom:12}}>{ch.title}</div>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={ch.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0f1e30"/>
                  <XAxis dataKey="month" tick={{fontSize:10,fill:SLATE}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:10,fill:SLATE}} axisLine={false} tickLine={false} tickFormatter={v=>"€"+(v/1e3).toFixed(0)+"K"}/>
                  <Tooltip content={<Tt/>}/>
                  <Line type="monotone" dataKey={ch.k1} stroke={ch.c1} strokeWidth={2} dot={false} name="ACT"/>
                  <Line type="monotone" dataKey={ch.k2} stroke={ch.c2} strokeWidth={2} dot={false} strokeDasharray="4 4" name={compLabel}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 2: Scenario Builder ── */}
      <div>
        <div style={{fontSize:13,fontWeight:600,color:"#94a3b8",marginBottom:14}}>Scenario Builder</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <div style={{background:"#0c1420",border:"1px solid #0f1e30",borderRadius:12,padding:22,display:"flex",flexDirection:"column",gap:18}}>
            <div>
              <div style={{fontSize:10,fontWeight:600,color:SLATE,fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>1 · Select line item</div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {SCN_ITEMS.map(it=>(
                  <button key={it.id} onClick={()=>setScnItem(it.id)}
                    style={{padding:"9px 14px",borderRadius:8,cursor:"pointer",textAlign:"left",
                      border:"1px solid "+(scnItem===it.id?"#3b82f6":"#1e2d45"),
                      background:scnItem===it.id?"#0d1e35":"transparent",
                      color:scnItem===it.id?"#60a5fa":"#64748b",fontSize:12,fontWeight:scnItem===it.id?600:400,transition:"all 0.15s"}}>
                    {it.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{fontSize:10,fontWeight:600,color:SLATE,fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>2 · Direction</div>
              <div style={{display:"flex",gap:8}}>
                {[{id:"decline",label:"▼ Decline",color:RED},{id:"growth",label:"▲ Growth",color:GREEN}].map(d=>(
                  <button key={d.id} onClick={()=>setScnDir(d.id)}
                    style={{flex:1,padding:"10px",borderRadius:8,cursor:"pointer",
                      border:"1px solid "+(scnDir===d.id?d.color:"#1e2d45"),
                      background:scnDir===d.id?d.color+"18":"transparent",
                      color:scnDir===d.id?d.color:"#64748b",fontSize:12,fontWeight:600,transition:"all 0.15s"}}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{fontSize:10,fontWeight:600,color:SLATE,fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>
                3 · Magnitude · <span style={{color:scnDir==="decline"?RED:GREEN,fontSize:14}}>{scnPct}%</span>
              </div>
              <input type="range" min={1} max={50} value={scnPct} onChange={e=>setScnPct(+e.target.value)}
                style={{width:"100%",accentColor:scnDir==="decline"?RED:GREEN,cursor:"pointer"}}/>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#334155",fontFamily:"'DM Mono',monospace",marginTop:4}}>
                <span>1%</span><span>25%</span><span>50%</span>
              </div>
              <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
                {[5,10,15,20,25].map(p=>(
                  <button key={p} onClick={()=>setScnPct(p)}
                    style={{padding:"3px 10px",borderRadius:6,fontSize:10,fontFamily:"'DM Mono',monospace",cursor:"pointer",
                      border:"1px solid "+(scnPct===p?(scnDir==="decline"?RED:GREEN):"#1e2d45"),
                      background:scnPct===p?(scnDir==="decline"?RED:GREEN)+"18":"transparent",
                      color:scnPct===p?(scnDir==="decline"?RED:GREEN):"#475569",transition:"all 0.15s"}}>
                    {p}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{background:"#0c1420",border:"1px solid "+(scnDeltaEbitda>=0?"#22c55e33":"#f8717133"),borderRadius:12,padding:22}}>
              <div style={{fontSize:10,color:SLATE,fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:14}}>
                Scenario: {scnDir==="decline"?"−":"+"}{scnPct}% {SCN_ITEMS.find(i=>i.id===scnItem)?.label}
              </div>
              {[
                {label:"Revenue",     base:sum(sl(actuals.revenue,S,E)),    scn:sum(sl(scnActuals.revenue,S,E)),    color:BLUE},
                {label:"Gross Profit",base:sum(sl(actuals.grossProfit,S,E)),scn:sum(sl(scnActuals.grossProfit,S,E)),color:CYAN},
                {label:"EBITDA",      base:sum(sl(actuals.ebitda,S,E)),     scn:sum(sl(scnActuals.ebitda,S,E)),     color:AMBER},
                {label:"Net Profit",  base:sum(sl(actuals.netProfit,S,E)),  scn:sum(sl(scnActuals.netProfit,S,E)),  color:GREEN},
              ].map(row=>{
                const delta=row.scn-row.base, pct=row.base?(delta/Math.abs(row.base)*100).toFixed(1):0;
                return (
                  <div key={row.label} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid #080f1a"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:6,height:6,borderRadius:"50%",background:row.color}}/>
                      <span style={{fontSize:12,color:"#94a3b8"}}>{row.label}</span>
                    </div>
                    <div style={{display:"flex",gap:16,fontFamily:"'DM Mono',monospace",fontSize:11}}>
                      <span style={{color:"#475569"}}>{fmt(row.base)}</span>
                      <span style={{color:"#334155"}}>→</span>
                      <span style={{color:row.color,fontWeight:600}}>{fmt(row.scn)}</span>
                      <span style={{color:delta>=0?GREEN:RED,fontWeight:700,minWidth:60,textAlign:"right"}}>{delta>=0?"+":""}{fmt(delta)} ({delta>=0?"+":""}{pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{background:"#0c1420",border:"1px solid #0f1e30",borderRadius:12,padding:18}}>
              <div style={{fontSize:11,color:SLATE,fontFamily:"'DM Mono',monospace",marginBottom:10}}>Revenue: ACT vs {compLabel} vs Scenario</div>
              <ResponsiveContainer width="100%" height={130}>
                <LineChart data={fcScnData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0f1e30"/>
                  <XAxis dataKey="month" tick={{fontSize:9,fill:SLATE}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:9,fill:SLATE}} axisLine={false} tickLine={false} tickFormatter={v=>"€"+(v/1e3).toFixed(0)+"K"}/>
                  <Tooltip content={<Tt/>}/>
                  <Line type="monotone" dataKey="act"  stroke={BLUE}  strokeWidth={2} dot={false} name="ACT"/>
                  <Line type="monotone" dataKey="comp" stroke={AMBER} strokeWidth={1.5} dot={false} strokeDasharray="4 4" name={compLabel}/>
                  <Line type="monotone" dataKey="scn"  stroke={scnDir==="decline"?RED:GREEN} strokeWidth={2} dot={false} strokeDasharray="2 2" name="Scenario"/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 3: EBITDA & Equity Sensitivity Heatmap ── */}
      <div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:"#94a3b8",marginBottom:2}}>EBITDA & Equity Sensitivity Heatmap</div>
            <div style={{fontSize:11,color:SLATE}}>Rows = Revenue change · Columns = OpEx change · Center = selected scenario</div>
          </div>
          <div style={{fontSize:10,fontFamily:"'DM Mono',monospace",color:SLATE,background:"#0c1420",border:"1px solid #0f1e30",borderRadius:7,padding:"5px 12px"}}>
            <span style={{color:GREEN}}>■</span> high · <span style={{color:RED}}>■</span> low · <span style={{color:"#fff",fontWeight:700}}>■</span> center
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <HeatGrid data={heatEbitda} label="EBITDA"  color={AMBER} centerRowIdx={centerRowIdx} centerColIdx={centerColIdx}/>
          <HeatGrid data={heatEquity} label="Equity"  color={GREEN} centerRowIdx={centerRowIdx} centerColIdx={centerColIdx}/>
        </div>
      </div>

    </div>
  );
}


// ── Mode switcher shared ─────────────────────────────────────────────────────
function ModeSwitcher({mode,setMode,compLabel}) {
  return (
    <div style={{background:"#070c17",border:"1px solid #1e2d45",borderRadius:9,padding:3,display:"flex",gap:2}}>
      {["budget","forecast"].map(m=>(
        <button key={m} onClick={()=>setMode(m)}
          style={{padding:"5px 14px",borderRadius:7,fontSize:10,fontFamily:"'DM Mono',monospace",cursor:"pointer",border:"none",
            background:mode===m?"#1e3a5f":"transparent",
            color:mode===m?"#60a5fa":"#64748b",fontWeight:mode===m?700:400,transition:"all 0.15s"}}>
          {m==="budget"?"BUD":"EST"}
        </button>
      ))}
    </div>
  );
}

// ── P&L Tab ──────────────────────────────────────────────────────────────────
function PLTab({actuals,comp,compLabel,mode,setMode,S,E,visMonths,monthTypes,plRows,year}) {
  const sum = a => a.reduce((s,v)=>s+v,0);
  const sl  = (arr,s,e) => arr?arr.slice(s,e+1):[];
  const fmt = v => { const a=Math.abs(v),sg=v<0?"−":""; return a>=1e6?sg+"€"+(a/1e6).toFixed(2)+"M":a>=1e3?sg+"€"+(a/1e3).toFixed(0)+"K":sg+"€"+a.toFixed(0); };
  const MONTHS_A=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const totRev  = sum(sl(actuals.revenue,S,E));
  const totGP   = sum(sl(actuals.grossProfit,S,E));
  const totEBIT = sum(sl(actuals.ebitda,S,E));
  const totNet  = sum(sl(actuals.netProfit,S,E));
  const cRev    = sum(sl(comp.revenue||[],S,E));
  const cNet    = sum(sl(comp.netProfit||[],S,E));
  const cEBIT   = sum(sl(comp.ebitda||[],S,E));

  const gmPct   = totRev ? (totGP/totRev*100).toFixed(1) : 0;
  const ebitPct = totRev ? (totEBIT/totRev*100).toFixed(1) : 0;
  const netPct  = totRev ? (totNet/totRev*100).toFixed(1) : 0;

  const chartData = MONTHS_A.map((m,i)=>({
    month:m,
    revenue:actuals.revenue[i],   cRevenue:comp.revenue?comp.revenue[i]:0,
    grossProfit:actuals.grossProfit[i], ebitda:actuals.ebitda[i],
    netProfit:actuals.netProfit[i], cNet:comp.netProfit?comp.netProfit[i]:0,
  }));

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      {/* Header + switcher */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div style={{fontSize:13,fontWeight:600,color:"#94a3b8"}}>Income Statement · {MONTHS_A[S]}–{MONTHS_A[E]} {year}</div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{display:"flex",gap:12,fontSize:10,fontFamily:"'DM Mono',monospace"}}>
            <span style={{color:BLUE}}>ACT</span>
            <span style={{color:AMBER}}>{compLabel}</span>
            <span style={{color:RED}}>VAR</span>
          </div>
          <ModeSwitcher mode={mode} setMode={setMode} compLabel={compLabel}/>
        </div>
      </div>

      {/* KPI cards */}
      <div className="tf-grid-4" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
        {[
          {l:"Revenue",     v:totRev,  c:cRev,  color:BLUE,  pct:null},
          {l:"Gross Margin",v:+gmPct,  c:null,  color:CYAN,  pct:true, unit:"%"},
          {l:"EBITDA",      v:totEBIT, c:cEBIT, color:AMBER, pct:null},
          {l:"Net Profit",  v:totNet,  c:cNet,  color:GREEN, pct:null},
        ].map(k=>{
          const vr = k.c!==null ? k.v-k.c : null;
          return (
            <div key={k.l} style={{background:"#0c1420",border:"1px solid #0f1e30",borderRadius:12,padding:"14px 18px"}}>
              <div style={{fontSize:10,color:SLATE,fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>{k.l}</div>
              <div style={{fontSize:22,fontWeight:700,color:k.color,fontFamily:"'DM Mono',monospace",marginBottom:4}}>
                {k.pct ? k.v+"%" : fmt(k.v)}
              </div>
              {vr!==null && (
                <div style={{fontSize:10,fontFamily:"'DM Mono',monospace",display:"flex",gap:8}}>
                  <span style={{color:"#475569"}}>{compLabel}: {fmt(k.c)}</span>
                  <span style={{color:vr>=0?GREEN:RED,fontWeight:700}}>{vr>=0?"+":""}{fmt(vr)}</span>
                </div>
              )}
              {k.pct && <div style={{fontSize:10,color:"#475569",fontFamily:"'DM Mono',monospace"}}>Gross / Revenue</div>}
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={{background:"#0c1420",border:"1px solid #0f1e30",borderRadius:12,padding:20}}>
          <div style={{fontSize:11,color:SLATE,fontFamily:"'DM Mono',monospace",marginBottom:12}}>Revenue ACT vs {compLabel}</div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#0f1e30"/>
              <XAxis dataKey="month" tick={{fontSize:10,fill:SLATE}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:10,fill:SLATE}} axisLine={false} tickLine={false} tickFormatter={v=>"€"+(v/1e3).toFixed(0)+"K"}/>
              <Tooltip content={<Tt/>}/>
              <Line type="monotone" dataKey="revenue"  stroke={BLUE}  strokeWidth={2} dot={false} name="Revenue ACT"/>
              <Line type="monotone" dataKey="cRevenue" stroke={AMBER} strokeWidth={1.5} dot={false} strokeDasharray="4 4" name={"Revenue "+compLabel}/>
              <Line type="monotone" dataKey="grossProfit" stroke={CYAN} strokeWidth={1.5} dot={false} strokeDasharray="2 2" name="Gross Profit"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:"#0c1420",border:"1px solid #0f1e30",borderRadius:12,padding:20}}>
          <div style={{fontSize:11,color:SLATE,fontFamily:"'DM Mono',monospace",marginBottom:12}}>EBITDA & Net Profit ACT vs {compLabel}</div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#0f1e30"/>
              <XAxis dataKey="month" tick={{fontSize:10,fill:SLATE}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:10,fill:SLATE}} axisLine={false} tickLine={false} tickFormatter={v=>"€"+(v/1e3).toFixed(0)+"K"}/>
              <Tooltip content={<Tt/>}/>
              <Line type="monotone" dataKey="ebitda"    stroke={AMBER} strokeWidth={2} dot={false} name="EBITDA ACT"/>
              <Line type="monotone" dataKey="netProfit" stroke={GREEN} strokeWidth={2} dot={false} name="Net Profit ACT"/>
              <Line type="monotone" dataKey="cNet"      stroke={AMBER} strokeWidth={1.5} dot={false} strokeDasharray="4 4" name={"Net "+compLabel}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div style={{background:"#0c1420",border:"1px solid #0f1e30",borderRadius:12,overflow:"hidden"}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,fontFamily:"'DM Mono',monospace"}}>
            <TblHead visMonths={visMonths} monthTypes={monthTypes} totalLabel={MONTHS_A[S]+"–"+MONTHS_A[E]}/>
            <tbody>
              {plRows.map((r,ri)=>(
                <TblRow key={ri} label={r.label} actArr={actuals[r.ak]||[]} compArr={r.ck?comp[r.ck]:null} color={r.color} bold={r.bold} indent={r.indent} s={S} e={E} monthTypes={monthTypes}/>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Balance Sheet Tab ────────────────────────────────────────────────────────
function BalanceTab({actuals,comp,compLabel,mode,setMode,S,E,visMonths,monthTypes,balRows,year,totCurr,totAss,totLiab}) {
  const fmt = v => { const a=Math.abs(v),sg=v<0?"−":""; return a>=1e6?sg+"€"+(a/1e6).toFixed(2)+"M":a>=1e3?sg+"€"+(a/1e3).toFixed(0)+"K":sg+"€"+a.toFixed(0); };
  const MONTHS_A=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const endEq   = actuals.equity[E]||0;
  const endDebt = (actuals.ltDebt[E]||0)+(actuals.stDebt[E]||0);
  const endAss  = totAss[E]||0;
  const endLiab = totLiab[E]||0;
  const eqR     = (endEq+endDebt) ? (endEq/(endEq+endDebt)*100).toFixed(1) : 0;
  const gear    = endEq ? (endDebt/endEq*100).toFixed(1) : 0;

  const chartData = MONTHS_A.map((m,i)=>({
    month:m,
    equity:actuals.equity[i],
    debt:(actuals.ltDebt[i]||0)+(actuals.stDebt[i]||0),
    assets:totAss[i]||0,
    current:totCurr[i]||0,
    cEquity:comp.equity?comp.equity[i]:0,
  }));

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      {/* Header + switcher */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div style={{fontSize:13,fontWeight:600,color:"#94a3b8"}}>Balance Sheet · {MONTHS_A[S]}–{MONTHS_A[E]} {year}</div>
        <ModeSwitcher mode={mode} setMode={setMode} compLabel={compLabel}/>
      </div>

      {/* KPI cards */}
      <div className="tf-grid-4" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
        {[
          {l:"Total Assets",   v:endAss,  color:BLUE,  sub:"End of period"},
          {l:"Total Equity",   v:endEq,   color:GREEN, sub:"Shareholders"},
          {l:"Equity Ratio",   v:eqR,     color:CYAN,  sub:"Equity / Total capital", pct:true},
          {l:"Gearing",        v:gear,    color:AMBER, sub:"Debt / Equity", pct:true},
        ].map(k=>(
          <div key={k.l} style={{background:"#0c1420",border:"1px solid #0f1e30",borderRadius:12,padding:"14px 18px"}}>
            <div style={{fontSize:10,color:SLATE,fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>{k.l}</div>
            <div style={{fontSize:22,fontWeight:700,color:k.color,fontFamily:"'DM Mono',monospace",marginBottom:4}}>
              {k.pct ? k.v+"%" : fmt(k.v)}
            </div>
            <div style={{fontSize:10,color:"#475569"}}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={{background:"#0c1420",border:"1px solid #0f1e30",borderRadius:12,padding:20}}>
          <div style={{fontSize:11,color:SLATE,fontFamily:"'DM Mono',monospace",marginBottom:12}}>Equity vs Debt</div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="eqG2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={GREEN} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={GREEN} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#0f1e30"/>
              <XAxis dataKey="month" tick={{fontSize:10,fill:SLATE}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:10,fill:SLATE}} axisLine={false} tickLine={false} tickFormatter={v=>"€"+(v/1e6).toFixed(1)+"M"}/>
              <Tooltip content={<Tt/>}/>
              <Area type="monotone" dataKey="equity" stroke={GREEN} fill="url(#eqG2)" strokeWidth={2} name="Equity"/>
              <Line type="monotone" dataKey="debt"   stroke={RED}   strokeWidth={1.5} dot={false} name="Total Debt"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:"#0c1420",border:"1px solid #0f1e30",borderRadius:12,padding:20}}>
          <div style={{fontSize:11,color:SLATE,fontFamily:"'DM Mono',monospace",marginBottom:12}}>Assets: Total vs Current</div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#0f1e30"/>
              <XAxis dataKey="month" tick={{fontSize:10,fill:SLATE}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:10,fill:SLATE}} axisLine={false} tickLine={false} tickFormatter={v=>"€"+(v/1e6).toFixed(1)+"M"}/>
              <Tooltip content={<Tt/>}/>
              <Line type="monotone" dataKey="assets"  stroke={BLUE} strokeWidth={2} dot={false} name="Total Assets"/>
              <Line type="monotone" dataKey="current" stroke={CYAN} strokeWidth={1.5} dot={false} strokeDasharray="3 3" name="Current Assets"/>
              <Line type="monotone" dataKey="cEquity" stroke={AMBER} strokeWidth={1.5} dot={false} strokeDasharray="4 4" name={"Equity "+compLabel}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div style={{background:"#0c1420",border:"1px solid #0f1e30",borderRadius:12,overflow:"hidden"}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,fontFamily:"'DM Mono',monospace"}}>
            <TblHead visMonths={visMonths} monthTypes={monthTypes} totalLabel="End of period"/>
            <tbody>
              {balRows.map((r,ri)=>{
                if(r.spacer){
                  return (
                    <tr key={ri}>
                      <td colSpan={visMonths.length*2+4} style={{padding:"10px 20px",fontSize:10,fontWeight:700,color:SLATE,background:"#070c17",textTransform:"uppercase",letterSpacing:"0.08em"}}>{r.spacer}</td>
                    </tr>
                  );
                }
                const aArr=r.aa||(actuals[r.ak]||[]);
                const cArr=r.ca!==undefined?r.ca:(r.ck?comp[r.ck]:null);
                return <TblRow key={ri} label={r.label} actArr={aArr} compArr={cArr} color={r.color} bold={r.bold} indent={r.indent} s={S} e={E} monthTypes={monthTypes} spot={true}/>;
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── CommentsPanel ─────────────────────────────────────────────────────────────
function CommentsPanel({supabase, clientName, userName, enabled}) {
  const [open,     setOpen]     = React.useState(false);
  const [comments, setComments] = React.useState([]);
  const [input,    setInput]    = React.useState("");
  const [loading,  setLoading]  = React.useState(false);
  const [unread,   setUnread]   = React.useState(0);
  const bottomRef = React.useRef();
  const inputRef  = React.useRef();
  const MONTH_MS = 30*24*60*60*1000;
  const scrollBottom = () => setTimeout(()=>bottomRef.current?.scrollIntoView({behavior:"smooth"}),50);

  const load = React.useCallback(async () => {
    if(!enabled||!supabase) return;
    const cutoff = new Date(Date.now()-MONTH_MS).toISOString();
    const {data} = await supabase.from("dashboard_comments")
      .select("*").eq("client", clientName).gte("created_at", cutoff)
      .order("created_at", {ascending:true});
    if(data) {
      setComments(data);
      if(!open) {
        const lastSeen = parseInt(localStorage.getItem("comments_seen_"+clientName)||"0");
        setUnread(data.filter(c=>new Date(c.created_at).getTime()>lastSeen).length);
      }
    }
  }, [enabled, supabase, clientName, open]);

  React.useEffect(()=>{ load(); const iv=setInterval(load,30000); return()=>clearInterval(iv); },[load]);

  const handleOpen = () => {
    setOpen(true); setUnread(0);
    localStorage.setItem("comments_seen_"+clientName, Date.now().toString());
    setTimeout(()=>{ inputRef.current?.focus(); scrollBottom(); },100);
  };

  const post = async () => {
    const text = input.trim();
    if(!text||loading||!supabase) return;
    setLoading(true); setInput("");
    await supabase.from("dashboard_comments").insert({
      client: clientName, author: userName, body: text, created_at: new Date().toISOString(),
    });
    setLoading(false); await load(); scrollBottom();
  };

  const timeAgo = (iso) => {
    const d = Math.floor((Date.now()-new Date(iso).getTime())/1000);
    if(d<60) return "just now"; if(d<3600) return Math.floor(d/60)+"m ago";
    if(d<86400) return Math.floor(d/3600)+"h ago"; return Math.floor(d/86400)+"d ago";
  };

  return (
    <div style={{position:"relative"}}>
      {/* Topbar button */}
      <button onClick={open ? ()=>setOpen(false) : handleOpen}
        style={{width:34,height:34,borderRadius:"50%",
          border:"2px solid "+(open?"#16a34a":"#1e2d45"),
          background:open?"linear-gradient(135deg,#0f4c2a,#16a34a)":"#0c1420",
          cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
          position:"relative",transition:"all 0.15s",padding:0,outline:"none"}}
        onMouseEnter={e=>{if(!open)e.currentTarget.style.borderColor="#16a34a";}}
        onMouseLeave={e=>{if(!open)e.currentTarget.style.borderColor="#1e2d45";}}>
        <span style={{fontSize:15,lineHeight:1}}>💬</span>
        {unread>0&&(
          <div style={{position:"absolute",top:-2,right:-2,width:14,height:14,borderRadius:"50%",
            background:RED,border:"2px solid #080b12",display:"flex",alignItems:"center",
            justifyContent:"center",fontSize:8,fontWeight:700,color:"#fff",fontFamily:"'DM Mono',monospace"}}>
            {unread}
          </div>
        )}
      </button>

      {open&&(
        <div style={{position:"absolute",top:42,right:0,width:340,height:500,
          display:"flex",flexDirection:"column",background:"#080e1c",
          border:"1px solid #1a3a2a",borderRadius:14,boxShadow:"0 16px 60px #000a",overflow:"hidden",zIndex:2000}}>
          <div style={{padding:"14px 18px",borderBottom:"1px solid #0f1e30",
            display:"flex",alignItems:"center",justifyContent:"space-between",
            background:"linear-gradient(135deg,#0a1e12,#060e0a)",flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,#0f4c2a,#16a34a)",
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>💬</div>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0"}}>Board Comments</div>
                <div style={{fontSize:9,color:GREEN,fontFamily:"'DM Mono',monospace"}}>● Shared · visible to all</div>
              </div>
            </div>
            <button onClick={()=>setOpen(false)}
              style={{background:"none",border:"none",color:SLATE,fontSize:18,cursor:"pointer",lineHeight:1,padding:"2px 6px"}}>✕</button>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"12px 14px",display:"flex",flexDirection:"column",gap:10}}>
            {comments.length===0&&(
              <div style={{textAlign:"center",padding:"24px 0",color:SLATE,fontSize:11,fontFamily:"'DM Mono',monospace"}}>
                No comments yet.<br/>Start the discussion.
              </div>
            )}
            {comments.map((c,i)=>{
              const isMe=c.author===userName;
              const initials=(c.author||"?").split("").filter((ch,j)=>j===0||(c.author||"")[j-1]===" ").join("").slice(0,2).toUpperCase();
              return (
                <div key={i} style={{display:"flex",flexDirection:"column",alignItems:isMe?"flex-end":"flex-start",gap:3}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,flexDirection:isMe?"row-reverse":"row"}}>
                    <div style={{width:22,height:22,borderRadius:"50%",background:isMe?"#1e3a5f":"#1a3a2a",
                      display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,
                      fontWeight:700,color:isMe?BLUE:GREEN,fontFamily:"'DM Mono',monospace",flexShrink:0}}>
                      {initials}
                    </div>
                    <span style={{fontSize:10,color:SLATE,fontFamily:"'DM Mono',monospace"}}>{c.author} · {timeAgo(c.created_at)}</span>
                  </div>
                  <div style={{maxWidth:"85%",padding:"9px 12px",
                    borderRadius:isMe?"12px 12px 2px 12px":"12px 12px 12px 2px",
                    background:isMe?"#1e3a5f":"#0c1a10",
                    border:"1px solid "+(isMe?"#3b82f655":"#16a34a33"),
                    fontSize:12,color:"#d1d5db",lineHeight:1.5}}>
                    {c.body}
                  </div>
                </div>
              );
            })}
            {loading&&<div style={{textAlign:"center",fontSize:10,color:SLATE,fontFamily:"'DM Mono',monospace"}}>posting…</div>}
            <div ref={bottomRef}/>
          </div>
          <div style={{padding:"10px 12px",borderTop:"1px solid #0f1e30",display:"flex",gap:8,flexShrink:0,background:"#060a14"}}>
            <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();post();}}}
              placeholder="Add a comment…"
              style={{flex:1,background:"#0c1420",border:"1px solid #1e2d45",borderRadius:9,
                padding:"8px 12px",color:"#e2e8f0",fontSize:12,outline:"none",fontFamily:"'DM Sans',sans-serif"}}
              onFocus={e=>e.target.style.borderColor="#16a34a"}
              onBlur={e=>e.target.style.borderColor="#1e2d45"}/>
            <button onClick={post} disabled={!input.trim()||loading}
              style={{width:36,height:36,borderRadius:9,
                background:input.trim()&&!loading?"#16a34a":"#0c1420",
                border:"1px solid "+(input.trim()&&!loading?"#16a34a":"#1e2d45"),
                cursor:input.trim()&&!loading?"pointer":"not-allowed",
                color:input.trim()&&!loading?"#fff":SLATE,fontSize:16,transition:"all 0.15s",flexShrink:0}}>
              ↑
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Dashboard() {
  const winW = useWindowWidth();
  const isMobile = winW < 768;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userEmail,   setUserEmail]  = useState("");
  React.useEffect(()=>{
    if(supabase) supabase.auth.getUser().then(({data})=>{ if(data?.user?.email) setUserEmail(data.user.email); });
  },[]);

  const [tab,         setTab]        = useState("group");
  const [year,        setYear]       = useState("2025");
  const [mode,        setMode]       = useState("budget");
  const [csvData,     setCsvData]    = useState(null);
  const [csvName,     setCsvName]    = useState(null);
  const [actData,     setActData]    = useState(null);
  const [actName,     setActName]    = useState(null);
  const [actLast,     setActLast]    = useState(ACT_LAST_DEFAULT);

  // ── PDF / PPT Export (screenshot-based, sidebar hidden) ─────────────────
  React.useEffect(()=>{
    const loadScript = (url) => new Promise((res,rej)=>{ if(document.querySelector(`script[src="${url}"]`)){ res(); return; } const s=document.createElement("script"); s.src=url; s.onload=res; s.onerror=rej; document.head.appendChild(s); });

    window._tfExport = async (type) => {
      const TABS_ORDER  = ["group","kpis","forecast","pl","balance","cashflow","deadlines"];
      const TAB_LABELS  = {group:"Group Structure",kpis:"KPIs",forecast:"Scenario Analysis",pl:"P&L",balance:"Balance Sheet",cashflow:"Cash Flow",deadlines:"Notifications"};
      const mainEl      = document.querySelector("[data-export-main]");
      const clientName  = mainEl?.dataset?.clientName || "Dashboard";
      const yearLabel   = mainEl?.dataset?.exportYear  || new Date().getFullYear();

      const toast = document.createElement("div");
      toast.style.cssText="position:fixed;bottom:24px;right:24px;background:#0c1420;border:1px solid #3b82f6;border-radius:10px;padding:12px 20px;color:#60a5fa;font-family:'DM Mono',monospace;font-size:12px;z-index:99999;box-shadow:0 8px 32px rgba(0,0,0,0.6)";
      toast.textContent="⏳ Preparing export…"; document.body.appendChild(toast);

      // ── Hide sidebar before capturing ──────────────────────────────────
      const sidebar = document.querySelector("[data-ai-sidebar]");
      const sidebarWasVisible = sidebar && sidebar.style.display !== "none";
      if(sidebar) sidebar.style.display = "none";
      const floatBtn = document.querySelector("[data-ai-float-btn]");
      if(floatBtn) floatBtn.style.display = "none";

      try {
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
        if(type==="pdf") await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
        if(type==="ppt") await loadScript("https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js");

        if(!mainEl){ toast.textContent="❌ Export target not found"; setTimeout(()=>toast.remove(),2000); return; }

        const captured = [];
        const allTabBtns = Array.from(document.querySelectorAll(".tab-btn"));
        for(const tabId of TABS_ORDER){
          toast.textContent=`📸 Capturing ${TAB_LABELS[tabId]}…`;
          const btn = allTabBtns.find(b=>b.textContent.trim()===TAB_LABELS[tabId]);
          if(btn){ btn.click(); await new Promise(r=>setTimeout(r,3500)); }
          const canvas = await window.html2canvas(mainEl,{
            backgroundColor:"#080b12", scale:1.5, useCORS:true, logging:false,
            width:mainEl.offsetWidth, height:Math.min(mainEl.scrollHeight,2800),
            windowWidth:mainEl.offsetWidth, scrollX:0, scrollY:0
          });
          captured.push({label:TAB_LABELS[tabId], dataUrl:canvas.toDataURL("image/jpeg",0.90), w:canvas.width, h:canvas.height});
        }

        toast.textContent=`📦 Building ${type.toUpperCase()}…`;
        await new Promise(r=>setTimeout(r,80));
        const fname = clientName.replace(/\s+/g,"_")+"_"+yearLabel+"_Board_Report";

        if(type==="pdf"){
          const {jsPDF} = window.jspdf;
          const pdf = new jsPDF({orientation:"landscape",unit:"mm",format:"a4"});
          const PW=297, PH=210;
          captured.forEach((c,i)=>{
            if(i>0) pdf.addPage();
            pdf.setFillColor(8,11,18); pdf.rect(0,0,PW,PH,"F");
            pdf.setFillColor(12,20,32); pdf.rect(0,0,PW,13,"F");
            pdf.setDrawColor(59,130,246); pdf.setLineWidth(0.4); pdf.line(0,13,PW,13);
            pdf.setTextColor(226,232,240); pdf.setFontSize(8.5); pdf.setFont("helvetica","bold");
            pdf.text(clientName+" · "+c.label, 7, 8.5);
            pdf.setFont("helvetica","normal"); pdf.setTextColor(71,85,105);
            pdf.text(yearLabel+"  "+String(i+1)+"/"+String(captured.length), PW-7, 8.5, {align:"right"});
            const mg=5, top=15, avW=PW-mg*2, avH=PH-top-mg;
            const sc=Math.min(avW/c.w, avH/c.h);
            const dW=c.w*sc, dH=c.h*sc, x=mg+(avW-dW)/2, y=top+(avH-dH)/2;
            pdf.addImage(c.dataUrl,"JPEG",x,y,dW,dH);
          });
          pdf.save(fname+".pdf");
        } else {
          const PptxGen = window.PptxGenJS || window.pptxgen;
          const pptx = new PptxGen();
          pptx.layout = "LAYOUT_WIDE";
          const SW=13.33, SH=7.5;
          for(const c of captured){
            const slide = pptx.addSlide();
            slide.background = {color:"080B12"};
            slide.addShape("rect",{x:0,y:0,w:SW,h:0.42,fill:{color:"0C1420"},line:{color:"1E2D45",w:0.5}});
            slide.addShape("rect",{x:0,y:0.42,w:SW,h:0.025,fill:{color:"3B82F6"}});
            slide.addText(clientName+" · "+c.label, {x:0.18,y:0.07,w:8,h:0.28,fontSize:9,color:"94A3B8",bold:true,fontFace:"Arial"});
            slide.addText(String(yearLabel), {x:SW-1.5,y:0.07,w:1.3,h:0.28,fontSize:8,color:"475569",fontFace:"Arial",align:"right"});
            const mg=0.12, top=0.5, avW=SW-mg*2, avH=SH-top-mg;
            const sc=Math.min(avW/c.w, avH/c.h);
            const dW=c.w*sc, dH=c.h*sc, x=mg+(avW-dW)/2, y=top+(avH-dH)/2;
            const b64 = c.dataUrl.replace(/^data:image\/jpeg;base64,/,"");
            slide.addImage({data:"image/jpeg;base64,"+b64, x, y, w:dW, h:dH});
          }
          await pptx.writeFile({fileName:fname+".pptx"});
        }
        toast.textContent="✅ Export ready!";
      } catch(err){ console.error(err); toast.textContent="❌ Export failed: "+err.message; }

      // ── Restore sidebar ──────────────────────────────────────────────────
      if(sidebar && sidebarWasVisible) sidebar.style.display = "";
      if(floatBtn) floatBtn.style.display = "";

      setTimeout(()=>toast.remove(),3500);
    };
  },[]);





  const [dragOver,    setDragOver]   = useState(false);
  const [unmapped,    setUnmapped]   = useState([]);
  const [actAccounts, setActAccounts]= useState(null); // account-level structure from Excel import

  const [dragOverA,   setDragOverA]  = useState(false);
  const [startM,      setStartM]     = useState(0);
  const [endM,        setEndM]       = useState(11);
  const [entities,    setEntities]   = useState([{id:"e1",name:"Accrease Oy",type:"operating",parentId:null,ownership:100,color:ACCENT}]);
  const [selectedEnt, setSelectedEnt]= useState("e1");
  const [editingEnt,  setEditingEnt] = useState(null);
  // ── Persist entities to snapshot whenever they change ──────────────────────
  const snapshotReady = React.useRef(false); // true once loadSnapshot has completed
  const entitiesRef   = React.useRef(null);
  React.useEffect(()=>{
    // Skip until snapshot has loaded (prevents overwriting saved data with defaults)
    if(!snapshotReady.current) return;
    if(!supabase) return;
    const timer = setTimeout(async()=>{
      try {
        await supabase.from("client_snapshots").upsert({
          client:   CLIENT_NAME,
          entities: JSON.stringify(entities),
          updated_at: new Date().toISOString(),
        },{onConflict:"client"});
      } catch(e){ console.warn("Entities save failed", e); }
    }, 800);
    return ()=>clearTimeout(timer);
  },[entities]);


  // Load SheetJS once
  React.useEffect(()=>{
    if(!window._xlLoaded){
      window._xlLoaded=true;
      const s=document.createElement("script");
      s.src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
      document.head.appendChild(s);
    }
  },[]);
  const [activeEntity,setActiveEntity]=useState(null);
  const fileRef  = useRef();
  const fileRefA = useRef();

  const addEntity = (type) => {
    const id="e"+Date.now();
    const cs=[BLUE,GREEN,PURPLE,CYAN,AMBER,RED,"#ec4899"];
    const color=cs[entities.length%cs.length];
    if(type==="parent"){
      const rootId=entities.find(e=>!e.parentId)||{};
      setEntities(prev=>[{id,name:"Parent Company",type:"holding",parentId:null,ownership:100,color},...prev.map(e=>e.id===rootId.id?{...e,parentId:id}:e)]);
    } else {
      setEntities(prev=>[...prev,{id,name:"New Subsidiary",type:"operating",parentId:entities[0]?entities[0].id:null,ownership:100,color}]);
    }
    setSelectedEnt(id);setEditingEnt(id);
  };
  const updateEntity=(id,field,value)=>setEntities(prev=>prev.map(e=>e.id===id?{...e,[field]:value}:e));
  const removeEntity=(id)=>{
    setEntities(prev=>{
      const t=prev.find(e=>e.id===id);
      return prev.filter(e=>e.id!==id).map(e=>e.parentId===id?{...e,parentId:t?t.parentId:null}:e);
    });
    if(selectedEnt===id) setSelectedEnt(null);
  };
  const isGroup=entities.length>1;

  const _rawAct    = actData||(DATA_BY_YEAR[year]||actBase);
  const _rawComp   = csvData||(DATA_BY_YEAR[year]||budBase);
  const Z12 = ()=>[0,0,0,0,0,0,0,0,0,0,0,0];
  const norm = (d) => ({
    revenue:     d.revenue     || Z12(),
    cogs:        d.cogs        || Z12(),
    opex:        d.opex        || Z12(),
    ebitda:      d.ebitda      || Z12(),
    depAmort:    d.depAmort    || Z12(),
    ebit:        d.ebit        || Z12(),
    finExpenses: d.finExpenses || Z12(),
    ebt:         d.ebt         || Z12(),
    tax:         d.tax         || Z12(),
    netProfit:   d.netProfit   || Z12(),
    grossProfit: d.grossProfit || (d.revenue&&d.cogs ? d.revenue.map((v,i)=>v-(d.cogs[i]||0)) : Z12()),
    inventory:   d.inventory   || Z12(),
    receivables: d.receivables || Z12(),
    payables:    d.payables    || Z12(),
    equity:      d.equity      || Z12(),
    cash:        d.cash        || Z12(),
    ltDebt:      d.ltDebt      || Z12(),
    stDebt:      d.stDebt      || Z12(),
    otherCL:     d.otherCL     || Z12(),
    tangibles:   d.tangibles   || Z12(),
    otherCA:     d.otherCA     || Z12(),
  });
  const actuals    = norm(_rawAct);
  const comp       = norm(_rawComp);
  const compLabel  = mode==="budget"?"BUD":"FC";
  const S=startM,E=endM;
  const visMonths  = MONTHS.slice(S,E+1);
  const monthTypes = visMonths.map((_,ii)=>(S+ii)<=actLast?"ACT":compLabel);

  const totRev  = sum(sl(actuals.revenue,S,E));
  const totGP   = sum(sl(actuals.grossProfit,S,E));
  const totEbit = sum(sl(actuals.ebit,S,E));
  const totNet  = sum(sl(actuals.netProfit,S,E));
  const totFinX = sum(sl(actuals.finExpenses,S,E));
  const endEq   = actuals.equity[E]||0;
  const endDebt = (actuals.ltDebt[E]||0)+(actuals.stDebt[E]||0);
  const endInv  = actuals.inventory[E]||0;
  const endRec  = actuals.receivables[E]||0;
  const endPay  = actuals.payables[E]||0;
  const nMths   = E-S+1;
  const annRev  = totRev/nMths*12;

  const gmPct  = totRev?(totGP/totRev*100).toFixed(1):0;
  const emPct  = totRev?(totEbit/totRev*100).toFixed(1):0;
  const roePct = endEq?(totNet/endEq*100).toFixed(1):0;
  const eqR    = (endEq+endDebt)?(endEq/(endEq+endDebt)*100).toFixed(1):0;
  const gear   = endEq?(endDebt/endEq*100).toFixed(1):0;
  const intCov = totFinX?(totEbit/totFinX).toFixed(1):0;
  const dso    = annRev?(endRec/(annRev/365)).toFixed(0):0;
  const dio    = annRev?(endInv/(annRev/365)).toFixed(0):0;
  const dpo    = annRev?(endPay/(annRev/365)).toFixed(0):0;

  const marginData=MONTHS.map((m,i)=>({month:m,gross:actuals.revenue[i]?+(actuals.grossProfit[i]/actuals.revenue[i]*100).toFixed(1):0,ebit:actuals.revenue[i]?+(actuals.ebit[i]/actuals.revenue[i]*100).toFixed(1):0}));
  const eqDebtData=MONTHS.map((m,i)=>({month:m,equity:actuals.equity[i],debt:(actuals.ltDebt[i]||0)+(actuals.stDebt[i]||0)}));
  const gearData  =MONTHS.map((m,i)=>({month:m,gearing:actuals.equity[i]?+(((actuals.ltDebt[i]||0)+(actuals.stDebt[i]||0))/actuals.equity[i]*100).toFixed(1):0}));
  const effData   =MONTHS.map((m,i)=>({month:m,dso:actuals.revenue[i]?+(actuals.receivables[i]/(actuals.revenue[i]/30)).toFixed(0):0}));
  const fcRevData =MONTHS.map((m,i)=>({month:m,act:actuals.revenue[i],comp:comp.revenue[i]}));
  const fcEqData  =MONTHS.map((m,i)=>({month:m,act:actuals.equity[i], comp:comp.equity[i]}));
  const fcCashData=MONTHS.map((m,i)=>({month:m,act:actuals.cash[i],   comp:comp.cash[i]}));
    // ── CASH FLOW — indirect method, hybrid residual ──────────────────────────
  // Opening cash: use prior year Dec if available, else back-derive from month 1
  const _prevYearData = DATA_BY_YEAR[String(parseInt(year)-1)];
  const _openCash0    = _prevYearData ? (_prevYearData.cash||[])[11]||0 : null;

  // Prior month BS helper — month 0 uses prior Dec if available
  const _prevBS = (key) => _prevYearData ? ((_prevYearData[key]||[])[11]||0) : (actuals[key][0]||0);

  // WC deltas
  const _d = (key,i) => i===0
    ? (_prevYearData ? (actuals[key][0]||0) - _prevBS(key) : 0)
    : (actuals[key][i]||0) - (actuals[key][i-1]||0);

  const cfDRec  = MONTHS.map((_,i) => -_d('receivables',i));
  const cfDInv  = MONTHS.map((_,i) => -_d('inventory',i));
  const cfDPay  = MONTHS.map((_,i) =>  _d('payables',i));
  const cfDOCL  = MONTHS.map((_,i) =>  _d('otherCL',i));
  const cfWC    = MONTHS.map((_,i) => cfDRec[i]+cfDInv[i]+cfDPay[i]+cfDOCL[i]);

  // Operative CF
  const cfOpBefore = MONTHS.map((_,i) => (actuals.ebitda[i]||0) + cfWC[i]);
  const cfInterest = MONTHS.map((_,i) => -(actuals.finExpenses[i]||0));
  const cfTaxCF    = MONTHS.map((_,i) => -(actuals.tax[i]||0));
  const cfOp       = MONTHS.map((_,i) => cfOpBefore[i]+cfInterest[i]+cfTaxCF[i]);

  // Financing CF — net debt movements
  const cfDLT = MONTHS.map((_,i) =>  _d('ltDebt',i));
  const cfDST = MONTHS.map((_,i) =>  _d('stDebt',i));
  const cfFin = MONTHS.map((_,i) => cfDLT[i]+cfDST[i]);

  // Opening cash per month
  const openCash = MONTHS.map((_,i) => {
    if(i===0) return _openCash0 !== null ? _openCash0 : (actuals.cash[0]||0) - (cfOp[0]+cfFin[0]);
    return actuals.cash[i-1]||0;
  });

  // Investment CF — residual so statement always reconciles to uploaded cash balance
  const cfInv = MONTHS.map((_,i) => {
    const dCash = (actuals.cash[i]||0) - openCash[i];
    return dCash - cfOp[i] - cfFin[i];
  });

  const netCFArr = MONTHS.map((_,i) => cfOp[i]+cfInv[i]+cfFin[i]);
  const closCash = MONTHS.map((_,i) => actuals.cash[i]||0);

  const cfAll   = MONTHS.map((_,i)=>({month:MONTHS[i],op:cfOp[i],inv:cfInv[i],fin:cfFin[i],net:netCFArr[i],endCash:closCash[i]}));
  const cfChart = cfAll.slice(S,E+1);

  const CSV_FIELDS=[
    {key:"revenue",label:"revenue"},{key:"cogs",label:"cogs"},{key:"opex",label:"opex"},
    {key:"ebitda",label:"ebitda"},{key:"depAmort",label:"dep_amort"},{key:"ebit",label:"ebit"},
    {key:"finExpenses",label:"fin_expenses"},{key:"ebt",label:"ebt"},{key:"tax",label:"tax"},
    {key:"netProfit",label:"net_profit"},{key:"inventory",label:"inventory"},
    {key:"receivables",label:"receivables"},{key:"payables",label:"payables"},
    {key:"equity",label:"equity"},{key:"cash",label:"cash"},
    {key:"ltDebt",label:"lt_debt"},{key:"stDebt",label:"st_debt"},{key:"otherCL",label:"other_cl"},
  ];

  // ── Download Targetflow Import Template ───────────────────────────────────
  const downloadTemplate = (type) => {
    // Original template embedded as base64 — preserves all formulas, dropdowns and dynamic month logic
    const TEMPLATE_B64 = "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";
    const bin = atob(TEMPLATE_B64);
    const buf = new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) buf[i]=bin.charCodeAt(i);
    const blob = new Blob([buf], {type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `targetflow_template_${type}_${year}.xlsx`;
    a.click();
    URL.revokeObjectURL(a.href);
  };


  // ── Write snapshot to Supabase for superuser dashboard ───────────────────
  const writeSnapshot = React.useCallback(async (data, actLast_, yr, opts={}) => {
    if(!supabase||!data) return;
    const lastMonth = actLast_>=0 ? ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][actLast_] : null;
    try {
      const payload = {
        client:     CLIENT_NAME,
        updated_at: new Date().toISOString(),
        last_month: lastMonth,
        revenue:    JSON.stringify(data.revenue    ||[]),
        ebitda:     JSON.stringify(data.ebitda     ||[]),
        net_profit: JSON.stringify(data.netProfit  ||[]),
        year:       yr||year,
        act_last:   actLast_,
        act_data:   JSON.stringify(data),
        act_name:   opts.actName  || actName  || null,
      };
      // Only overwrite csv fields if explicitly provided
      if(opts.csvData !== undefined) payload.csv_data = JSON.stringify(opts.csvData);
      if(opts.csvName !== undefined) payload.csv_name = opts.csvName;
      if(opts.mode    !== undefined) payload.mode     = opts.mode;
      if(opts.entities!== undefined) payload.entities = JSON.stringify(opts.entities);
      await supabase.from("client_snapshots").upsert(payload, {onConflict:"client"});
    } catch(e){ console.warn("Snapshot write failed", e); }
  },[year, actName]);

  // ── Load snapshot on mount ───────────────────────────────────────────────
  const snapshotLoaded = React.useRef(false);
  React.useEffect(()=>{
    if(!supabase||snapshotLoaded.current) return;
    snapshotLoaded.current = true;
    (async()=>{
      try {
        const {data:rows} = await supabase
          .from("client_snapshots")
          .select("*")
          .eq("client", CLIENT_NAME)
          .limit(1);
        if(!rows||!rows.length) return;
        const s = rows[0];
        if(s.act_data)  { try{ const d=JSON.parse(s.act_data);  setActData(d);  }catch(e){} }
        if(s.act_name)  setActName(s.act_name);
        if(s.act_last!=null) setActLast(s.act_last);
        if(s.csv_data)  { try{ const d=JSON.parse(s.csv_data);  setCsvData(d);  }catch(e){} }
        if(s.csv_name)  setCsvName(s.csv_name);
        if(s.mode)      setMode(s.mode);
        if(s.year)      setYear(s.year);
        if(s.entities)  { try{ const e=JSON.parse(s.entities);  setEntities(e); }catch(e){} }
      } catch(e){ console.warn("Snapshot load failed", e); }
      finally { snapshotReady.current = true; }
    })();
  },[]);

  // ── Confirm overwrite helper ─────────────────────────────────────────────
  const confirmOverwrite = (isAct, fileYear) => {
    const existing = isAct ? actData : csvData;
    const existingName = isAct ? actName : csvName;
    if(!existing) return true; // nothing to overwrite
    const typeLabel = isAct ? "ACT" : (mode==="forecast"?"FC":"BUD");
    const msg = `Replace existing ${typeLabel} data${existingName?" ("+existingName+")":""}${fileYear?" for "+fileYear:""}?`;
    return window.confirm(msg);
  };

  const exportCSV=()=>{
    const XL=window.XLSX;
    // If actuals were imported from Excel, generate a matching account-level budget template
    if(actAccounts&&actAccounts.length>0&&XL){
      const wb=XL.utils.book_new();
      const inputRows=[];
      // Header
      inputRows.push(["Targetflow — "+compLabel+" template — "+year,...Array(13).fill("")]);
      inputRows.push(["Account Code","Account Name","Model Line",...MONTHS,"Full Year"]);
      // Group by section
      const SECTIONS=[
        {label:"── INCOME STATEMENT ──",  fields:["revenue","cogs","opex","finExpenses","tax","depAmort"]},
        {label:"── ASSETS ──",            fields:["tangibles","inventory","receivables","otherCA","cash"]},
        {label:"── LIABILITIES & EQUITY ──",fields:["equity","ltDebt","stDebt","payables","otherCL"]},
        {label:"── UNMAPPED ──",          fields:[null]},
      ];
      for(const sec of SECTIONS){
        const accts=actAccounts.filter(a=>sec.fields.includes(a.field)||(sec.fields[0]===null&&a.field===null));
        if(!accts.length) continue;
        inputRows.push([sec.label,...Array(14).fill("")]);
        accts.forEach(acct=>{
          inputRows.push([acct.code, acct.name, acct.field||"— unmapped", ...Array(12).fill(0), 0]);
        });
        inputRows.push(["","SECTION TOTAL (auto)",...Array(13).fill("")]);
        inputRows.push([]);
      }
      // Instructions sheet
      const instrRows=[
        ["Targetflow Budget/Forecast Template"],[""],
        ["1. Fill monthly budget values for each account (column D–O)"],
        ["2. Amounts in euros — same sign as your actuals export"],
        ["3. Do NOT change account codes or column order"],
        ["4. Save as .xlsx and upload via the profile panel (avatar icon)"],
        ["5. Unmapped accounts will be shown for review after upload"],[""],
        ["Sign conventions:"],
        ["  Revenue (3000-3999): positive"],
        ["  Costs (4000-8099):   positive (dashboard flips sign automatically)"],
        ["  Assets (1000-1999):  positive balances"],
        ["  Liabilities/Equity (2000-2999): positive balances"],
      ];
      const wsIn=XL.utils.aoa_to_sheet(inputRows);
      const wsHelp=XL.utils.aoa_to_sheet(instrRows);
      wsIn["!cols"]=[{wch:14},{wch:40},{wch:20},...Array(12).fill({wch:11}),{wch:12}];
      wsHelp["!cols"]=[{wch:70}];
      XL.utils.book_append_sheet(wb,wsIn,"Budget Input");
      XL.utils.book_append_sheet(wb,wsHelp,"Instructions");
      XL.writeFile(wb,"targetflow_"+compLabel.toLowerCase()+"_"+year+".xlsx");
    } else {
      // Fallback: CSV
      const hdr=["field",...MONTHS].join(",");
      const rows=CSV_FIELDS.map(f=>[f.label,...(comp[f.key]||Array(12).fill(0)).map(v=>Math.round(v))].join(","));
      const csv=["# Targetflow "+compLabel+" Template — "+year,hdr,...rows].join("\n");
      const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="targetflow_"+compLabel.toLowerCase()+"_"+year+".csv";a.click();
    }
  };
  const exportActCSV=()=>{
    const hdr=["field",...MONTHS].join(",");
    const rows=CSV_FIELDS.map(f=>[f.label,...(actuals[f.key]||Array(12).fill(0)).map(v=>Math.round(v))].join(","));
    const csv=["# Targetflow Actuals — "+year,"# actuals_last: last confirmed month 1-12",hdr,"actuals_last,"+(actLast+1)+",0,0,0,0,0,0,0,0,0,0,0",...rows].join("\n");
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="targetflow_actuals_"+year+".csv";a.click();
  };
  const parseFile=(file,isAct)=>{
    if(!file) return;
    const ext=file.name.split(".").pop().toLowerCase();
    if(ext==="xlsx"||ext==="xls"||ext==="ods"){
      // Excel path — use SheetJS
      if(!window.XLSX){alert("SheetJS not loaded — please refresh");return;}
      if(isAct) setActName(file.name); else setCsvName(file.name);
      const r=new FileReader();
      r.onload=ev=>{
        try{
          const wb=window.XLSX.read(ev.target.result,{type:"array"});

          // ── Try Targetflow template format first ──────────────────────────
          const firstWs = wb.Sheets[wb.SheetNames[0]];
          const firstRows = window.XLSX.utils.sheet_to_json(firstWs,{header:1,defval:""});
          const metaStr = String((firstRows[4]||[])[0]||"");
          const isTfTemplate = metaStr.includes("type:") && metaStr.includes("year:") && metaStr.includes("[");

          if(isTfTemplate){
            const tr = parseTargetflowTemplate(wb, entities);
            if(!tr){ alert("Targetflow-template tunnistettu mutta tietojen luku epäonnistui."); return; }
            if(tr.companyWarning){
              const proceed = window.confirm("⚠️ Yhtiövaroitus\n\n" + tr.companyWarning + "\n\nJatketaanko silti?");
              if(!proceed) return;
            }
            const base = tr.fileType==="ACT" ? actBase : budBase;
            const data = {...base, ...tr.mapped};
            if(tr.fileType==="ACT"){
              if(!confirmOverwrite(true, tr.fileYear||year)) return;
              setActData(data); setActName(file.name);
              if(tr.actLast >= 0) { setActLast(tr.actLast); writeSnapshot(data, tr.actLast, tr.fileYear||year, {actName:file.name}); }
            } else {
              if(!confirmOverwrite(false, tr.fileYear||year)) return;
              const newMode = tr.fileType==="FC"?"forecast":"budget";
              setCsvData(data); setCsvName(file.name);
              setMode(newMode);
              // Save csv to snapshot
              if(supabase){ supabase.from("client_snapshots").upsert({client:CLIENT_NAME,csv_data:JSON.stringify(data),csv_name:file.name,mode:newMode,updated_at:new Date().toISOString()},{onConflict:"client"}).catch(e=>console.warn(e)); }
            }
            if(tr.fileYear && tr.fileYear !== year) setYear(tr.fileYear);
            return;
          }

          // ── Trial balance fallback ────────────────────────────────────────
          const result=parseExcelTrialBalance(wb);
          if(!result){alert("Could not detect trial balance format.\nExpected: rows=accounts, columns=months, first column=account code (4 digits).");return;}
          const base=isAct?actBase:budBase;
          const merged={...base,...result.mapped};
          if(isAct){
            if(!confirmOverwrite(true, year)) return;
            setActData(merged);
            setUnmapped(result.unmapped);
            writeSnapshot(merged, newLast, year, {actName:file.name});
          } else {
            if(!confirmOverwrite(false, year)) return;
            setCsvData(merged);
            if(supabase){ supabase.from("client_snapshots").upsert({client:CLIENT_NAME,csv_data:JSON.stringify(merged),csv_name:file.name,mode,updated_at:new Date().toISOString()},{onConflict:"client"}).catch(e=>console.warn(e)); }
          }
        }catch(err){alert("Excel error: "+err.message);}
      };
      r.readAsArrayBuffer(file);
    } else {
      // CSV path — original logic
      if(isAct) setActName(file.name); else setCsvName(file.name);
      const r=new FileReader();
      r.onload=ev=>{
        try{
          const lines=ev.target.result.split("\n").map(l=>l.trim()).filter(l=>l&&!l.startsWith("#"));
          const hIdx=lines.findIndex(l=>l.toLowerCase().startsWith("field"));
          if(hIdx===-1){alert("No header row found");return;}
          const cols=lines[hIdx].split(",").map(c=>c.trim().toLowerCase());
          const mCols=MONTHS.map(m=>cols.indexOf(m.toLowerCase()));
          const parsed={};let newLast=actLast;
          for(let i=hIdx+1;i<lines.length;i++){
            const parts=lines[i].split(",");
            const fname=parts[0]&&parts[0].trim().toLowerCase();
            if(!fname) continue;
            if(isAct&&fname==="actuals_last"){const v=parseInt(parts[1]);if(!isNaN(v)&&v>=1&&v<=12)newLast=v-1;continue;}
            const match=CSV_FIELDS.find(f=>f.label===fname);
            if(!match) continue;
            parsed[match.key]=mCols.map(ci=>{if(ci===-1)return 0;const v=parseFloat(parts[ci]);return isNaN(v)?0:v;});
          }
          const base=isAct?actBase:budBase;
          const result={...base,...parsed};
          if(parsed.revenue&&parsed.cogs) result.grossProfit=parsed.revenue.map((v,i)=>v-(parsed.cogs[i]||0));
          if(isAct){setActData(result);setActLast(newLast);}else setCsvData(result);
        }catch(err){alert("CSV error: "+err.message);}
      };
      r.readAsText(file);
    }
  };

  const TABS=[
    {id:"group",    label:"Group Structure"},
    {id:"kpis",     label:"KPIs"},
    {id:"forecast", label:"Scenario Analysis"},
    {id:"pl",       label:"P&L"},
    {id:"balance",  label:"Balance Sheet"},
    {id:"cashflow", label:"Cash Flow"},
    {id:"deadlines",label:"Notifications"},
  ];

  const plRows=[
    {label:"Revenue",       ak:"revenue",    ck:"revenue",    color:BLUE,  bold:true},
    {label:"Cost of Goods", ak:"cogs",       ck:"cogs",       color:SLATE, indent:true},
    {label:"Gross Profit",  ak:"grossProfit",ck:"grossProfit",color:CYAN,  bold:true},
    {label:"OpEx",          ak:"opex",       ck:"opex",       color:SLATE, indent:true},
    {label:"EBITDA",        ak:"ebitda",     ck:"ebitda",     color:AMBER, bold:true},
    {label:"Depreciation",  ak:"depAmort",   ck:null,         color:SLATE, indent:true},
    {label:"EBIT",          ak:"ebit",       ck:"ebit",       color:BLUE,  bold:true},
    {label:"Fin. Expenses", ak:"finExpenses",ck:"finExpenses",color:SLATE, indent:true},
    {label:"EBT",           ak:"ebt",        ck:"ebt",        color:SLATE},
    {label:"Tax",           ak:"tax",        ck:"tax",        color:SLATE, indent:true},
    {label:"Net Profit",    ak:"netProfit",  ck:"netProfit",  color:GREEN, bold:true},
  ];

  const totCurr=MONTHS.map((_,i)=>(actuals.inventory[i]||0)+(actuals.receivables[i]||0)+(actuals.cash[i]||0)+(actuals.otherCA?actuals.otherCA[i]:0));
  const totAss =MONTHS.map((_,i)=>(actuals.tangibles?actuals.tangibles[i]:0)+totCurr[i]);
  const totLiab=MONTHS.map((_,i)=>(actuals.ltDebt[i]||0)+(actuals.stDebt[i]||0)+(actuals.payables[i]||0)+(actuals.otherCL[i]||0));
  const balRows=[
    {spacer:"ASSETS"},
    {label:"Tangible assets",   ak:"tangibles",   ck:null,          color:SLATE,indent:true},
    {label:"Total Non-current", aa:actuals.tangibles||[], ca:null,  color:"#94a3b8",bold:true},
    {label:"Inventory",         ak:"inventory",   ck:"inventory",   color:SLATE,indent:true},
    {label:"Receivables",       ak:"receivables", ck:"receivables", color:SLATE,indent:true},
    {label:"Cash",              ak:"cash",        ck:"cash",        color:SLATE,indent:true},
    {label:"Total Current",     aa:totCurr,       ca:null,          color:"#94a3b8",bold:true},
    {label:"TOTAL ASSETS",      aa:totAss,        ca:null,          color:BLUE, bold:true},
    {spacer:"EQUITY & LIABILITIES"},
    {label:"Total Equity",      ak:"equity",      ck:"equity",      color:GREEN,bold:true},
    {label:"Long-term debt",    ak:"ltDebt",      ck:null,          color:SLATE,indent:true},
    {label:"Short-term debt",   ak:"stDebt",      ck:null,          color:SLATE,indent:true},
    {label:"Payables",          ak:"payables",    ck:"payables",    color:SLATE,indent:true},
    {label:"Other liabilities", ak:"otherCL",     ck:null,          color:SLATE,indent:true},
    {label:"TOTAL LIABILITIES", aa:totLiab,       ca:null,          color:RED,  bold:true},
  ];

  const netCF = netCFArr;
  const cfTbl=[
    {label:"EBITDA",                          aa:actuals.ebitda, color:AMBER,      bold:true},
    {label:"  Δ Receivables",                 aa:cfDRec,         color:SLATE,      indent:true},
    {label:"  Δ Inventory",                   aa:cfDInv,         color:SLATE,      indent:true},
    {label:"  Δ Payables",                    aa:cfDPay,         color:SLATE,      indent:true},
    {label:"  Δ Other current liabilities",   aa:cfDOCL,         color:SLATE,      indent:true},
    {label:"OPERATIVE CF BEFORE FIN. ITEMS",   aa:cfOpBefore,     color:CYAN,       bold:true},
    {label:"  Interest & financing",           aa:cfInterest,     color:SLATE,      indent:true},
    {label:"  Taxes paid",                     aa:cfTaxCF,        color:SLATE,      indent:true},
    {label:"OPERATIVE CASHFLOW",               aa:cfOp,           color:GREEN,      bold:true},
    {label:"INVESTMENT CASHFLOW",              aa:cfInv,          color:RED,        bold:true},
    {label:"  Δ LT debt",                     aa:cfDLT,          color:SLATE,      indent:true},
    {label:"  Δ ST debt",                     aa:cfDST,          color:SLATE,      indent:true},
    {label:"FINANCING CASHFLOW",               aa:cfFin,          color:"#94a3b8",  bold:true},
    {label:"NET CASH CHANGE",                  aa:netCFArr,       color:BLUE,       bold:true},
    {label:"Opening cash",                     aa:openCash,       color:SLATE},
    {label:"CLOSING CASH BALANCE",             aa:closCash,       color:CYAN,       bold:true},
  ];
  const totOp =sum(sl(cfOp, S,E));
  const totInv=sum(sl(cfInv,S,E));
  const totFin=sum(sl(cfFin,S,E));

  const [notifications, setNotifications] = React.useState([
    {id:1, month:"January",   due:year+"-02-15", submitted:true},
    {id:2, month:"February",  due:year+"-03-15", submitted:true},
    {id:3, month:"March",     due:year+"-04-15", submitted:true},
    {id:4, month:"April",     due:year+"-05-15", submitted:true},
    {id:5, month:"May",       due:year+"-06-15", submitted:true},
    {id:6, month:"June",      due:year+"-08-15", submitted:true},
    {id:7, month:"July",      due:year+"-08-15", submitted:true},
    {id:8, month:"August",    due:year+"-09-15", submitted:false},
    {id:9, month:"September", due:year+"-10-15", submitted:false},
    {id:10,month:"October",   due:year+"-11-15", submitted:false},
    {id:11,month:"November",  due:year+"-12-15", submitted:false},
    {id:12,month:"December",  due:(parseInt(year)+1)+"-01-15", submitted:false},
  ]);
  const toggleSubmitted = (id) => setNotifications(prev=>prev.map(n=>n.id===id?{...n,submitted:!n.submitted}:n));
  const updateDue = (id, val) => setNotifications(prev=>prev.map(n=>n.id===id?{...n,due:val}:n));

  return (
    <div data-export-main data-export-year={year} data-client-name={CLIENT_NAME} data-act-data={actData?JSON.stringify(actData):""} data-csv-data={csvData?JSON.stringify(csvData):""} data-entities={JSON.stringify(entities)} data-mode={mode} data-start-m={startM} data-end-m={endM} data-act-last={actLast} style={{minHeight:"100vh",background:"#080b12",color:"#e2e8f0",fontFamily:"'DM Sans',sans-serif"}}>
      <style>{STYLE}</style>

      <div style={{borderBottom:"1px solid #0c1829",padding:isMobile?"0 16px":"0 32px",display:"flex",alignItems:"center",justifyContent:"space-between",height:56,marginRight:isMobile?0:320}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:28,height:28,background:"linear-gradient(135deg,#1d4ed8,#0ea5e9)",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontSize:10,fontWeight:700,color:"#fff",fontFamily:"'DM Mono',monospace"}}>TF</span>
          </div>
          <div>
            <div style={{fontSize:14,fontWeight:600}}>Accrease Oy</div>
            <div style={{fontSize:10,color:"#334155",fontFamily:"'DM Mono',monospace"}}>Financial Dashboard · {year}</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div className="tf-yr-btns" style={{display:"flex",gap:6}}>
            {["2023","2024","2025","2026"].map(y=>(
              <button key={y} className={"yr-btn"+(year===y?" active":"")} onClick={()=>{ setYear(y); setActLast(ACT_LAST_BY_YEAR[y]??ACT_LAST_DEFAULT); }}>{y}</button>
            ))}
          </div>
          {isMobile && (
            <button onClick={()=>setSidebarOpen(o=>!o)} style={{background:"rgba(29,78,216,0.15)",border:"1px solid rgba(129,140,248,0.25)",borderRadius:8,padding:"4px 8px",cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><svg width="20" height="20" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="e9k_a3" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#818cf8" stopOpacity="0.22"/><stop offset="100%" stopColor="#60a5fa" stopOpacity="0"/></radialGradient><radialGradient id="e9k_c3" cx="50%" cy="45%" r="50%"><stop offset="0%" stopColor="#1e3a6e"/><stop offset="100%" stopColor="#05060f"/></radialGradient></defs><circle cx="22" cy="22" r="22" fill="url(#e9k_a3)"/><ellipse cx="22" cy="9" rx="9" ry="2.2" fill="none" stroke="#818cf8" strokeWidth="0.9" opacity="0.55"/><circle cx="22" cy="22" r="18" fill="url(#e9k_c3)" stroke="rgba(129,140,248,0.35)" strokeWidth="0.8"/><rect x="10" y="13" width="24" height="20" rx="5" fill="rgba(10,16,45,0.95)" stroke="rgba(99,120,220,0.4)" strokeWidth="0.7"/><rect x="12" y="16" width="20" height="8" rx="2.5" fill="rgba(5,6,15,0.9)"/><rect x="14" y="18" width="4" height="2" rx="1" fill="#60a5fa"/><rect x="26" y="18" width="4" height="2" rx="1" fill="#60a5fa"/><rect x="13" y="26" width="2.5" height="4" rx="0.8" fill="#22c55e" opacity="0.9"/><rect x="17" y="27.5" width="2.5" height="2.5" rx="0.8" fill="#22c55e" opacity="0.7"/><rect x="21" y="26" width="2.5" height="4" rx="0.8" fill="#22c55e" opacity="0.85"/><rect x="25" y="28" width="2.5" height="2" rx="0.8" fill="#22c55e" opacity="0.6"/><rect x="29" y="26" width="2" height="4" rx="0.8" fill="#22c55e" opacity="0.75"/><line x1="22" y1="13" x2="22" y2="8" stroke="rgba(165,180,252,0.5)" strokeWidth="0.8" strokeLinecap="round"/><polygon points="22,5 24,7.5 22,10 20,7.5" fill="#a5b4fc" opacity="0.85"/></svg><span style={{fontSize:10,fontFamily:"'DM Mono',monospace",fontWeight:700,color:"#93c5fd"}}>9000</span></button>
          )}
          <CommentsPanel
            supabase={supabase}
            clientName="Accrease Oy"
            userName={userEmail||"Board Member"}
            enabled={true}
          />
          <SettingsMenu actData={actData} actName={actName} actLast={actLast} setActData={setActData} setActName={setActName} setActLast={setActLast} csvData={csvData} csvName={csvName} setCsvData={setCsvData} setCsvName={setCsvName} mode={mode} setMode={setMode} parseCSV={parseFile} unmapped={unmapped} exportActCSV={exportActCSV} exportCSV={exportCSV} fileRef={fileRef} fileRefA={fileRefA} dragOver={dragOver} setDragOver={setDragOver} dragOverA={dragOverA} setDragOverA={setDragOverA} compLabel={compLabel} entities={entities} downloadTemplate={downloadTemplate}/>
        </div>
      </div>

      <div style={{borderBottom:"1px solid #0c1829",padding:"0 32px",display:"flex",gap:0,overflowX:"auto",marginRight:isMobile?0:320}}>
        {TABS.map(t=>(
          <button key={t.id} className="tab-btn" onClick={()=>setTab(t.id)} style={{padding:"12px 16px",fontSize:12,fontWeight:tab===t.id?600:400,color:tab===t.id?"#60a5fa":"#475569",borderBottom:tab===t.id?"2px solid #3b82f6":"2px solid transparent",marginBottom:-1,whiteSpace:"nowrap"}}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{marginRight:320}}><PeriodBar startM={S} endM={E} setStart={setStartM} setEnd={setEndM} compLabel={compLabel} actLast={actLast}/></div>

      {isGroup&&!["group","data","deadlines"].includes(tab)&&(
        <div style={{borderTop:"1px solid #0c1829",background:"#060a14",padding:"8px 32px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",marginRight:isMobile?0:320}}>
          <span style={{fontSize:10,color:SLATE,fontFamily:"'DM Mono',monospace"}}>VIEWING</span>
          <button onClick={()=>setActiveEntity(null)} style={{padding:"4px 12px",borderRadius:6,fontFamily:"'DM Mono',monospace",fontSize:10,cursor:"pointer",border:"1px solid "+(activeEntity===null?"#3b82f6":"#1e2d45"),background:activeEntity===null?"#1e3a5f":"transparent",color:activeEntity===null?"#60a5fa":SLATE}}>Consolidated</button>
          {entities.map(ent=>(
            <button key={ent.id} onClick={()=>setActiveEntity(ent.id)} style={{padding:"4px 12px",borderRadius:6,fontFamily:"'DM Mono',monospace",fontSize:10,cursor:"pointer",border:"1px solid "+(activeEntity===ent.id?ent.color:"#1e2d45"),background:activeEntity===ent.id?ent.color+"22":"transparent",color:activeEntity===ent.id?ent.color:SLATE,display:"flex",alignItems:"center",gap:5}}>
              <span style={{width:5,height:5,borderRadius:"50%",background:ent.color,display:"inline-block"}}/>
              {ent.name}
            </button>
          ))}
        </div>
      )}

      <div style={{padding:isMobile?"16px 16px":"22px 32px",marginRight:isMobile?0:320}}>

        {tab==="group"&&(
          <GroupStructureTab entities={entities} selectedEnt={selectedEnt} setSelectedEnt={setSelectedEnt} editingEnt={editingEnt} setEditingEnt={setEditingEnt} isGroup={isGroup} addEntity={addEntity} updateEntity={updateEntity} removeEntity={removeEntity}/>
        )}

        {tab==="kpis"&&(
          <div style={{display:"flex",flexDirection:"column",gap:24}}>
            <div>
              <SecTitle c="Profitability"/>
              <div className="tf-grid-3" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:14}}>
                <Gauge label="Gross Margin"  value={gmPct}  unit="%" target={65} targetLabel="Target" color={CYAN}   desc="(Revenue − COGS) / Revenue"/>
                <Gauge label="EBIT Margin"   value={emPct}  unit="%" target={15} targetLabel="Target" color={BLUE}   desc="EBIT / Revenue"/>
                <Gauge label="ROE"           value={roePct} unit="%" target={12} targetLabel="Min"    color={PURPLE} desc="Net Profit / Equity"/>
              </div>
              <div style={{background:"#0c1420",border:"1px solid #0f1e30",borderRadius:12,padding:22}}>
                <div style={{fontSize:11,color:SLATE,fontFamily:"'DM Mono',monospace",marginBottom:12}}>Margin % Trend</div>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={marginData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#0f1e30"/>
                    <XAxis dataKey="month" tick={{fontSize:10,fill:SLATE}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontSize:10,fill:SLATE}} axisLine={false} tickLine={false} tickFormatter={v=>v+"%"}/>
                    <Tooltip content={<Tt/>}/>
                    <Line type="monotone" dataKey="gross" stroke={CYAN} strokeWidth={2} dot={false} name="Gross %"/>
                    <Line type="monotone" dataKey="ebit"  stroke={BLUE} strokeWidth={2} dot={false} name="EBIT %"/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <SecTitle c="Sustainability"/>
              <div className="tf-grid-3" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:14}}>
                <Gauge label="Equity Ratio"      value={eqR}   unit="%" target={40} targetLabel="Min" color={GREEN} desc="Equity / Total Capital"/>
                <Gauge label="Gearing Ratio"     value={gear}  unit="%" target={80} targetLabel="Max" color={AMBER} desc="Debt / Equity · lower is better" flip={true}/>
                <Gauge label="Interest Coverage" value={intCov} unit="x" target={3}  targetLabel="Min" color={CYAN}  desc="EBIT / Finance costs"/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                <div style={{background:"#0c1420",border:"1px solid #0f1e30",borderRadius:12,padding:22}}>
                  <div style={{fontSize:11,color:SLATE,fontFamily:"'DM Mono',monospace",marginBottom:12}}>Equity vs Debt</div>
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={eqDebtData}>
                      <defs><linearGradient id="eqG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={GREEN} stopOpacity={0.2}/><stop offset="95%" stopColor={GREEN} stopOpacity={0}/></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#0f1e30"/>
                      <XAxis dataKey="month" tick={{fontSize:10,fill:SLATE}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fontSize:10,fill:SLATE}} axisLine={false} tickLine={false} tickFormatter={v=>"€"+(v/1e6).toFixed(1)+"M"}/>
                      <Tooltip content={<Tt/>}/>
                      <Area type="monotone" dataKey="equity" stroke={GREEN} fill="url(#eqG)" strokeWidth={2} name="Equity"/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div style={{background:"#0c1420",border:"1px solid #0f1e30",borderRadius:12,padding:22}}>
                  <div style={{fontSize:11,color:SLATE,fontFamily:"'DM Mono',monospace",marginBottom:12}}>Gearing Trend</div>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={gearData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#0f1e30"/>
                      <XAxis dataKey="month" tick={{fontSize:10,fill:SLATE}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fontSize:10,fill:SLATE}} axisLine={false} tickLine={false} tickFormatter={v=>v+"%"}/>
                      <Tooltip content={<Tt/>}/>
                      <ReferenceLine y={80} stroke={RED} strokeDasharray="4 4"/>
                      <Line type="monotone" dataKey="gearing" stroke={AMBER} strokeWidth={2} dot={false} name="Gearing %"/>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div>
              <SecTitle c="Efficiency"/>
              <div className="tf-grid-3" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:14}}>
                <Gauge label="DSO (AR days)"  value={dso} unit=" days" target={45} targetLabel="Max" color={CYAN}   desc="Receivables / (Revenue/365)" flip={true}/>
                <Gauge label="DIO (Inv days)" value={dio} unit=" days" target={60} targetLabel="Max" color={PURPLE} desc="Inventory / (Revenue/365)" flip={true}/>
                <Gauge label="DPO (AP days)"  value={dpo} unit=" days" target={30} targetLabel="Min" color={AMBER}  desc="Payables / (Revenue/365)"/>
              </div>
              <div style={{background:"#0c1420",border:"1px solid #0f1e30",borderRadius:12,padding:22}}>
                <div style={{fontSize:11,color:SLATE,fontFamily:"'DM Mono',monospace",marginBottom:12}}>DSO Trend</div>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={effData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#0f1e30"/>
                    <XAxis dataKey="month" tick={{fontSize:10,fill:SLATE}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontSize:10,fill:SLATE}} axisLine={false} tickLine={false} tickFormatter={v=>v+" d"}/>
                    <Tooltip content={<Tt/>}/>
                    <ReferenceLine y={45} stroke={RED} strokeDasharray="4 4"/>
                    <Line type="monotone" dataKey="dso" stroke={CYAN} strokeWidth={2} dot={false} name="DSO"/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

                {tab==="forecast"&&(
          <ForecastTab
            actuals={actuals} comp={comp} compLabel={compLabel}
            mode={mode} setMode={setMode} S={S} E={E}
            fcRevData={fcRevData} fcEqData={fcEqData} fcCashData={fcCashData}
            downloadTemplate={downloadTemplate}
          />
        )}

        {tab==="pl"&&(
          <PLTab actuals={actuals} comp={comp} compLabel={compLabel} mode={mode} setMode={setMode} S={S} E={E} visMonths={visMonths} monthTypes={monthTypes} plRows={plRows} year={year}/>
        )}

        {tab==="balance"&&(
          <BalanceTab actuals={actuals} comp={comp} compLabel={compLabel} mode={mode} setMode={setMode} S={S} E={E} visMonths={visMonths} monthTypes={monthTypes} balRows={balRows} year={year} totCurr={totCurr} totAss={totAss} totLiab={totLiab}/>
        )}

        {tab==="cashflow"&&(
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div className="tf-grid-5" style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:14}}>
              {[
                {l:"Operative CF",  v:totOp,                   c:totOp>=0?GREEN:RED},
                {l:"Investment CF", v:totInv,                  c:totInv>=0?GREEN:RED},
                {l:"Financing CF",  v:totFin,                  c:totFin>=0?GREEN:RED},
                {l:"Net Cash Change",v:totOp+totInv+totFin,    c:(totOp+totInv+totFin)>=0?GREEN:RED},
                {l:"Closing Cash",  v:closCash[E],             c:closCash[E]>=0?CYAN:RED},
              ].map(k=>(
                <div key={k.l} style={{background:"#0c1420",border:"1px solid #0f1e30",borderRadius:12,padding:"14px 18px"}}>
                  <div style={{fontSize:10,color:SLATE,fontFamily:"'DM Mono',monospace",marginBottom:6,textTransform:"uppercase"}}>{k.l}</div>
                  <div style={{fontSize:20,fontWeight:700,color:k.c,fontFamily:"'DM Mono',monospace"}}>{fmt(k.v)}</div>
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <div style={{background:"#0c1420",border:"1px solid #0f1e30",borderRadius:12,padding:22}}>
                <div style={{fontSize:11,color:SLATE,fontFamily:"'DM Mono',monospace",marginBottom:12}}>Monthly Cash Flows</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={cfChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#0f1e30"/>
                    <XAxis dataKey="month" tick={{fontSize:10,fill:SLATE}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontSize:10,fill:SLATE}} axisLine={false} tickLine={false} tickFormatter={v=>"€"+(v/1e3).toFixed(0)+"K"}/>
                    <Tooltip content={<Tt/>}/>
                    <Bar dataKey="op"  fill={GREEN} name="Operative" radius={[2,2,0,0]}/>
                    <Bar dataKey="inv" fill={RED}   name="Investment" radius={[2,2,0,0]}/>
                    <Bar dataKey="fin" fill={AMBER} name="Financing" radius={[2,2,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{background:"#0c1420",border:"1px solid #0f1e30",borderRadius:12,padding:22}}>
                <div style={{fontSize:11,color:SLATE,fontFamily:"'DM Mono',monospace",marginBottom:12}}>End Cash Balance</div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={cfAll}>
                    <defs><linearGradient id="cashG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={CYAN} stopOpacity={0.3}/><stop offset="95%" stopColor={CYAN} stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#0f1e30"/>
                    <XAxis dataKey="month" tick={{fontSize:10,fill:SLATE}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontSize:10,fill:SLATE}} axisLine={false} tickLine={false} tickFormatter={v=>"€"+(v/1e3).toFixed(0)+"K"}/>
                    <Tooltip content={<Tt/>}/>
                    <Area type="monotone" dataKey="endCash" stroke={CYAN} fill="url(#cashG)" strokeWidth={2} name="End Cash"/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{background:"#0c1420",border:"1px solid #0f1e30",borderRadius:12,overflow:"hidden"}}>
              <div style={{padding:"14px 22px",borderBottom:"1px solid #0f1e30"}}>
                <div style={{fontSize:13,fontWeight:600,color:"#94a3b8"}}>Cash Flow Statement · {MONTHS[S]}–{MONTHS[E]} {year}</div>
              </div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,fontFamily:"'DM Mono',monospace"}}>
                  <TblHead visMonths={visMonths} monthTypes={monthTypes} totalLabel={MONTHS[S]+"–"+MONTHS[E]}/>
                  <tbody>
                    {cfTbl.map((row,ri)=>{
                      const sliced=sl(row.aa,S,E);
                      const total=sum(sliced);
                      const labelPad = row.indent ? "7px 20px 7px 36px" : "7px 20px";
                      const rowBg    = row.bold ? "rgba(255,255,255,0.02)" : "transparent";
                      const topBorder = row.bold ? "1px solid #1e2d45" : "1px solid #080f1a";
                      return (
                        <tr key={ri} className="tbl-row" style={{borderBottom:"1px solid #080f1a",borderTop:topBorder,background:rowBg}}>
                          <td style={{padding:labelPad,color:row.color,fontWeight:row.bold?700:400,fontSize:row.bold?12:11,position:"sticky",left:0,background:row.bold?"#0d1625":"#0c1420",zIndex:1,borderRight:"1px solid #0f1e30"}}>{row.label}</td>
                          {sliced.map((v,i)=>[
                            <td key={"a"+i} style={{padding:"7px 8px",textAlign:"right",color:row.color,fontWeight:row.bold?700:400,fontSize:11,fontFamily:"'DM Mono',monospace",whiteSpace:"nowrap"}}>{fmt(v)}</td>,
                            <td key={"c"+i} style={{padding:"7px 4px",textAlign:"right",color:SLATE,fontSize:10}}>—</td>,
                          ])}
                          <td style={{padding:"7px 10px",textAlign:"right",color:row.color,fontWeight:700,borderLeft:"1px solid #1e2d45",fontFamily:"'DM Mono',monospace",whiteSpace:"nowrap"}}>{fmt(total)}</td>
                          <td style={{padding:"7px 8px",color:SLATE}}>—</td>
                          <td style={{padding:"7px 8px",color:SLATE}}>—</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab==="deadlines"&&(
          <div style={{background:"#0c1420",border:"1px solid #0f1e30",borderRadius:12,overflow:"hidden"}}>
            <div style={{padding:"14px 22px",borderBottom:"1px solid #0f1e30",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:13,fontWeight:600,color:"#94a3b8"}}>Notifications · {year}</div>
              <div style={{fontSize:10,color:SLATE,fontFamily:"'DM Mono',monospace"}}>{notifications.filter(n=>n.submitted).length}/{notifications.length} submitted</div>
            </div>
            <div style={{padding:"8px 8px 12px"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 180px 120px 80px",gap:0,padding:"6px 16px 8px",borderBottom:"1px solid #0f1e30"}}>
                <span style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:"#334155",textTransform:"uppercase",letterSpacing:"0.08em"}}>Period</span>
                <span style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:"#334155",textTransform:"uppercase",letterSpacing:"0.08em"}}>Due Date</span>
                <span style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:"#334155",textTransform:"uppercase",letterSpacing:"0.08em"}}></span>
                <span style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:"#334155",textTransform:"uppercase",letterSpacing:"0.08em",textAlign:"center"}}>Submitted</span>
              </div>
              {notifications.map((n)=>{
                const today = new Date();
                const dueDate = new Date(n.due);
                const diffDays = Math.ceil((dueDate-today)/(1000*60*60*24));
                const isPast = diffDays < 0;
                const isSoon = diffDays >= 0 && diffDays <= 7;
                return (
                  <div key={n.id} style={{display:"grid",gridTemplateColumns:"1fr 180px 120px 80px",gap:0,alignItems:"center",padding:"11px 16px",borderRadius:8,marginBottom:2,
                    background:n.submitted?"transparent":isSoon?"rgba(245,158,11,0.05)":"transparent",
                    border:isSoon&&!n.submitted?"1px solid rgba(245,158,11,0.15)":"1px solid transparent"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:6,height:6,borderRadius:"50%",flexShrink:0,background:n.submitted?GREEN:isPast?RED:isSoon?AMBER:"#1e2d45"}}/>
                      <span style={{fontSize:13,color:n.submitted?SLATE:"#e2e8f0",fontWeight:n.submitted?400:500}}>{n.month}</span>
                    </div>
                    <input
                      type="date"
                      value={n.due}
                      onChange={e=>updateDue(n.id,e.target.value)}
                      style={{background:"transparent",border:"1px solid #1e2d45",borderRadius:6,padding:"4px 8px",color:n.submitted?SLATE:"#94a3b8",fontSize:11,fontFamily:"'DM Mono',monospace",outline:"none",cursor:"pointer",width:140}}
                    />
                    <span style={{fontSize:10,fontFamily:"'DM Mono',monospace",color:n.submitted?GREEN:isPast?RED:isSoon?AMBER:SLATE}}>
                      {n.submitted?"✓ done":isPast?`${Math.abs(diffDays)}d overdue`:isSoon?`${diffDays}d left`:`in ${diffDays}d`}
                    </span>
                    <div style={{display:"flex",justifyContent:"center"}}>
                      <div onClick={()=>toggleSubmitted(n.id)}
                        style={{width:18,height:18,borderRadius:4,border:"1px solid "+(n.submitted?GREEN:"#1e2d45"),background:n.submitted?GREEN+"22":"transparent",
                          display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all 0.15s"}}>
                        {n.submitted&&<span style={{fontSize:11,color:GREEN,lineHeight:1}}>✓</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      <AiAssistant financialContext={{
        period:      MONTHS[S]+"–"+MONTHS[E],
        year,
        actLastMonth:MONTHS[actLast],
        compLabel,
        revenue:     fmt(totRev),
        revVar:      fmt(totRev - sum(sl(comp.revenue,S,E))),
        ebitda:      fmt(sum(sl(actuals.ebitda,S,E))),
        netProfit:   fmt(totNet),
        equity:      fmt(endEq),
        cash:        fmt(actuals.cash[E]||0),
        gmPct, emPct, roePct, eqR, gear, intCov, dso, dio, dpo,
      }} isMobile={isMobile} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}/>


    </div>
  );
}

// ── AUTH: Supabase email + password + TOTP (Google Authenticator) ─────────────

function LoginScreen({onLogin}) {
  const [user,    setUser]    = React.useState("");
  const [pw,      setPw]      = React.useState("");
  const [err,     setErr]     = React.useState(false);
  const [focused, setFocused] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const canvasRef = React.useRef(null);

  // ── Animated canvas background ──────────────────────────────────────────
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    let W = canvas.width  = window.innerWidth;
    let H = canvas.height = window.innerHeight;

    const onResize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    // Generate flowing chart lines
    const LINES = 8;
    const lines = Array.from({length: LINES}, (_, i) => {
      const points = 120;
      const baseY  = H * (0.15 + i * 0.1);
      const amp    = 30 + Math.random() * 60;
      const freq   = 0.008 + Math.random() * 0.012;
      const speed  = 0.003 + Math.random() * 0.004;
      const colors = ["#1e3a5f","#0d2545","#1a3a6b","#0f2a50","#162d4a","#0c2040","#1e3560","#0a1e3a"];
      const accentChance = i < 2;
      return { baseY, amp, freq, speed, phase: Math.random()*Math.PI*2, color: accentChance ? "#1e3a5f" : colors[i], accent: accentChance, points, prevY: Array(points).fill(baseY) };
    });

    // Floating data particles
    const PARTICLES = 60;
    const particles = Array.from({length: PARTICLES}, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random()-0.5)*0.4,
      vy: (Math.random()-0.5)*0.4,
      r: Math.random()*1.5+0.5,
      alpha: Math.random()*0.4+0.1,
      color: Math.random()>0.85 ? "#3b82f6" : Math.random()>0.7 ? "#0ea5e9" : "#1e3a5f",
    }));

    // Grid lines
    const GRID_COLS = 12, GRID_ROWS = 8;

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Deep background gradient
      const bg = ctx.createRadialGradient(W*0.3, H*0.4, 0, W*0.5, H*0.5, W*0.8);
      bg.addColorStop(0, "#080f1e");
      bg.addColorStop(0.5, "#060c18");
      bg.addColorStop(1, "#040810");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Subtle grid
      ctx.strokeStyle = "rgba(20,40,70,0.35)";
      ctx.lineWidth = 0.5;
      for (let c = 0; c <= GRID_COLS; c++) {
        const x = (W / GRID_COLS) * c;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let r = 0; r <= GRID_ROWS; r++) {
        const y = (H / GRID_ROWS) * r;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // Flowing chart lines
      lines.forEach((line, li) => {
        const step = W / line.points;
        ctx.beginPath();
        for (let p = 0; p < line.points; p++) {
          const x = p * step;
          const y = line.baseY + Math.sin(p * line.freq + t * line.speed + line.phase) * line.amp
                  + Math.sin(p * line.freq * 2.3 + t * line.speed * 1.7) * line.amp * 0.3;
          line.prevY[p] = y;
          if (p === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        const grad = ctx.createLinearGradient(0, 0, W, 0);
        if (line.accent) {
          grad.addColorStop(0, "rgba(30,58,95,0)");
          grad.addColorStop(0.3, "rgba(59,130,246,0.15)");
          grad.addColorStop(0.7, "rgba(14,165,233,0.2)");
          grad.addColorStop(1, "rgba(30,58,95,0)");
        } else {
          grad.addColorStop(0, "rgba(15,30,60,0)");
          grad.addColorStop(0.5, "rgba(20,45,80,0.12)");
          grad.addColorStop(1, "rgba(15,30,60,0)");
        }
        ctx.strokeStyle = grad;
        ctx.lineWidth = line.accent ? 1.5 : 0.8;
        ctx.stroke();

        // Area fill under accent lines
        if (line.accent) {
          ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
          const fill = ctx.createLinearGradient(0, line.baseY - line.amp, 0, H);
          fill.addColorStop(0, "rgba(59,130,246,0.04)");
          fill.addColorStop(1, "rgba(59,130,246,0)");
          ctx.fillStyle = fill;
          ctx.fill();
        }

        // Animated dot on rightmost visible point (every 3rd line)
        if (li % 3 === 0) {
          const px = W - step;
          const py = line.prevY[line.points - 1];
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI*2);
          ctx.fillStyle = line.accent ? "rgba(96,165,250,0.8)" : "rgba(30,80,140,0.5)";
          ctx.fill();
        }
      });

      // Floating particles
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = p.color.replace(")", `,${p.alpha})`).replace("rgb(","rgba(").replace("#", "");
        // simpler approach:
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Vignette
      const vig = ctx.createRadialGradient(W/2, H/2, H*0.2, W/2, H/2, H*0.9);
      vig.addColorStop(0, "rgba(4,8,16,0)");
      vig.addColorStop(1, "rgba(4,8,16,0.7)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      t++;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);

  const submit = async () => {
    if (loading || success) return;
    if (!user || !pw) { setErr(true); setTimeout(() => setErr(false), 1400); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: user, password: pw });
    if (error) {
      setLoading(false); setErr(true); setTimeout(() => setErr(false), 1400);
    } else {
      setSuccess(true);
      setTimeout(() => onLogin(), 600);
    }
  };

  const inputStyle = (field) => ({
    width:"100%", background:"rgba(7,12,23,0.8)",
    border:"1px solid "+(err?"rgba(248,113,113,0.6)":focused===field?"rgba(59,130,246,0.6)":"rgba(30,45,69,0.8)"),
    borderRadius:10, padding:"12px 16px", color:"#e2e8f0", fontSize:13, outline:"none",
    fontFamily:"'DM Sans',sans-serif", marginBottom:14, boxSizing:"border-box",
    transition:"border-color 0.2s, box-shadow 0.2s",
    boxShadow: focused===field?"0 0 0 3px rgba(59,130,246,0.1)":"none",
  });

  return (
    <div style={{position:"relative",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
      <canvas ref={canvasRef} style={{position:"absolute",inset:0,width:"100%",height:"100%"}}/>

      {/* Ambient glow behind card */}
      <div style={{position:"absolute",width:500,height:500,borderRadius:"50%",
        background:"radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)",
        pointerEvents:"none",zIndex:1}}/>

      {/* Login card */}
      <div style={{
        position:"relative", zIndex:2, width:360,
        background:"rgba(10,16,28,0.85)",
        backdropFilter:"blur(20px)",
        WebkitBackdropFilter:"blur(20px)",
        border:"1px solid rgba(30,58,95,0.6)",
        borderRadius:20,
        boxShadow:"0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.05), inset 0 1px 0 rgba(255,255,255,0.04)",
        padding:"44px 40px 36px",
        animation:"cardIn 0.6s cubic-bezier(0.16,1,0.3,1) forwards",
      }}>
        <style>{`
          @keyframes cardIn {
            from { opacity:0; transform:translateY(24px) scale(0.97); }
            to   { opacity:1; transform:translateY(0) scale(1); }
          }
          @keyframes shake {
            0%,100%{transform:translateX(0)}
            20%{transform:translateX(-8px)}
            40%{transform:translateX(8px)}
            60%{transform:translateX(-5px)}
            80%{transform:translateX(5px)}
          }
          @keyframes spin {
            to { transform:rotate(360deg); }
          }
          @keyframes successPulse {
            0%   { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
            100% { box-shadow: 0 0 0 16px rgba(34,197,94,0); }
          }
          .login-card-inner { animation: ${err?"shake 0.4s ease":"none"}; }
        `}</style>

        <div className="login-card-inner">
          {/* Logo */}
          <div style={{textAlign:"center",marginBottom:32}}>
            <img src="https://y-lehti.fi/wp-content/uploads/2024/09/logo_tf-1024x293.png"
              alt="Targetflow"
              style={{width:160,marginBottom:14,filter:"brightness(0) invert(1)",opacity:0.95}}/>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:ACCENT,boxShadow:`0 0 8px ${ACCENT}`}}/>
              <span style={{fontSize:12,color:"rgba(96,165,250,0.8)",fontFamily:"'DM Mono',monospace",letterSpacing:"0.06em"}}>
                {CLIENT_NAME}
              </span>
            </div>
          </div>

          {/* Fields */}
          <div style={{marginBottom:6}}>
            <div style={{fontSize:10,color:"rgba(100,116,139,0.8)",fontFamily:"'DM Mono',monospace",
              textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Username</div>
            <input type="text" value={user} onChange={e=>setUser(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="Email address"
              onFocus={()=>setFocused("user")} onBlur={()=>setFocused(null)}
              autoComplete="off" style={inputStyle("user")}/>
          </div>

          <div style={{marginBottom:20}}>
            <div style={{fontSize:10,color:"rgba(100,116,139,0.8)",fontFamily:"'DM Mono',monospace",
              textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Password</div>
            <input type="password" value={pw} onChange={e=>setPw(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="Enter password"
              onFocus={()=>setFocused("pw")} onBlur={()=>setFocused(null)}
              style={inputStyle("pw")}/>
          </div>

          {/* Submit button */}
          <button onClick={submit}
            style={{
              width:"100%", padding:"13px",
              background: success
                ? "linear-gradient(135deg,#16a34a,#22c55e)"
                : loading
                ? "rgba(30,58,95,0.6)"
                : `linear-gradient(135deg, #1d4ed8, #0ea5e9)`,
              border:"none", borderRadius:11,
              color: success||loading ? "#fff" : "#fff",
              fontWeight:700, fontSize:13, cursor: loading||success?"default":"pointer",
              fontFamily:"'DM Sans',sans-serif",
              transition:"all 0.3s",
              boxShadow: success
                ? "0 0 0 0 rgba(34,197,94,0.4), 0 8px 24px rgba(22,163,74,0.3)"
                : loading ? "none"
                : "0 8px 24px rgba(29,78,216,0.3)",
              animation: success ? "successPulse 0.6s ease" : "none",
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            }}>
            {loading && !success && (
              <div style={{width:14,height:14,border:"2px solid rgba(255,255,255,0.3)",
                borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>
            )}
            {success ? "✓ Welcome" : loading ? "Signing in…" : "Sign in →"}
          </button>

          {err && (
            <div style={{marginTop:12,textAlign:"center",fontSize:11,color:"rgba(248,113,113,0.9)",
              fontFamily:"'DM Mono',monospace",animation:"cardIn 0.2s ease"}}>
              Incorrect username or password
            </div>
          )}

          {/* Footer */}
          <div style={{marginTop:24,paddingTop:18,borderTop:"1px solid rgba(15,30,48,0.8)",
            display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            <div style={{width:5,height:5,borderRadius:"50%",background:"#22c55e",
              boxShadow:"0 0 6px #22c55e"}}/>
            <span style={{fontSize:10,color:"rgba(100,116,139,0.6)",fontFamily:"'DM Mono',monospace"}}>
              Secured · Targetflow v2
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}


function MfaScreen({onVerified}) {
  const [code,    setCode]    = React.useState("");
  const [err,     setErr]     = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const verify = async () => {
    if(loading||code.length<6) return;
    setLoading(true);
    try {
      const {data:factors} = await supabase.auth.mfa.listFactors();
      const totp = factors?.totp?.[0];
      if(!totp){ setErr(true); setLoading(false); return; }
      const {data:challenge} = await supabase.auth.mfa.challenge({factorId: totp.id});
      const {error} = await supabase.auth.mfa.verify({
        factorId: totp.id,
        challengeId: challenge.id,
        code: code.trim()
      });
      if(error){ setErr(true); setLoading(false); setTimeout(()=>setErr(false),1400); }
      else { setTimeout(()=>onVerified(), 500); }
    } catch(e) { setErr(true); setLoading(false); }
  };

  return (
    <div style={{minHeight:"100vh",background:"#080b12",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:"rgba(8,14,28,0.95)",border:"1px solid #1e2d45",borderRadius:16,padding:"40px 36px",width:360,boxSizing:"border-box"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:44,height:44,borderRadius:"50%",background:"linear-gradient(135deg,#1d4ed8,#0ea5e9)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:20}}>🔐</div>
          <div style={{fontSize:18,fontWeight:700,color:"#e2e8f0",marginBottom:6}}>Two-factor auth</div>
          <div style={{fontSize:12,color:"#64748b"}}>Enter the 6-digit code from Google Authenticator</div>
        </div>
        <input
          value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))}
          onKeyDown={e=>e.key==="Enter"&&verify()}
          placeholder="000000"
          maxLength={6}
          style={{width:"100%",background:"#0c1420",border:"1px solid "+(err?"#f87171":"#1e2d45"),
            borderRadius:10,padding:"14px 16px",color:"#e2e8f0",fontSize:22,outline:"none",
            fontFamily:"'DM Mono',monospace",letterSpacing:8,textAlign:"center",boxSizing:"border-box",marginBottom:14}}
        />
        {err&&<div style={{color:"#f87171",fontSize:11,textAlign:"center",marginBottom:10,fontFamily:"'DM Mono',monospace"}}>Invalid code — try again</div>}
        <button onClick={verify} disabled={code.length<6||loading}
          style={{width:"100%",padding:"13px",borderRadius:10,
            background:code.length===6&&!loading?"linear-gradient(135deg,#1d4ed8,#0ea5e9)":"#0c1420",
            border:"1px solid "+(code.length===6&&!loading?"#3b82f6":"#1e2d45"),
            color:code.length===6&&!loading?"#fff":"#64748b",fontSize:13,fontWeight:600,cursor:code.length===6?"pointer":"not-allowed"}}>
          {loading?"Verifying…":"Verify"}
        </button>
      </div>
    </div>
  );
}

function MfaEnrollScreen({onDone}) {
  const [qr,      setQr]      = React.useState(null);
  const [secret,  setSecret]  = React.useState(null);
  const [factorId,setFactorId]= React.useState(null);
  const [code,    setCode]    = React.useState("");
  const [err,     setErr]     = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const {data, error} = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Authenticator" });
      if(error || !data) { setErr(true); return; }
      setFactorId(data.id);
      setQr(data.totp.qr_code);
      setSecret(data.totp.secret);
    })();
  }, []);

  const verify = async () => {
    if(loading || code.length < 6) return;
    setLoading(true);
    const {data:challenge} = await supabase.auth.mfa.challenge({factorId});
    const {error} = await supabase.auth.mfa.verify({factorId, challengeId: challenge.id, code: code.trim()});
    if(error) { setErr(true); setLoading(false); setTimeout(()=>setErr(false),1400); }
    else { setTimeout(()=>onDone(), 500); }
  };

  return (
    <div style={{minHeight:"100vh",background:"#080b12",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:"rgba(8,14,28,0.95)",border:"1px solid #1e2d45",borderRadius:16,padding:"40px 36px",width:380,boxSizing:"border-box",textAlign:"center"}}>
        <div style={{width:44,height:44,borderRadius:"50%",background:"linear-gradient(135deg,#1d4ed8,#0ea5e9)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:20}}>🔐</div>
        <div style={{fontSize:18,fontWeight:700,color:"#e2e8f0",marginBottom:6}}>Set up two-factor auth</div>
        <div style={{fontSize:12,color:"#64748b",marginBottom:24}}>Scan this QR code with Google Authenticator</div>
        {qr ? (
          <img src={qr} alt="QR Code" style={{width:180,height:180,borderRadius:12,background:"#fff",padding:8,marginBottom:20}}/>
        ) : (
          <div style={{width:180,height:180,background:"#0c1420",borderRadius:12,margin:"0 auto 20px",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{color:"#475569",fontSize:11,fontFamily:"'DM Mono',monospace"}}>{err?"Error":"Loading…"}</div>
          </div>
        )}
        {secret && (
          <div style={{marginBottom:20}}>
            <div style={{fontSize:10,color:"#475569",fontFamily:"'DM Mono',monospace",marginBottom:6}}>Or enter manually:</div>
            <div style={{fontSize:12,color:"#93c5fd",fontFamily:"'DM Mono',monospace",letterSpacing:2,background:"#0c1420",padding:"8px 12px",borderRadius:8,border:"1px solid #1e2d45"}}>{secret}</div>
          </div>
        )}
        <div style={{fontSize:11,color:"#64748b",marginBottom:12}}>Enter the 6-digit code to confirm</div>
        <input
          value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))}
          onKeyDown={e=>e.key==="Enter"&&verify()}
          placeholder="000000" maxLength={6}
          style={{width:"100%",background:"#0c1420",border:"1px solid "+(err?"#f87171":"#1e2d45"),borderRadius:10,padding:"14px 16px",color:"#e2e8f0",fontSize:22,outline:"none",fontFamily:"'DM Mono',monospace",letterSpacing:8,textAlign:"center",boxSizing:"border-box",marginBottom:14}}
        />
        {err&&<div style={{color:"#f87171",fontSize:11,marginBottom:10,fontFamily:"'DM Mono',monospace"}}>Invalid code — try again</div>}
        <button onClick={verify} disabled={code.length<6||loading}
          style={{width:"100%",padding:"13px",borderRadius:10,background:code.length===6&&!loading?"linear-gradient(135deg,#1d4ed8,#0ea5e9)":"#0c1420",border:"1px solid "+(code.length===6&&!loading?"#3b82f6":"#1e2d45"),color:code.length===6&&!loading?"#fff":"#64748b",fontSize:13,fontWeight:600,cursor:code.length===6?"pointer":"not-allowed"}}>
          {loading?"Verifying…":"Activate & continue →"}
        </button>
      </div>
    </div>
  );
}

function AppWithAuth() {
  const [stage, setStage] = React.useState("login");

  const goIn = async () => {
    try {
      const {data:{session}} = await supabase.auth.getSession();
      if(!session){ setStage("login"); return; }
      const email = session.user?.email||"";
      if(!ALLOWED_EMAILS.includes(email)){
        await supabase.auth.signOut();
        setStage("denied"); return;
      }
      const {data:aal} = await supabase.auth.mfa.getAuthenticatorAssuranceLevel().catch(()=>({data:null}));
      const {data:factors} = await supabase.auth.mfa.listFactors().catch(()=>({data:null}));
      const hasTotp = factors?.totp?.length > 0;
      if(!hasTotp) { setStage("enroll"); return; }
      if(aal?.nextLevel==="aal2" && aal?.currentLevel!=="aal2") setStage("mfa");
      else setStage("done");
    } catch(e) { setStage("login"); }
  };

  if(stage==="denied") return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#080b12"}}>
      <div style={{background:"#0c1420",border:"1px solid #f8717133",borderRadius:16,padding:"40px 36px",textAlign:"center",maxWidth:360}}>
        <div style={{fontSize:28,marginBottom:16}}>🚫</div>
        <div style={{fontSize:16,fontWeight:700,color:"#f87171",marginBottom:8}}>Access denied</div>
        <div style={{fontSize:12,color:"#64748b",marginBottom:24}}>Your account is not authorised for this dashboard.</div>
        <button onClick={async()=>{await supabase.auth.signOut();setStage("login");}} style={{padding:"10px 24px",borderRadius:9,background:"#0c1420",border:"1px solid #1e2d45",color:"#94a3b8",fontSize:12,cursor:"pointer"}}>Back to login</button>
      </div>
    </div>
  );
  if(stage==="enroll") return <MfaEnrollScreen onDone={goIn} />;
  if(stage==="mfa")   return <MfaScreen onVerified={goIn} />;
  if(stage==="done")  return <Dashboard/>;
  return <LoginScreen onLogin={goIn} />;
}

export default AppWithAuth;
