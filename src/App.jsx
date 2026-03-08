import { useState, useEffect } from 'react'
import { supabase, CLIENT } from './supabase.js'
import {
  ComposedChart, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from 'recharts'

// ─── AUTH ─────────────────────────────────────────────────────────────────────
const PASSWORD    = 'accrease2026!'
const SESSION_KEY = 'accrease_auth'
const ACCENT      = '#86efac'   // soft green — distinct from other dashboards

// ─── MONTHS ───────────────────────────────────────────────────────────────────
const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']

// ─── SEED DATA ────────────────────────────────────────────────────────────────
const SEED_DATA = {
  2024: {
    revenue:      [-12762,-9339,-11003,-18747,-17438,-16354,-1590,-4138,-15142,-23187,-20690,-10494],
    employee_cost:[7192,7192,7167,8097,7327,7327,866,7326,7327,7327,7327,5711],
    sga:          [1927,1353,1373,6138,7423,8161,1358,1205,5505,7434,6460,3771],
    ebitda:       [-3643,-795,-2463,-4513,-2689,-866,633,4392,-2311,-8426,-6904,-1012],
    ebit:         [-3643,-795,-2463,-4513,-2689,-866,633,4392,-2311,-8426,-6904,-1012],
    net_financial:[0,0,-436,0,0,-479,0,0,476,0,0,-13],
    profit_loss:  [-2816,422,-1682,-3273,-1494,-128,1850,5609,-618,-7210,-5687,-8202],
    total_assets: [132883,131201,133386,123284,125044,125506,35099,36434,20874,28629,34548,36579],
    total_equity: [-96948,-96526,-98209,-101481,-102975,-103103,-16253,-10644,-11262,-18472,-24159,-32361],
    cash:         [120073,121862,122383,109751,100531,104318,33944,32576,10303,11493,1381,8403],
  },
  2025: {
    revenue:      [-10982,-15604,-26301,-20942,-12228,-15481,-3768,-18782,-20041,-22898,-15102,-15995],
    employee_cost:[7327,7327,7316,7327,7327,7327,7327,7312,7699,1562,7683,7683],
    sga:          [3725,3972,3678,3675,5398,4848,4017,5341,4820,4921,4813,5821],
    ebitda:       [69,-4306,-15306,-9940,496,-3306,7576,-6129,-7522,-16415,-2606,-2490],
    ebit:         [69,-4306,-15306,-9940,496,-3306,7576,-6129,-7522,-16415,-2606,-2490],
    net_financial:[0,0,-10,0,0,-14,0,0,-5,0,0,-6],
    profit_loss:  [1219,-3865,-14876,-9500,937,-2879,8016,-5688,-7086,-15974,-2443,3040],
    total_assets: [41243,45385,60462,72648,70576,74182,65382,72991,82657,92837,95699,94621],
    total_equity: [-31022,-34887,-49763,-59263,-58326,-61205,-53189,-58877,-65963,-81937,-84380,-81339],
    cash:         [7784,7151,11636,29151,18754,19130,9642,13325,13782,16078,15664,16927],
  },
  2026: {
    revenue:      [-11222,-15604,-26301,-20942,-12228,-15481,-3768,-18782,-20041,-22898,-15102,-15995],
    employee_cost:[7683,7683,7683,7683,7683,7683,7683,7683,7683,7683,7683,7683],
    sga:          [6983,3972,3678,3675,5398,4848,4017,5341,4820,4921,4813,5821],
    ebitda:       [3445,-3949,-14939,-9583,853,-2949,7933,-5757,-7537,-10294,-2606,-2490],
    ebit:         [3445,-3949,-14939,-9583,853,-2949,7933,-5757,-7537,-10294,-2606,-2490],
    net_financial:[0,0,-10,0,0,-14,0,0,-5,0,0,-6],
    profit_loss:  [5652,-3508,-14508,-9143,1294,-2522,8373,-5316,-7102,-9853,-2443,3040],
    total_assets: [91214,89694,104403,116232,113802,117052,107895,115133,124814,128872,131735,130657],
    total_equity: [-75687,-79195,-93704,-102847,-101553,-104075,-95702,-101018,-108120,-117972,-120415,-117375],
    cash:         [13303,63333,67450,84607,73853,73873,64028,67339,62028,58203,57789,54234],
  }
}

const DEADLINES = [
  {month:'JAN', deadline:'15 Feb 2026', note:''},
  {month:'FEB', deadline:'14 Mar 2026', note:''},
  {month:'MAR', deadline:'13 Apr 2026', note:''},
  {month:'APR', deadline:'16 May 2026', note:''},
  {month:'MAY', deadline:'13 Jun 2026', note:''},
  {month:'JUN', deadline:'12 Aug 2026', note:'June & July combined — holiday period'},
  {month:'JUL', deadline:'12 Aug 2026', note:'June & July combined — holiday period'},
  {month:'AUG', deadline:'12 Sep 2026', note:''},
  {month:'SEP', deadline:'13 Oct 2026', note:''},
  {month:'OCT', deadline:'11 Nov 2026', note:''},
  {month:'NOV', deadline:'12 Dec 2026', note:''},
  {month:'DEC', deadline:'13 Jan 2027', note:''},
]

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const sum  = arr => (arr||[]).reduce((a,b) => a + (b||0), 0)
const fmt  = (n, short=false) => {
  if (n === null || n === undefined || isNaN(n)) return '–'
  const abs = Math.abs(n)
  if (short && abs >= 1000000) return (n/1000000).toFixed(2) + 'M'
  if (short && abs >= 1000)    return (n/1000).toFixed(0) + 'k'
  return new Intl.NumberFormat('fi-FI', { style:'currency', currency:'EUR', maximumFractionDigits:0 }).format(n)
}
const pct      = n => (n === null || isNaN(n)) ? '–' : (n*100).toFixed(1) + '%'
const valColor = n => (n||0) >= 0 ? '#34d399' : '#f87171'

// ─── UI ATOMS ─────────────────────────────────────────────────────────────────
const KPI = ({ label, value, sub, color=ACCENT }) => (
  <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'14px 18px', position:'relative', overflow:'hidden' }}>
    <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:color }} />
    <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', color:'#475569', textTransform:'uppercase', marginBottom:6 }}>{label}</div>
    <div style={{ fontSize:20, fontWeight:700, color:'#f1f5f9', fontFamily:'monospace' }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:'#475569', marginTop:3 }}>{sub}</div>}
  </div>
)

