import React from "react";
import { useState, useRef } from "react";
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
const ALLOWED_EMAILS = ['lukas.paulikas@accrease.com', "niklas.isaksson@targetflow.fi"];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const BLUE="#3b82f6",GREEN="#22c55e",AMBER="#f59e0b",RED="#f87171",PURPLE="#a78bfa",CYAN="#06b6d4",SLATE="#64748b";
const ACT_LAST_DEFAULT = 11;

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

const TblRow = ({label,actArr,compArr,color,bold,indent,s,e}) => {
  const aSlice = sl(actArr,s,e);
  const cSlice = compArr?sl(compArr,s,e):null;
  const totA   = sum(aSlice);
  const totC   = cSlice?sum(cSlice):null;
  const totV   = totC!==null?totA-totC:null;
  return (
    <tr className="tbl-row" style={{borderBottom:"1px solid #080f1a"}}>
      <td style={{padding:"7px 20px",color,fontWeight:bold?600:400,fontSize:bold?12:11,paddingLeft:indent?32:20,position:"sticky",left:0,background:"#0c1420",zIndex:1}}>{label}</td>
      {aSlice.map((av,i) => {
        const cv = cSlice?cSlice[i]:null;
        return [
          <td key={"a"+i} style={{padding:"7px 8px",textAlign:"right",color,fontWeight:bold?600:400,fontSize:11,fontFamily:"'DM Mono',monospace",whiteSpace:"nowrap"}}>{fmt(av)}</td>,
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

function AiAssistant({financialContext}) {
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
    <div style={{position:"fixed",top:0,right:0,width:320,height:"100vh",
      display:"flex",flexDirection:"column",background:"#060a14",
      borderLeft:"1px solid #0f1e30",zIndex:500}}>

      {/* Header */}
      <div style={{padding:"14px 18px",borderBottom:"1px solid #0f1e30",display:"flex",alignItems:"center",justifyContent:"space-between",background:"linear-gradient(135deg,#0a1628,#060e1e)",flexShrink:0,height:56}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#1d4ed8,#0ea5e9)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontFamily:"'DM Mono',monospace",fontWeight:700,color:"#fff",letterSpacing:"-0.5px",flexShrink:0}}>E9K</div>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:"#e2e8f0"}}>EBITDA-9000</div>
            <div style={{fontSize:9,color:loading?AMBER:GREEN,fontFamily:"'DM Mono',monospace"}}>{loading?"Crunching numbers…":"● Online"}</div>
          </div>
        </div>
        {usage>0&&<div style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:"#334155"}}>{usage}/{MONTHLY_CAP}</div>}
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
  { field:"revenue",     ranges:[[3000,3999]], sign: 1 },
  { field:"cogs",        ranges:[[4000,4999]], sign:-1 },
  { field:"opex",        ranges:[[5000,6999]], sign:-1 },
  { field:"finExpenses", ranges:[[7000,7799]], sign:-1 },
  { field:"tax",         ranges:[[7800,7899]], sign:-1 },
  { field:"depAmort",    ranges:[[8000,8099]], sign:-1 },
  { field:"tangibles",   ranges:[[1000,1299]], sign: 1 },
  { field:"inventory",   ranges:[[1300,1499]], sign: 1 },
  { field:"receivables", ranges:[[1500,1799]], sign: 1 },
  { field:"otherCA",     ranges:[[1900,1999]], sign: 1 },
  { field:"cash",        ranges:[[1800,1899]], sign: 1 },
  { field:"equity",      ranges:[[2000,2499]], sign:-1 },
  { field:"ltDebt",      ranges:[[2500,2699]], sign:-1 },
  { field:"stDebt",      ranges:[[2700,2899]], sign:-1 },
  { field:"payables",    ranges:[[2900,2999]], sign:-1 },
  { field:"otherCL",     ranges:[[3000,3099]], sign:-1 },
];

function codeToMapping(code) {
  const n = parseInt(code);
  if (isNaN(n)) return null;
  for (const m of FICOA_MAP) {
    for (const [lo,hi] of m.ranges) { if (n>=lo && n<=hi) return m; }
  }
  return null;
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
                         mode,setMode,parseCSV,unmapped,exportActCSV,exportCSV,
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
                    <button key={t.id} onClick={()=>{ setUploadType(t.id); if(t.id!=="actuals") setMode(t.id==="budget"?"budget":"forecast"); }}
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
                {uploadType==="budget"   && (actAccounts&&actAccounts.length>0?"Template mirrors your actuals accounts":"Annual budget figures")}
                {uploadType==="forecast" && (actAccounts&&actAccounts.length>0?"Template mirrors your actuals accounts":"Rolling forecast figures")}
              </div>
              <button onClick={uploadType==="actuals"?exportActCSV:exportCSV}
                style={{padding:"5px 10px",flexShrink:0,marginLeft:8,
                  background:uploadType==="actuals"?"rgba(96,165,250,0.06)":"rgba(251,191,36,0.06)",
                  border:"1px solid "+(uploadType==="actuals"?"#3b82f6":AMBER),
                  borderRadius:7,
                  color:uploadType==="actuals"?"#60a5fa":AMBER,
                  fontFamily:"'DM Mono',monospace",fontSize:10,fontWeight:600,cursor:"pointer"}}>
                {uploadType!=="actuals"&&actAccounts&&actAccounts.length>0?"↓ Excel":"↓ Template"}
              </button>
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
        </div>
      )}
    </div>
  );
}


// ── ForecastTab ───────────────────────────────────────────────────────────────
function ForecastTab({actuals,comp,compLabel,mode,setMode,S,E,fcRevData,fcEqData,fcCashData}) {
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
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:16}}>
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
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
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
                <TblRow key={ri} label={r.label} actArr={actuals[r.ak]||[]} compArr={r.ck?comp[r.ck]:null} color={r.color} bold={r.bold} indent={r.indent} s={S} e={E}/>
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
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
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
                return <TblRow key={ri} label={r.label} actArr={aArr} compArr={cArr} color={r.color} bold={r.bold} indent={r.indent} s={S} e={E}/>;
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
  const [tab,         setTab]        = useState("group");
  const [year,        setYear]       = useState("2025");
  const [mode,        setMode]       = useState("budget");
  const [csvData,     setCsvData]    = useState(null);
  const [csvName,     setCsvName]    = useState(null);
  const [actData,     setActData]    = useState(null);
  const [actName,     setActName]    = useState(null);
  const [actLast,     setActLast]    = useState(ACT_LAST_DEFAULT);
  const [dragOver,    setDragOver]   = useState(false);
  const [unmapped,    setUnmapped]   = useState([]);
  const [actAccounts, setActAccounts]= useState(null); // account-level structure from Excel import

  const [dragOverA,   setDragOverA]  = useState(false);
  const [startM,      setStartM]     = useState(0);
  const [endM,        setEndM]       = useState(11);
  const [entities,    setEntities]   = useState([{id:"e1",name:"Accrease Oy",type:"operating",parentId:null,ownership:100,color:ACCENT}]);
  const [selectedEnt, setSelectedEnt]= useState("e1");
  const [editingEnt,  setEditingEnt] = useState(null);
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
          const result=parseExcelTrialBalance(wb);
          if(!result){alert("Could not detect trial balance format.\nExpected: rows=accounts, columns=months, first column=account code (4 digits).");return;}
          const base=isAct?actBase:budBase;
          const merged={...base,...result.mapped};
          if(isAct){
            setActData(merged);
            setUnmapped(result.unmapped);
          } else {
            setCsvData(merged);
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
    {id:"deadlines",label:"Deadlines"},
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

  const deadlines=[
    {month:"January",  due:"Feb 15",status:"done"},
    {month:"February", due:"Mar 15",status:"done"},
    {month:"March",    due:"Apr 15",status:"done"},
    {month:"April",    due:"May 15",status:"done"},
    {month:"May",      due:"Jun 15",status:"done"},
    {month:"June",     due:"Aug 15",status:"done"},
    {month:"July",     due:"Aug 15",status:"done"},
    {month:"August",   due:"Sep 15",status:"current",daysLeft:6},
    {month:"September",due:"Oct 15",status:"upcoming",daysLeft:36},
    {month:"October",  due:"Nov 15",status:"upcoming",daysLeft:67},
    {month:"November", due:"Dec 15",status:"upcoming",daysLeft:97},
    {month:"December", due:"Jan 15",status:"upcoming",daysLeft:128},
  ];

  return (
    <div style={{minHeight:"100vh",background:"#080b12",color:"#e2e8f0",fontFamily:"'DM Sans',sans-serif"}}>
      <style>{STYLE}</style>

      <div style={{borderBottom:"1px solid #0c1829",padding:"0 32px",display:"flex",alignItems:"center",justifyContent:"space-between",height:56,marginRight:320}}>
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
          <div style={{display:"flex",gap:6}}>
            {["2023","2024","2025","2026"].map(y=>(
              <button key={y} className={"yr-btn"+(year===y?" active":"")} onClick={()=>setYear(y)}>{y}</button>
            ))}
          </div>
          <CommentsPanel
            supabase={supabase}
            clientName="Accrease Oy"
            userName={userEmail||"Board Member"}
            enabled={true}
          />
          <SettingsMenu actData={actData} actName={actName} actLast={actLast} setActData={setActData} setActName={setActName} setActLast={setActLast} csvData={csvData} csvName={csvName} setCsvData={setCsvData} setCsvName={setCsvName} mode={mode} setMode={setMode} parseCSV={parseFile} unmapped={unmapped} exportActCSV={exportActCSV} exportCSV={exportCSV} fileRef={fileRef} fileRefA={fileRefA} dragOver={dragOver} setDragOver={setDragOver} dragOverA={dragOverA} setDragOverA={setDragOverA} compLabel={compLabel} entities={entities}/>
        </div>
      </div>

      <div style={{borderBottom:"1px solid #0c1829",padding:"0 32px",display:"flex",gap:0,overflowX:"auto",marginRight:320}}>
        {TABS.map(t=>(
          <button key={t.id} className="tab-btn" onClick={()=>setTab(t.id)} style={{padding:"12px 16px",fontSize:12,fontWeight:tab===t.id?600:400,color:tab===t.id?"#60a5fa":"#475569",borderBottom:tab===t.id?"2px solid #3b82f6":"2px solid transparent",marginBottom:-1,whiteSpace:"nowrap"}}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{marginRight:320}}><PeriodBar startM={S} endM={E} setStart={setStartM} setEnd={setEndM} compLabel={compLabel} actLast={actLast}/></div>

      {isGroup&&!["group","data","deadlines"].includes(tab)&&(
        <div style={{borderTop:"1px solid #0c1829",background:"#060a14",padding:"8px 32px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",marginRight:320}}>
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

      <div style={{padding:"22px 32px 22px 32px",marginRight:320}}>

        {tab==="group"&&(
          <GroupStructureTab entities={entities} selectedEnt={selectedEnt} setSelectedEnt={setSelectedEnt} editingEnt={editingEnt} setEditingEnt={setEditingEnt} isGroup={isGroup} addEntity={addEntity} updateEntity={updateEntity} removeEntity={removeEntity}/>
        )}

        {tab==="kpis"&&(
          <div style={{display:"flex",flexDirection:"column",gap:24}}>
            <div>
              <SecTitle c="Profitability"/>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:14}}>
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
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:14}}>
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
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:14}}>
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
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:14}}>
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
              <div style={{fontSize:13,fontWeight:600,color:"#94a3b8"}}>Reporting Deadlines · {year}</div>
              <div style={{fontSize:10,color:AMBER,fontFamily:"'DM Mono',monospace"}}>Next: August → Sep 15 · 6 days</div>
            </div>
            <div style={{padding:8}}>
              {deadlines.map((d,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 16px",borderRadius:8,marginBottom:2,background:d.status==="current"?"#0f1e30":"transparent",border:d.status==="current"?"1px solid #1e3a5f":"1px solid transparent"}}>
                  <div style={{display:"flex",alignItems:"center",gap:14}}>
                    <div style={{width:7,height:7,borderRadius:"50%",background:d.status==="done"?GREEN:d.status==="current"?AMBER:"#1e2d45"}}/>
                    <span style={{fontSize:13,color:d.status==="done"?SLATE:d.status==="current"?"#e2e8f0":"#475569",fontWeight:d.status==="current"?600:400}}>{d.month}</span>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:24}}>
                    <span style={{fontSize:11,fontFamily:"'DM Mono',monospace",color:SLATE}}>Due {d.due}</span>
                    {d.status==="done"     &&<span style={{fontSize:11,color:GREEN, fontFamily:"'DM Mono',monospace"}}>✓ Submitted</span>}
                    {d.status==="current"  &&<span style={{fontSize:11,color:AMBER, fontFamily:"'DM Mono',monospace",fontWeight:600}}>{d.daysLeft} days left</span>}
                    {d.status==="upcoming" &&<span style={{fontSize:11,color:"#334155",fontFamily:"'DM Mono',monospace"}}>in {d.daysLeft} days</span>}
                  </div>
                </div>
              ))}
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
      }}/>


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
      // Check MFA
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal.nextLevel === "aal2" && aal.nextLevel !== aal.currentLevel) {
        // Need MFA — handled by onAuthStateChange in AppWithAuth
        setLoading(false);
      } else {
        setSuccess(true); setTimeout(() => onLogin(), 600);
      }
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

function AppWithAuth() {
  const [authed,  setAuthed]  = React.useState(false);
  const [checked, setChecked] = React.useState(false);

  React.useEffect(()=>{
    if(!supabase){ setChecked(true); return; }
    supabase.auth.getSession().then(async({data:{session}})=>{
      if(session){
        const{data:aal}=await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if(aal.currentLevel==="aal2"||aal.currentLevel==="aal1") setAuthed(true);
      }
      setChecked(true);
    });
    const{data:sub}=supabase.auth.onAuthStateChange(async(_,session)=>{
      if(!session){ setAuthed(false); return; }
      const{data:aal}=await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if(aal.currentLevel==="aal2"||aal.currentLevel==="aal1") setAuthed(true);
      else setAuthed(false);
    });
    return ()=>sub.subscription.unsubscribe();
  },[]);

  if(!checked) return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",
      minHeight:"100vh",background:"#080b12"}}>
      <div style={{color:"#1e2d45",fontSize:20}}>●</div>
    </div>
  );
  if(!authed) return <LoginScreen onLogin={()=>setAuthed(true)}/>;
  return <Dashboard/>;
}

export default AppWithAuth;
