import React from "react";
import { useState, useRef } from "react";
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
const PASSWORD    = 'accrease2026!';
const SESSION_KEY = 'accrease_auth';
const ACCENT      = '#86efac';
const CLIENT_NAME = 'Accrease Oy';

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
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [booted,   setBooted]   = useState(false);
  const [unread,   setUnread]   = useState(0);
  const bottomRef = useRef();
  const inputRef  = useRef();

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
    setLoading(true);
    const bootMsg = "Give me a brief financial health summary for this period. Lead with the single most important thing the board should know right now, then flag up to 2 anomalies or risks. Be specific with numbers.";
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system:SYSTEM,
          messages:[{role:"user",content:bootMsg}]
        })
      });
      const data = await res.json();
      const text = data.content?.find(b=>b.type==="text")?.text || "Unable to generate summary.";
      setMessages([{role:"assistant",content:text,auto:true}]);
      if(!open) setUnread(1);
    } catch(e) {
      setMessages([{role:"assistant",content:"Could not connect to AI. Check your API configuration.",auto:true,err:true}]);
    }
    setLoading(false);
    scrollBottom();
  };

  const send = async () => {
    const text = input.trim();
    if(!text || loading) return;
    setInput("");
    const newMessages = [...messages, {role:"user",content:text}];
    setMessages(newMessages);
    setLoading(true);
    scrollBottom();
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system:SYSTEM,
          messages:newMessages.map(m=>({role:m.role,content:m.content}))
        })
      });
      const data = await res.json();
      const reply = data.content?.find(b=>b.type==="text")?.text || "No response.";
      setMessages(prev=>[...prev,{role:"assistant",content:reply}]);
    } catch(e) {
      setMessages(prev=>[...prev,{role:"assistant",content:"Error contacting AI.",err:true}]);
    }
    setLoading(false);
    scrollBottom();
  };

  const handleOpen = () => {
    setOpen(true);
    setUnread(0);
    if(!booted) boot();
    setTimeout(()=>inputRef.current?.focus(),100);
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

  return (
    <>
      {/* Floating button */}
      <div style={{position:"fixed",bottom:28,right:28,zIndex:1000}}>
        {!open && (
          <button onClick={handleOpen} style={{width:52,height:52,borderRadius:"50%",background:"linear-gradient(135deg,#1d4ed8,#0ea5e9)",border:"none",cursor:"pointer",boxShadow:"0 4px 20px #1d4ed855",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",transition:"transform 0.2s"}}
            onMouseEnter={e=>e.currentTarget.style.transform="scale(1.08)"}
            onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
            <span style={{fontSize:22}}>✦</span>
            {unread>0 && (
              <div style={{position:"absolute",top:0,right:0,width:16,height:16,borderRadius:"50%",background:RED,border:"2px solid #080b12",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#fff",fontFamily:"'DM Mono',monospace"}}>
                {unread}
              </div>
            )}
          </button>
        )}
      </div>

      {/* Chat panel */}
      {open && (
        <div style={{position:"fixed",bottom:28,right:28,zIndex:1000,width:400,height:580,display:"flex",flexDirection:"column",background:"#080e1c",border:"1px solid #1e3a5f",borderRadius:16,boxShadow:"0 16px 60px #000a",overflow:"hidden"}}>

          {/* Header */}
          <div style={{padding:"14px 18px",borderBottom:"1px solid #0f1e30",display:"flex",alignItems:"center",justifyContent:"space-between",background:"linear-gradient(135deg,#0a1628,#060e1e)",flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,#1d4ed8,#0ea5e9)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontFamily:"'DM Mono',monospace",fontWeight:700,color:"#fff",letterSpacing:"-0.5px"}}>E9K</div>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0"}}>EBITDA-9000</div>
                <div style={{fontSize:9,color:loading?AMBER:GREEN,fontFamily:"'DM Mono',monospace"}}>{loading?"Crunching numbers…":"● Online"}</div>
              </div>
            </div>
            <button onClick={()=>setOpen(false)} style={{background:"none",border:"none",color:SLATE,fontSize:18,cursor:"pointer",lineHeight:1,padding:"2px 6px"}}>✕</button>
          </div>

          {/* Messages */}
          <div style={{flex:1,overflowY:"auto",padding:"14px 16px",display:"flex",flexDirection:"column",gap:12}}>
            {messages.length===0 && loading && (
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:"#0c1420",borderRadius:12,border:"1px solid #0f1e30"}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:BLUE,animation:"pulse 1s infinite"}}/>
                <span style={{fontSize:11,color:SLATE,fontFamily:"'DM Mono',monospace"}}>EBITDA-9000 is initialising… please hold.</span>
              </div>
            )}
            {messages.map((m,i) => (
              <div key={i} style={{display:"flex",flexDirection:"column",alignItems:m.role==="user"?"flex-end":"flex-start",gap:4}}>
                {m.auto && (
                  <div style={{fontSize:9,color:BLUE,fontFamily:"'DM Mono',monospace",paddingLeft:2}}>✦ Auto-summary on load</div>
                )}
                <div style={{maxWidth:"88%",padding:"10px 14px",borderRadius:m.role==="user"?"12px 12px 2px 12px":"12px 12px 12px 2px",
                  background:m.role==="user"?"#1e3a5f":m.err?"#1a0a0a":"#0c1420",
                  border:"1px solid "+(m.role==="user"?"#3b82f655":m.err?"#f8717133":"#1e2d45"),
                  fontSize:12,color:m.err?RED:"#d1d5db",lineHeight:1.6,whiteSpace:"pre-wrap"}}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && messages.length>0 && (
              <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",background:"#0c1420",borderRadius:"12px 12px 12px 2px",border:"1px solid #1e2d45",maxWidth:"60%"}}>
                <div style={{display:"flex",gap:3}}>
                  {[0,1,2].map(n=><div key={n} style={{width:5,height:5,borderRadius:"50%",background:BLUE,opacity:0.4+n*0.3}}/>)}
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Quick prompts */}
          {messages.length<2 && !loading && (
            <div style={{padding:"0 12px 8px",display:"flex",gap:6,flexWrap:"wrap",flexShrink:0}}>
              {PROMPTS.map(p=>(
                <button key={p} onClick={()=>{setInput(p);setTimeout(()=>inputRef.current?.focus(),50);}}
                  style={{padding:"4px 10px",borderRadius:20,background:"#0c1420",border:"1px solid #1e2d45",color:SLATE,fontSize:10,fontFamily:"'DM Mono',monospace",cursor:"pointer",whiteSpace:"nowrap",transition:"all 0.15s"}}
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
              style={{flex:1,background:"#0c1420",border:"1px solid #1e2d45",borderRadius:9,padding:"8px 12px",color:"#e2e8f0",fontSize:12,outline:"none",fontFamily:"'DM Sans',sans-serif"}}
              onFocus={e=>e.target.style.borderColor="#3b82f6"}
              onBlur={e=>e.target.style.borderColor="#1e2d45"}
            />
            <button onClick={send} disabled={!input.trim()||loading}
              style={{width:36,height:36,borderRadius:9,background:input.trim()&&!loading?"#1d4ed8":"#0c1420",border:"1px solid "+(input.trim()&&!loading?"#3b82f6":"#1e2d45"),cursor:input.trim()&&!loading?"pointer":"not-allowed",color:input.trim()&&!loading?"#fff":SLATE,fontSize:16,transition:"all 0.15s",flexShrink:0}}>
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
  const [dragOverA,   setDragOverA]  = useState(false);
  const [startM,      setStartM]     = useState(0);
  const [endM,        setEndM]       = useState(11);
  const [entities,    setEntities]   = useState([{id:"e1",name:"Accrease Oy",type:"operating",parentId:null,ownership:100,color:ACCENT}]);
  const [selectedEnt, setSelectedEnt]= useState("e1");
  const [editingEnt,  setEditingEnt] = useState(null);
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
    wcChange:    d.wcChange    || Z12(),
    cfOp:        d.cfOp        || d.ebitda || Z12(),
    cfInv:       d.cfInv       || Z12(),
    cfFin:       d.cfFin       || Z12(),
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
  const cfAll     =MONTHS.map((_,i)=>({month:MONTHS[i],op:actuals.cfOp[i],inv:actuals.cfInv[i],fin:actuals.cfFin[i],net:actuals.cfOp[i]+actuals.cfInv[i]+actuals.cfFin[i],endCash:actuals.cash[i]}));
  const cfChart   =cfAll.slice(S,E+1);

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
    const hdr=["field",...MONTHS].join(",");
    const rows=CSV_FIELDS.map(f=>[f.label,...(comp[f.key]||Array(12).fill(0)).map(v=>Math.round(v))].join(","));
    const csv=["# Targetflow "+compLabel+" Template — "+year,hdr,...rows].join("\n");
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="targetflow_"+compLabel.toLowerCase()+"_"+year+".csv";a.click();
  };
  const exportActCSV=()=>{
    const hdr=["field",...MONTHS].join(",");
    const rows=CSV_FIELDS.map(f=>[f.label,...(actuals[f.key]||Array(12).fill(0)).map(v=>Math.round(v))].join(","));
    const csv=["# Targetflow Actuals — "+year,"# actuals_last: last confirmed month 1-12",hdr,"actuals_last,"+(actLast+1)+",0,0,0,0,0,0,0,0,0,0,0",...rows].join("\n");
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="targetflow_actuals_"+year+".csv";a.click();
  };
  const parseCSV=(file,isAct)=>{
    if(!file) return;
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
  };

  const TABS=[
    {id:"group",    label:"Group Structure"},
    {id:"kpis",     label:"KPIs"},
    {id:"forecast", label:"Forecast"},
    {id:"pl",       label:"P&L"},
    {id:"balance",  label:"Balance Sheet"},
    {id:"cashflow", label:"Cash Flow"},
    {id:"data",     label:"Data Import"},
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

  const netCF=MONTHS.map((_,i)=>actuals.cfOp[i]+actuals.cfInv[i]+actuals.cfFin[i]);
  const cfTbl=[
    {label:"EBITDA",                   aa:actuals.ebitda,              color:AMBER,bold:true},
    {label:"Working Capital Changes",  aa:actuals.wcChange,            color:SLATE},
    {label:"Operative CF",             aa:actuals.cfOp,                color:CYAN, bold:true},
    {label:"Interest paid",            aa:actuals.finExpenses.map(v=>-v),color:SLATE},
    {label:"Taxes paid",               aa:actuals.tax.map(v=>-v),      color:SLATE},
    {label:"OPERATIVE CASH FLOW",      aa:actuals.cfOp,                color:GREEN,bold:true},
    {label:"Investment Cash Flow",     aa:actuals.cfInv,               color:RED,  bold:true},
    {label:"Financing Cash Flow",      aa:actuals.cfFin,               color:"#94a3b8",bold:true},
    {label:"NET CASH CHANGE",          aa:netCF,                       color:BLUE, bold:true},
    {label:"End Cash Balance",         aa:cfAll.map(r=>r.endCash),     color:CYAN, bold:true},
  ];
  const totOp =sum(sl(actuals.cfOp, S,E));
  const totInv=sum(sl(actuals.cfInv,S,E));
  const totFin=sum(sl(actuals.cfFin,S,E));

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

      <div style={{borderBottom:"1px solid #0c1829",padding:"0 32px",display:"flex",alignItems:"center",justifyContent:"space-between",height:56}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:28,height:28,background:"linear-gradient(135deg,#1d4ed8,#0ea5e9)",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontSize:10,fontWeight:700,color:"#fff",fontFamily:"'DM Mono',monospace"}}>TF</span>
          </div>
          <div>
            <div style={{fontSize:14,fontWeight:600}}>Accrease Oy</div>
            <div style={{fontSize:10,color:"#334155",fontFamily:"'DM Mono',monospace"}}>Financial Dashboard · {year}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:6}}>
          {["2023","2024","2025","2026"].map(y=>(
            <button key={y} className={"yr-btn"+(year===y?" active":"")} onClick={()=>setYear(y)}>{y}</button>
          ))}
        </div>
      </div>

      <div style={{borderBottom:"1px solid #0c1829",padding:"0 32px",display:"flex",gap:0,overflowX:"auto"}}>
        {TABS.map(t=>(
          <button key={t.id} className="tab-btn" onClick={()=>setTab(t.id)} style={{padding:"12px 16px",fontSize:12,fontWeight:tab===t.id?600:400,color:tab===t.id?"#60a5fa":"#475569",borderBottom:tab===t.id?"2px solid #3b82f6":"2px solid transparent",marginBottom:-1,whiteSpace:"nowrap"}}>
            {t.label}
          </button>
        ))}
      </div>

      <PeriodBar startM={S} endM={E} setStart={setStartM} setEnd={setEndM} compLabel={compLabel} actLast={actLast}/>

      {isGroup&&!["group","data","deadlines"].includes(tab)&&(
        <div style={{borderTop:"1px solid #0c1829",background:"#060a14",padding:"8px 32px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
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

      <div style={{padding:"22px 32px",maxWidth:1600}}>

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
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,flexWrap:"wrap"}}>
              <div style={{background:"#0c1420",border:"1px solid #0f1e30",borderRadius:10,padding:4,display:"flex",gap:2}}>
                {["budget","forecast"].map(m=>(
                  <button key={m} className="mode-btn" onClick={()=>setMode(m)} style={{borderRadius:7,background:mode===m?"#1e3a5f":"transparent",color:mode===m?"#60a5fa":SLATE,fontWeight:mode===m?600:400}}>
                    {m==="budget"?"📋 Budget":"📈 Forecast"}
                  </button>
                ))}
              </div>
              <button onClick={()=>setTab("data")} style={{padding:"6px 14px",background:"none",border:"1px solid #1e2d45",borderRadius:8,color:SLATE,fontFamily:"'DM Mono',monospace",fontSize:10,cursor:"pointer"}}>↑ Manage data</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
              {[
                {title:"Revenue ACT vs "+compLabel, data:fcRevData, k1:"act",k2:"comp",c1:BLUE, c2:AMBER},
                {title:"Equity ACT vs "+compLabel,  data:fcEqData,  k1:"act",k2:"comp",c1:GREEN,c2:AMBER},
                {title:"Cash ACT vs "+compLabel,    data:fcCashData,k1:"act",k2:"comp",c1:CYAN, c2:AMBER},
              ].map(ch=>(
                <div key={ch.title} style={{background:"#0c1420",border:"1px solid #0f1e30",borderRadius:12,padding:22}}>
                  <div style={{fontSize:11,color:SLATE,fontFamily:"'DM Mono',monospace",marginBottom:12}}>{ch.title}</div>
                  <ResponsiveContainer width="100%" height={160}>
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
        )}

        {tab==="pl"&&(
          <div style={{background:"#0c1420",border:"1px solid #0f1e30",borderRadius:12,overflow:"hidden"}}>
            <div style={{padding:"14px 22px",borderBottom:"1px solid #0f1e30",display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
              <div style={{fontSize:13,fontWeight:600,color:"#94a3b8"}}>Income Statement · {MONTHS[S]}–{MONTHS[E]} {year}</div>
              <div style={{fontSize:9,fontFamily:"'DM Mono',monospace",display:"flex",gap:12,color:SLATE}}>
                <span style={{color:BLUE}}>ACT = Actual</span>
                <span style={{color:AMBER}}>{compLabel} = {mode==="budget"?"Budget":"Forecast"}</span>
                <span style={{color:RED}}>VAR = ACT − {compLabel}</span>
              </div>
            </div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,fontFamily:"'DM Mono',monospace"}}>
                <TblHead visMonths={visMonths} monthTypes={monthTypes} totalLabel={MONTHS[S]+"–"+MONTHS[E]}/>
                <tbody>
                  {plRows.map((r,ri)=>(
                    <TblRow key={ri} label={r.label} actArr={actuals[r.ak]||[]} compArr={r.ck?comp[r.ck]:null} color={r.color} bold={r.bold} indent={r.indent} s={S} e={E}/>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab==="balance"&&(
          <div style={{background:"#0c1420",border:"1px solid #0f1e30",borderRadius:12,overflow:"hidden"}}>
            <div style={{padding:"14px 22px",borderBottom:"1px solid #0f1e30"}}>
              <div style={{fontSize:13,fontWeight:600,color:"#94a3b8"}}>Balance Sheet · {MONTHS[S]}–{MONTHS[E]} {year}</div>
            </div>
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
        )}

        {tab==="cashflow"&&(
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
              {[
                {l:"Operative CF", v:totOp,  c:totOp>=0?GREEN:RED},
                {l:"Investment CF",v:totInv, c:totInv>=0?GREEN:RED},
                {l:"Financing CF", v:totFin, c:totFin>=0?GREEN:RED},
                {l:"Net CF",       v:totOp+totInv+totFin,c:(totOp+totInv+totFin)>=0?GREEN:RED},
              ].map(k=>(
                <div key={k.l} style={{background:"#0c1420",border:"1px solid #0f1e30",borderRadius:12,padding:"14px 18px"}}>
                  <div style={{fontSize:10,color:SLATE,fontFamily:"'DM Mono',monospace",marginBottom:6,textTransform:"uppercase"}}>{k.l}</div>
                  <div style={{fontSize:22,fontWeight:700,color:k.c,fontFamily:"'DM Mono',monospace"}}>{fmt(k.v)}</div>
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
                      return (
                        <tr key={ri} className="tbl-row" style={{borderBottom:"1px solid #080f1a"}}>
                          <td style={{padding:"7px 20px",color:row.color,fontWeight:row.bold?600:400,fontSize:row.bold?12:11,position:"sticky",left:0,background:"#0c1420",zIndex:1}}>{row.label}</td>
                          {sliced.map((v,i)=>[
                            <td key={"a"+i} style={{padding:"7px 8px",textAlign:"right",color:row.color,fontWeight:row.bold?600:400,fontSize:11,fontFamily:"'DM Mono',monospace",whiteSpace:"nowrap"}}>{fmt(v)}</td>,
                            <td key={"c"+i} style={{padding:"7px 8px",textAlign:"right",color:SLATE,fontSize:11}}>—</td>,
                          ])}
                          <td style={{padding:"7px 8px",textAlign:"right",color:row.color,fontWeight:700,borderLeft:"1px solid #0f1e30",fontFamily:"'DM Mono',monospace",whiteSpace:"nowrap"}}>{fmt(total)}</td>
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

        {tab==="data"&&(
          <div style={{display:"flex",flexDirection:"column",gap:20}}>

            {/* ── STATUS BAR ── */}
            <div style={{background:"#0c1420",border:"1px solid #0f1e30",borderRadius:12,padding:"14px 22px",display:"flex",alignItems:"center",gap:24,flexWrap:"wrap"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:actData?GREEN:SLATE}}/>
                <span style={{fontSize:11,color:actData?GREEN:SLATE,fontFamily:"'DM Mono',monospace"}}>{actData?"✓ "+actName+" · ACT thru "+MONTHS[actLast]:"Demo actuals"}</span>
                {actData&&<button onClick={()=>{setActData(null);setActName(null);setActLast(ACT_LAST_DEFAULT);}} style={{background:"none",border:"1px solid #1e2d45",borderRadius:6,padding:"3px 8px",color:SLATE,fontSize:10,cursor:"pointer"}}>✕ Clear</button>}
              </div>
              <div style={{width:1,height:20,background:"#0f1e30"}}/>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:csvData?AMBER:SLATE}}/>
                <span style={{fontSize:11,color:csvData?AMBER:SLATE,fontFamily:"'DM Mono',monospace"}}>{csvData?"✓ "+csvName:"Demo "+compLabel}</span>
                {csvData&&<button onClick={()=>{setCsvData(null);setCsvName(null);}} style={{background:"none",border:"1px solid #1e2d45",borderRadius:6,padding:"3px 8px",color:SLATE,fontSize:10,cursor:"pointer"}}>✕ Clear</button>}
              </div>
            </div>

            {/* ── API SYNC PANEL ── */}
            <ApiSyncPanel year={year} actLast={actLast} setActLast={setActLast}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
              <div style={{background:"#0c1420",border:"1px solid #0f1e30",borderRadius:12,overflow:"hidden"}}>
                <div style={{padding:"14px 22px",borderBottom:"1px solid #0f1e30",background:"#071728"}}>
                  <div style={{fontSize:13,fontWeight:600,color:"#60a5fa"}}>Actuals Import</div>
                  <div style={{fontSize:11,color:SLATE,marginTop:2}}>Confirmed monthly figures</div>
                </div>
                <div style={{padding:"14px 22px",borderBottom:"1px solid #0f1e30",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                  <div>
                    <div style={{fontSize:12,fontWeight:600,color:"#94a3b8",marginBottom:2}}>Step 1 — Download template</div>
                    <div style={{fontSize:10,color:SLATE}}>Pre-filled with current actuals · set actuals_last to last confirmed month</div>
                  </div>
                  <button onClick={exportActCSV} style={{flexShrink:0,padding:"8px 14px",background:"#071728",border:"1px solid #3b82f6",borderRadius:8,color:"#60a5fa",fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:600,cursor:"pointer"}}>↓ Actuals CSV</button>
                </div>
                <div style={{padding:"14px 22px"}}>
                  <div style={{fontSize:12,fontWeight:600,color:"#94a3b8",marginBottom:10}}>Step 2 — Upload</div>
                  <div className="upload-zone" style={{padding:"18px 20px",borderColor:dragOverA?"#3b82f6":"#1e3a5f",background:dragOverA?"#0c1e35":"transparent"}}
                    onDragOver={e=>{e.preventDefault();setDragOverA(true);}} onDragLeave={()=>setDragOverA(false)}
                    onDrop={e=>{e.preventDefault();setDragOverA(false);parseCSV(e.dataTransfer.files[0],true);}}
                    onClick={()=>fileRefA.current.click()}>
                    <input ref={fileRefA} type="file" accept=".csv" style={{display:"none"}} onChange={e=>parseCSV(e.target.files[0],true)}/>
                    {actName
                      ? <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                          <span style={{fontSize:12,color:GREEN,fontFamily:"'DM Mono',monospace"}}>✓ {actName}</span>
                          <button onClick={e=>{e.stopPropagation();setActData(null);setActName(null);setActLast(ACT_LAST_DEFAULT);}} style={{background:"none",border:"1px solid #1e2d45",borderRadius:6,padding:"3px 8px",color:SLATE,fontSize:10,cursor:"pointer"}}>✕</button>
                        </div>
                      : <div>
                          <div style={{fontSize:12,color:"#94a3b8",marginBottom:3}}>📂 Drop CSV here or click to browse</div>
                          <div style={{fontSize:9,color:"#1e2d45",fontFamily:"'DM Mono',monospace"}}>Use the template above</div>
                        </div>}
                  </div>
                </div>
              </div>
              <div style={{background:"#0c1420",border:"1px solid #0f1e30",borderRadius:12,overflow:"hidden"}}>
                <div style={{padding:"14px 22px",borderBottom:"1px solid #0f1e30",background:"#1a0e00",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:AMBER}}>Budget / Forecast Import</div>
                    <div style={{fontSize:11,color:SLATE,marginTop:2}}>Comparison figures</div>
                  </div>
                  <div style={{background:"#0c1420",border:"1px solid #1e2d45",borderRadius:8,padding:3,display:"flex",gap:2}}>
                    {["budget","forecast"].map(m=>(
                      <button key={m} className="mode-btn" onClick={()=>setMode(m)} style={{borderRadius:6,background:mode===m?"#2d1f00":"transparent",color:mode===m?AMBER:SLATE,fontWeight:mode===m?600:400,fontSize:10}}>
                        {m==="budget"?"Budget":"Forecast"}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{padding:"14px 22px",borderBottom:"1px solid #0f1e30",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                  <div>
                    <div style={{fontSize:12,fontWeight:600,color:"#94a3b8",marginBottom:2}}>Step 1 — Download template</div>
                    <div style={{fontSize:10,color:SLATE}}>Pre-filled with current {compLabel} data</div>
                  </div>
                  <button onClick={exportCSV} style={{flexShrink:0,padding:"8px 14px",background:"#1a0e00",border:"1px solid "+AMBER,borderRadius:8,color:AMBER,fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:600,cursor:"pointer"}}>↓ {compLabel} CSV</button>
                </div>
                <div style={{padding:"14px 22px"}}>
                  <div style={{fontSize:12,fontWeight:600,color:"#94a3b8",marginBottom:10}}>Step 2 — Upload</div>
                  <div className="upload-zone" style={{padding:"18px 20px",borderColor:dragOver?AMBER:"#1e3a5f",background:dragOver?"#1a0e00":"transparent"}}
                    onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)}
                    onDrop={e=>{e.preventDefault();setDragOver(false);parseCSV(e.dataTransfer.files[0],false);}}
                    onClick={()=>fileRef.current.click()}>
                    <input ref={fileRef} type="file" accept=".csv" style={{display:"none"}} onChange={e=>parseCSV(e.target.files[0],false)}/>
                    {csvName
                      ? <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                          <span style={{fontSize:12,color:AMBER,fontFamily:"'DM Mono',monospace"}}>✓ {csvName}</span>
                          <button onClick={e=>{e.stopPropagation();setCsvData(null);setCsvName(null);}} style={{background:"none",border:"1px solid #1e2d45",borderRadius:6,padding:"3px 8px",color:SLATE,fontSize:10,cursor:"pointer"}}>✕</button>
                        </div>
                      : <div>
                          <div style={{fontSize:12,color:"#94a3b8",marginBottom:3}}>📂 Drop CSV here or click to browse</div>
                          <div style={{fontSize:9,color:"#1e2d45",fontFamily:"'DM Mono',monospace"}}>Use the template above</div>
                        </div>}
                  </div>
                </div>
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

function LoginScreen({onLogin}) {
  const [pw, setPw] = React.useState("");
  const [err, setErr] = React.useState(false);
  const submit = () => {
    if (pw === PASSWORD) { sessionStorage.setItem(SESSION_KEY, "1"); onLogin(); }
    else { setErr(true); setTimeout(()=>setErr(false), 1200); }
  };
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#080b12",fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{width:340,padding:"40px 36px",background:"#0c1420",border:"1px solid #1e2d45",borderRadius:16,boxShadow:"0 20px 60px #000c"}}>
        <div style={{marginBottom:28,textAlign:"center"}}>
          <img src="https://y-lehti.fi/wp-content/uploads/2024/09/logo_tf-1024x293.png" alt="Targetflow" style={{width:180,marginBottom:12,filter:"brightness(0) invert(1)"}}/>
          <div style={{fontSize:13,color:ACCENT,fontFamily:"'DM Mono',monospace"}}>Accrease Oy</div>
        </div>
        <input type="password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}
          placeholder="Password"
          style={{width:"100%",background:"#070c17",border:"1px solid "+(err?"#f87171":"#1e2d45"),borderRadius:9,padding:"11px 14px",color:"#e2e8f0",fontSize:13,outline:"none",fontFamily:"'DM Sans',sans-serif",marginBottom:12,boxSizing:"border-box",transition:"border-color 0.2s"}}
        />
        <button onClick={submit} style={{width:"100%",padding:"11px",background:ACCENT,border:"none",borderRadius:9,color:"#080b12",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
          Sign in →
        </button>
        {err && <div style={{marginTop:10,textAlign:"center",fontSize:12,color:"#f87171",fontFamily:"'DM Mono',monospace"}}>Incorrect password</div>}
      </div>
    </div>
  );
}

function AppWithAuth() {
  const [authed, setAuthed] = React.useState(!!sessionStorage.getItem(SESSION_KEY));
  if (!authed) return <LoginScreen onLogin={()=>setAuthed(true)}/>;
  return <Dashboard/>;
}

export default AppWithAuth;