const ST = ({ children, mt=28 }) => (
  <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'#334155', marginBottom:12, marginTop:mt, paddingBottom:6, borderBottom:'1px solid rgba(255,255,255,0.05)' }}>{children}</div>
)

const YBtn = ({ year, label, active, onClick }) => (
  <button onClick={onClick} style={{ padding:'4px 14px', borderRadius:16, border:'none', cursor:'pointer', background:active ? ACCENT : 'rgba(255,255,255,0.05)', color:active ? '#080b12' : '#64748b', fontWeight:700, fontSize:12, fontFamily:'inherit', transition:'all 0.12s' }}>{label||year}</button>
)

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#1e293b', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'10px 14px', fontSize:11 }}>
      <div style={{ color:'#64748b', marginBottom:5, fontWeight:700 }}>{label}</div>
      {payload.map(p => <div key={p.dataKey} style={{ color:p.color||p.fill, marginBottom:2 }}>{p.name}: <strong>{fmt(p.value, true)}</strong></div>)}
    </div>
  )
}

// ─── P&L VIEW ─────────────────────────────────────────────────────────────────
function PLView({ data }) {
  const [yr, setYr] = useState(2025)
  const d = data[yr] || SEED_DATA[yr] || {}

  const tRev    = sum(d.revenue)
  const revAbs  = Math.abs(tRev)   // revenue stored negative (interco)
  const tEmp    = sum(d.employee_cost)
  const tSga    = sum(d.sga)
  const tEbitda = sum(d.ebitda)
  const tEbit   = sum(d.ebit)
  const tNet    = sum(d.profit_loss)
  const ebitPct = revAbs !== 0 ? tEbit / revAbs : 0
  const netPct  = revAbs !== 0 ? tNet  / revAbs : 0

  const prevD   = data[yr-1] || SEED_DATA[yr-1] || {}
  const prevRev = Math.abs(sum(prevD.revenue||[]))
  const revGrowth = prevRev !== 0 ? ((revAbs - prevRev) / prevRev) * 100 : null

  const chartData = MONTHS.map((m,i) => ({
    month: m,
    Revenue:       Math.abs((d.revenue||[])[i]||0),
    EBITDA:        (d.ebitda||[])[i]||0,
    EBIT:          (d.ebit||[])[i]||0,
    'Net Profit':  (d.profit_loss||[])[i]||0,
  }))

  const costData = MONTHS.map((m,i) => ({
    month: m,
    'Employee Cost': Math.abs((d.employee_cost||[])[i]||0),
    'SG&A':          Math.abs((d.sga||[])[i]||0),
  }))

  const plLines = [
    { l:'Revenue (Intercompany)',  v:revAbs,                     c:ACCENT },
    { l:'Employee Cost',           v:tEmp,                       c:'#f87171' },
    { l:'SG&A',                    v:tSga,                       c:'#f87171' },
    { l:'EBITDA',                  v:tEbitda,                    c:valColor(tEbitda), b:true },
    { l:'EBIT',                    v:tEbit,                      c:valColor(tEbit),   b:true },
    { l:'Net Financial Items',     v:sum(d.net_financial||[]),   c:'#64748b' },
    { l:'Net Profit / Loss',       v:tNet,                       c:valColor(tNet),    b:true },
  ]

  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:20, alignItems:'center' }}>
        <YBtn year={2024} active={yr===2024} onClick={() => setYr(2024)}/>
        <YBtn year={2025} active={yr===2025} onClick={() => setYr(2025)}/>
        <YBtn year={2026} label="2026 BUD" active={yr===2026} onClick={() => setYr(2026)}/>
        {revGrowth !== null && (
          <span style={{ fontSize:11, color:revGrowth>=0?'#34d399':'#f87171', marginLeft:4 }}>
            {revGrowth>=0?'▲':'▼'} {Math.abs(revGrowth).toFixed(1)}% vs {yr-1}
          </span>
        )}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:22 }}>
        <KPI label="Revenue"    value={fmt(revAbs,true)}   color={ACCENT}/>
        <KPI label="Emp. Cost"  value={fmt(tEmp,true)}     color="#f59e0b"/>
        <KPI label="EBITDA"     value={fmt(tEbitda,true)}  color={valColor(tEbitda)}/>
        <KPI label="EBIT"       value={fmt(tEbit,true)}    color={valColor(tEbit)}/>
        <KPI label="Net Profit" value={fmt(tNet,true)}     color={valColor(tNet)} sub={pct(netPct)+' margin'}/>
      </div>

      <ST>Monthly Revenue & Profitability — {yr}{yr===2026?' (BUD)':' (ACT)'}</ST>
      <div style={{ height:230, marginBottom:22 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{top:0,right:0,left:0,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
            <XAxis dataKey="month" tick={{fill:'#475569',fontSize:11}} axisLine={false} tickLine={false}/>
            <YAxis tickFormatter={v=>fmt(v,true)} tick={{fill:'#475569',fontSize:11}} axisLine={false} tickLine={false}/>
            <Tooltip content={<TT/>}/>
            <Legend wrapperStyle={{fontSize:11,color:'#475569'}}/>
            <Bar dataKey="Revenue" fill={ACCENT} opacity={0.7} radius={[2,2,0,0]}/>
            <Line type="monotone" dataKey="EBITDA"     stroke="#f59e0b" strokeWidth={2} dot={false}/>
            <Line type="monotone" dataKey="EBIT"       stroke="#34d399" strokeWidth={2} dot={false}/>
            <Line type="monotone" dataKey="Net Profit" stroke="#f87171" strokeWidth={2} dot={false} strokeDasharray="4 3"/>
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)"/>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <ST>Cost Breakdown — {yr}</ST>
      <div style={{ height:200, marginBottom:22 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={costData} margin={{top:0,right:0,left:0,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
            <XAxis dataKey="month" tick={{fill:'#475569',fontSize:11}} axisLine={false} tickLine={false}/>
            <YAxis tickFormatter={v=>fmt(v,true)} tick={{fill:'#475569',fontSize:11}} axisLine={false} tickLine={false}/>
            <Tooltip content={<TT/>}/>
            <Legend wrapperStyle={{fontSize:11,color:'#475569'}}/>
            <Bar dataKey="Employee Cost" fill="#f59e0b" opacity={0.85} stackId="c"/>
            <Bar dataKey="SG&A"          fill="#818cf8" opacity={0.85} stackId="c" radius={[2,2,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ST>Year-on-Year Revenue Comparison</ST>
      <div style={{ height:180, marginBottom:22 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={MONTHS.map((m,i) => ({
            month:m,
            '2024 ACT': Math.abs((SEED_DATA[2024].revenue||[])[i]||0),
            '2025 ACT': Math.abs((SEED_DATA[2025].revenue||[])[i]||0),
            '2026 BUD': Math.abs((SEED_DATA[2026].revenue||[])[i]||0),
          }))} margin={{top:0,right:0,left:0,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
            <XAxis dataKey="month" tick={{fill:'#475569',fontSize:11}} axisLine={false} tickLine={false}/>
            <YAxis tickFormatter={v=>fmt(v,true)} tick={{fill:'#475569',fontSize:11}} axisLine={false} tickLine={false}/>
            <Tooltip content={<TT/>}/>
            <Legend wrapperStyle={{fontSize:11,color:'#475569'}}/>
            <Line type="monotone" dataKey="2024 ACT" stroke="#475569" strokeWidth={2} dot={false} strokeDasharray="4 3"/>
            <Line type="monotone" dataKey="2025 ACT" stroke="#64748b" strokeWidth={2} dot={false}/>
            <Line type="monotone" dataKey="2026 BUD" stroke={ACCENT}  strokeWidth={2} dot={false}/>
          </LineChart>
        </ResponsiveContainer>
      </div>

      <ST>P&L Summary — {yr}{yr===2026?' BUD':' ACT'}</ST>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:22 }}>
        {plLines.map(({ l, v, c, b }) => (
          <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'7px 12px', background:b?'rgba(255,255,255,0.04)':'transparent', borderRadius:6, border:b?'1px solid rgba(255,255,255,0.07)':'none' }}>
            <span style={{ fontSize:12, color:b?'#e2e8f0':'#64748b', fontWeight:b?700:400 }}>{l}</span>
            <span style={{ fontSize:12, color:c, fontWeight:b?700:400, fontFamily:'monospace' }}>{fmt(v,true)}</span>
          </div>
        ))}
      </div>

      <ST>Monthly P&L Table — {yr}</ST>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', fontSize:11, fontFamily:'monospace' }}>
          <thead>
            <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
              <th style={{ textAlign:'left', padding:'7px 10px', color:'#475569', minWidth:160 }}>Line</th>
              {MONTHS.map(m => <th key={m} style={{ textAlign:'right', padding:'7px 5px', color:'#475569', minWidth:60 }}>{m}</th>)}
              <th style={{ textAlign:'right', padding:'7px 10px', color:'#475569' }}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {[
              { l:'Revenue',       a:(d.revenue||[]).map(v=>Math.abs(v||0)), c:'#e2e8f0' },
              { l:'Employee Cost', a:d.employee_cost, c:'#94a3b8' },
              { l:'SG&A',          a:d.sga,           c:'#94a3b8' },
              { l:'EBITDA',        a:d.ebitda,        c:null, b:true },
              { l:'EBIT',          a:d.ebit,          c:null, b:true },
              { l:'Net Profit',    a:d.profit_loss,   c:null, b:true },
            ].map(({ l, a, c, b }) => {
              const tot = sum(a||[])
              const isDyn = c === null
              const clr = isDyn ? valColor(tot) : c
              return (
                <tr key={l} style={{ borderBottom:'1px solid rgba(255,255,255,0.03)', background:b?'rgba(255,255,255,0.02)':'transparent' }}>
                  <td style={{ padding:'5px 10px', color:clr, fontWeight:b?700:400 }}>{l}</td>
                  {(a||[]).map((v,i) => {
                    const vc = isDyn ? valColor(v) : c
                    return <td key={i} style={{ textAlign:'right', padding:'5px 5px', color:vc, fontWeight:b?700:400 }}>{v!==0 ? fmt(v,true) : '–'}</td>
                  })}
                  <td style={{ textAlign:'right', padding:'5px 10px', color:isDyn?valColor(tot):c, fontWeight:700 }}>{fmt(tot,true)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── BALANCE SHEET VIEW ───────────────────────────────────────────────────────
function BSView({ data }) {
  const [yr, setYr] = useState(2025)
  const d = data[yr] || SEED_DATA[yr] || {}
  const li = 11

  const lastA = (d.total_assets||[])[li]||0
  const lastE = (d.total_equity||[])[li]||0
  const lastC = (d.cash||[])[li]||0
  const eqRatio = lastA !== 0 ? lastE / lastA : 0

  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:20, alignItems:'center' }}>
        <YBtn year={2024} active={yr===2024} onClick={() => setYr(2024)}/>
        <YBtn year={2025} active={yr===2025} onClick={() => setYr(2025)}/>
        <YBtn year={2026} label="2026 BUD" active={yr===2026} onClick={() => setYr(2026)}/>
        <span style={{ fontSize:11, color:'#334155', marginLeft:4 }}>DEC snapshot</span>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:22 }}>
        <KPI label="Total Assets"  value={fmt(lastA,true)}  color={ACCENT}/>
        <KPI label="Total Equity"  value={fmt(lastE,true)}  color={valColor(lastE)}/>
        <KPI label="Equity Ratio"  value={pct(eqRatio)}     color={valColor(eqRatio)}/>
        <KPI label="Cash"          value={fmt(lastC,true)}  color="#f59e0b"/>
      </div>

      <ST>Assets — {yr} DEC</ST>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:22 }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'#475569', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.1em' }}>Assets</div>
          {[
            { l:'Cash & Equivalents', v:lastC },
            { l:'TOTAL ASSETS',       v:lastA, b:true },
          ].map(({ l, v, b }) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'5px 10px', background:b?'rgba(255,255,255,0.04)':'transparent', borderRadius:4, marginBottom:2 }}>
              <span style={{ fontSize:11, color:'#94a3b8', fontWeight:b?700:400 }}>{l}</span>
              <span style={{ fontSize:11, color:b?'#f1f5f9':'#64748b', fontFamily:'monospace', fontWeight:b?700:400 }}>{fmt(v,true)}</span>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'#475569', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.1em' }}>Equity & Liabilities</div>
          {[
            { l:'Total Equity', v:lastE, b:true, color:valColor(lastE) },
          ].map(({ l, v, b, color }) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'5px 10px', background:b?'rgba(255,255,255,0.04)':'transparent', borderRadius:4, marginBottom:2 }}>
              <span style={{ fontSize:11, color:'#94a3b8', fontWeight:b?700:400 }}>{l}</span>
              <span style={{ fontSize:11, color:color||(b?'#f1f5f9':'#64748b'), fontFamily:'monospace', fontWeight:b?700:400 }}>{fmt(v,true)}</span>
            </div>
          ))}
        </div>
      </div>

      <ST>Assets & Cash — Monthly {yr}</ST>
      <div style={{ height:220, marginBottom:22 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={MONTHS.map((m,i) => ({
            month:m,
            'Total Assets': (d.total_assets||[])[i]||0,
            Cash:           (d.cash||[])[i]||0,
          }))} margin={{top:0,right:0,left:0,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
            <XAxis dataKey="month" tick={{fill:'#475569',fontSize:11}} axisLine={false} tickLine={false}/>
            <YAxis tickFormatter={v=>fmt(v,true)} tick={{fill:'#475569',fontSize:11}} axisLine={false} tickLine={false}/>
            <Tooltip content={<TT/>}/>
            <Legend wrapperStyle={{fontSize:11,color:'#475569'}}/>
            <Line type="monotone" dataKey="Total Assets" stroke={ACCENT}   strokeWidth={2} dot={false}/>
            <Line type="monotone" dataKey="Cash"         stroke="#f59e0b"  strokeWidth={2} dot={false}/>
          </LineChart>
        </ResponsiveContainer>
      </div>

      <ST>2024 vs 2025 Key Metrics</ST>
      <div style={{ height:220, marginBottom:22 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={[
            { name:'Revenue',   '2024':Math.abs(sum(SEED_DATA[2024].revenue||[])),   '2025':Math.abs(sum(SEED_DATA[2025].revenue||[])) },
            { name:'Emp. Cost', '2024':sum(SEED_DATA[2024].employee_cost||[]),        '2025':sum(SEED_DATA[2025].employee_cost||[]) },
            { name:'EBIT',      '2024':sum(SEED_DATA[2024].ebit||[]),                 '2025':sum(SEED_DATA[2025].ebit||[]) },
            { name:'Net P/L',   '2024':sum(SEED_DATA[2024].profit_loss||[]),          '2025':sum(SEED_DATA[2025].profit_loss||[]) },
          ]} margin={{top:0,right:0,left:0,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
            <XAxis dataKey="name" tick={{fill:'#475569',fontSize:11}} axisLine={false} tickLine={false}/>
            <YAxis tickFormatter={v=>fmt(v,true)} tick={{fill:'#475569',fontSize:11}} axisLine={false} tickLine={false}/>
            <Tooltip content={<TT/>}/>
            <Legend wrapperStyle={{fontSize:11,color:'#475569'}}/>
            <Bar dataKey="2024" fill="#475569" opacity={0.8} radius={[2,2,0,0]}/>
            <Bar dataKey="2025" fill={ACCENT}  opacity={0.8} radius={[2,2,0,0]}/>
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)"/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─── DEADLINES VIEW ───────────────────────────────────────────────────────────
function DeadlinesView() {
  const today = new Date()
  return (
    <div>
      <ST mt={0}>Reporting Deadlines 2026</ST>
      <div style={{ overflowX:'auto', marginBottom:24 }}>
        <table style={{ width:'100%', fontSize:12 }}>
          <thead>
            <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
              {['Month','Deadline (EOD)','Status','Note'].map(h =>
                <th key={h} style={{ textAlign:'left', padding:'8px 12px', color:'#475569', fontWeight:700 }}>{h}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {DEADLINES.map((d, i) => {
              const dl = new Date(d.deadline)
              const ip = dl < today
              const is = !ip && (dl - today) < 14*24*3600*1000
              const sc = ip ? '#334155' : is ? '#f59e0b' : '#34d399'
              return (
                <tr key={i} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', opacity:ip?0.5:1 }}>
                  <td style={{ padding:'9px 12px', fontWeight:700, color:'#f1f5f9' }}>{d.month}</td>
                  <td style={{ padding:'9px 12px' }}>
                    <span style={{ color:sc, fontWeight:600 }}>{d.deadline}</span>
                  </td>
                  <td style={{ padding:'9px 12px' }}>
                    <span style={{ fontSize:10, color:sc, background:`${sc}20`, padding:'2px 8px', borderRadius:8 }}>{ip?'DONE':is?'SOON':'OPEN'}</span>
                  </td>
                  <td style={{ padding:'9px 12px', color:'#475569', fontSize:11 }}>{d.note}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <ST>Closing Process Reminders</ST>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:10 }}>
        {[
          { e:'📦', t:'AP Closed',           d:'5 days before deadline' },
          { e:'🧾', t:'Receipts & Clearing', d:'Same day as AP close' },
          { e:'📊', t:'Accruals Submitted',  d:'Same day as AP close' },
          { e:'💳', t:'Sales Invoicing',     d:'10 days before deadline' },
          { e:'📋', t:'No Jul Board Mtg',    d:'Jun & Jul combined in Aug' },
        ].map(({ e, t, d }) => (
          <div key={t} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'14px 16px', display:'flex', gap:12, alignItems:'flex-start' }}>
            <span style={{ fontSize:20 }}>{e}</span>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:'#94a3b8', marginBottom:3 }}>{t}</div>
              <div style={{ fontSize:11, color:'#475569' }}>{d}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function Login({ onSuccess }) {
  const [pw, setPw]   = useState('')
  const [err, setErr] = useState(false)
  const attempt = () => {
    if (pw === PASSWORD) { sessionStorage.setItem(SESSION_KEY, '1'); onSuccess() }
    else { setErr(true); setTimeout(() => setErr(false), 1500) }
  }
  return (
    <div style={{ minHeight:'100vh', background:'#080b12', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'DM Mono','Courier New',monospace" }}>
      <div style={{ width:340, textAlign:'center' }}>
        <div style={{ fontSize:11, letterSpacing:'0.3em', color:'#334155', marginBottom:12, textTransform:'uppercase' }}>Board Dashboard</div>
        <div style={{ fontSize:32, fontWeight:800, letterSpacing:'-0.03em', color:'#f1f5f9', marginBottom:4 }}>Accrease Oy</div>
        <div style={{ width:40, height:2, background:ACCENT, margin:'0 auto 32px' }}/>
        <input
          type="password" placeholder="Enter password" value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && attempt()}
          style={{ width:'100%', padding:'13px 16px', background:'rgba(255,255,255,0.04)', border:`1px solid ${err?'#f87171':'rgba(255,255,255,0.1)'}`, borderRadius:8, color:'#f1f5f9', fontSize:14, outline:'none', fontFamily:'inherit', marginBottom:10 }}
          autoFocus
        />
        <button onClick={attempt} style={{ width:'100%', padding:'13px', background:ACCENT, border:'none', borderRadius:8, color:'#080b12', fontWeight:800, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>ENTER</button>
        {err && <div style={{ marginTop:10, color:'#f87171', fontSize:13 }}>Incorrect password</div>}
      </div>
    </div>
  )
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
const TABS = [
  { id:'pl',        label:'P & L' },
  { id:'bs',        label:'Balance Sheet' },
  { id:'deadlines', label:'Deadlines' },
]

export default function App() {
  const [authed,   setAuthed]   = useState(!!sessionStorage.getItem(SESSION_KEY))
  const [tab,      setTab]      = useState('pl')
  const [dbStatus, setDbStatus] = useState('idle')
  const [liveData, setLiveData] = useState(null)

  useEffect(() => { if (authed) loadFromSupabase() }, [authed])

  const loadFromSupabase = async () => {
    if (!supabase) { setDbStatus('offline'); return }
    setDbStatus('loading')
    try {
      const { data, error } = await supabase.from('dashboard_pnl').select('*').eq('client', CLIENT)
      if (error) throw error
      if (!data || data.length === 0) { setDbStatus('ok'); await seedDatabase(); return }
      const structured = {}
      data.forEach(row => {
        if (!structured[row.year]) structured[row.year] = {}
        if (!structured[row.year][row.line_item]) structured[row.year][row.line_item] = Array(12).fill(0)
        structured[row.year][row.line_item][row.month_index] = row.value
      })
      setLiveData(structured)
      setDbStatus('ok')
    } catch (e) { console.error(e); setDbStatus('error') }
  }

  const seedDatabase = async () => {
    if (!supabase) return
    const rows = []
    Object.entries(SEED_DATA).forEach(([year, yd]) => {
      Object.entries(yd).forEach(([line_item, arr]) => {
        ;(arr||[]).forEach((value, month_index) => {
          if (value !== 0 && value !== null && value !== undefined)
            rows.push({ client: CLIENT, entity: '', year: parseInt(year), line_item, month_index, value })
        })
      })
    })
    if (rows.length > 0) {
      const { error } = await supabase.from('dashboard_pnl').upsert(rows, { onConflict:'client,entity,year,line_item,month_index' })
      if (!error) await loadFromSupabase()
    }
  }

  const data = liveData || SEED_DATA
  if (!authed) return <Login onSuccess={() => setAuthed(true)}/>

  return (
    <div style={{ minHeight:'100vh', background:'#080b12', color:'#e2e8f0', fontFamily:"'DM Mono','Courier New',monospace" }}>
      <header style={{ borderBottom:'1px solid rgba(255,255,255,0.05)', padding:'0 28px', display:'flex', alignItems:'center', justifyContent:'space-between', height:52, position:'sticky', top:0, zIndex:100, background:'rgba(8,11,18,0.97)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ fontSize:16, fontWeight:800, letterSpacing:'-0.02em', color:'#f1f5f9' }}>Accrease Oy</div>
          <div style={{ width:1, height:16, background:'rgba(255,255,255,0.08)' }}/>
          <div style={{ fontSize:11, color:'#334155', letterSpacing:'0.05em' }}>Board Dashboard</div>
        </div>
        <nav style={{ display:'flex', gap:2 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding:'5px 14px', borderRadius:6, border:'none', cursor:'pointer', background:tab===t.id?`${ACCENT}20`:'transparent', color:tab===t.id?ACCENT:'#475569', fontWeight:tab===t.id?700:400, fontSize:12, fontFamily:'inherit', transition:'all 0.12s' }}>{t.label}</button>
          ))}
        </nav>
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'#334155' }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:dbStatus==='ok'?'#34d399':dbStatus==='loading'?'#f59e0b':dbStatus==='offline'?'#475569':'#f87171', display:'inline-block' }}/>
          {dbStatus==='ok'?'Supabase':dbStatus==='loading'?'Syncing…':dbStatus==='offline'?'Offline':'Error'}
        </div>
      </header>

      <main style={{ padding:'24px 28px', maxWidth:1400, margin:'0 auto' }}>
        <h1 style={{ fontSize:18, fontWeight:800, color:'#f1f5f9', marginBottom:22, letterSpacing:'-0.02em' }}>
          {TABS.find(t => t.id === tab)?.label}
          <span style={{ fontSize:12, color:'#334155', fontWeight:400, marginLeft:10 }}>2024–2026 · ACT + BUD</span>
        </h1>
        {tab === 'pl'        && <PLView data={data}/>}
        {tab === 'bs'        && <BSView data={data}/>}
        {tab === 'deadlines' && <DeadlinesView/>}
      </main>

      <div style={{ textAlign:'center', padding:'18px', borderTop:'1px solid rgba(255,255,255,0.04)', fontSize:11, color:'#1e293b' }}>
        Accrease Oy · Board Dashboard · Confidential · {new Date().getFullYear()}
      </div>
    </div>
  )
}
