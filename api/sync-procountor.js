// api/sync-procountor.js — Vercel Serverless Function
// Env vars needed per dashboard:
//   PROCOUNTOR_CLIENT_ID     = your OAuth2 client_id
//   PROCOUNTOR_CLIENT_SECRET = your OAuth2 client_secret
//   PROCOUNTOR_REDIRECT_URI  = https://your-dashboard.vercel.app/api/procountor-callback
//   SUPABASE_URL             = https://jzqgndcrukggcwthxyrv.supabase.co
//   SUPABASE_SERVICE_KEY     = service role key

import { createClient } from "@supabase/supabase-js";

const PROCOUNTOR_BASE = "https://api.procountor.com/api";
const SANDBOX_BASE    = "https://api-test.procountor.com/api";

const supabase = createClient(
  process.env.SUPABASE_URL || "https://jzqgndcrukggcwthxyrv.supabase.co",
  process.env.SUPABASE_SERVICE_KEY
);

// ── OAuth2 token fetch ───────────────────────────────────────────────────────
function deobfuscate(str, clientName) {
  try {
    const key = clientName + "targetflow2025";
    const bin = atob(str);
    return bin.split("").map((c,i)=>
      String.fromCharCode(c.charCodeAt(0)^key.charCodeAt(i%key.length))
    ).join("");
  } catch(e) { return str; }
}

async function getCredentials(client) {
  // Try env vars first, then Supabase
  if(process.env.PROCOUNTOR_CLIENT_ID) {
    return { client_id: process.env.PROCOUNTOR_CLIENT_ID, client_secret: process.env.PROCOUNTOR_CLIENT_SECRET };
  }
  const { data } = await supabase.from("accounting_connections")
    .select("credentials").eq("client", client).eq("system","procountor").maybeSingle();
  if(!data?.credentials) throw new Error("No Procountor credentials configured. Connect via Settings → Accounting System.");
  return {
    client_id:     deobfuscate(data.credentials.client_id, client),
    client_secret: deobfuscate(data.credentials.client_secret, client),
  };
}

async function getAccessToken(client) {
  const creds = await getCredentials(client);
  const res = await fetch(`${SANDBOX_BASE}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type:    "client_credentials",
      client_id:     creds.client_id,
      client_secret: creds.client_secret,
    }),
  });
  if (!res.ok) throw new Error(`Auth failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.access_token;
}

// ── Fetch P&L report ─────────────────────────────────────────────────────────
async function fetchPL(token, startDate, endDate) {
  const url = `${SANDBOX_BASE}/reports/incomestatement?startDate=${startDate}&endDate=${endDate}&periodType=MONTHLY`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`P&L fetch failed: ${res.status}`);
  return res.json();
}

// ── Fetch Balance Sheet ───────────────────────────────────────────────────────
async function fetchBalance(token, endDate) {
  const url = `${SANDBOX_BASE}/reports/balancesheet?endDate=${endDate}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Balance fetch failed: ${res.status}`);
  return res.json();
}

// ── Map Procountor P&L → dashboard format ────────────────────────────────────
function mapPLToDashboard(procountorData) {
  // Procountor returns rows with account codes and amounts per period
  // Map to dashboard's expected format: { account, name, months: [jan, feb, ...] }
  const rows = [];
  if (!procountorData?.rows) return rows;

  for (const row of procountorData.rows) {
    rows.push({
      account: row.accountCode || "",
      name:    row.name || "",
      months:  row.periods?.map(p => p.amount || 0) || [],
      total:   row.total || 0,
    });
  }
  return rows;
}

// ── Map Procountor Balance → dashboard format ─────────────────────────────────
function mapBalanceToDashboard(procountorData) {
  const rows = [];
  if (!procountorData?.rows) return rows;

  for (const row of procountorData.rows) {
    rows.push({
      account: row.accountCode || "",
      name:    row.name || "",
      value:   row.amount || 0,
      side:    row.side || "ASSETS", // ASSETS | LIABILITIES
    });
  }
  return rows;
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { client, fromMonth, toMonth, year, scope } = req.body;
  // fromMonth/toMonth: 0-11 (Jan-Dec)
  // scope: ["pl", "balance"]

  if (!client) return res.status(400).json({ error: "Missing client" });

  const logs = [];
  const log  = (msg) => { logs.push(msg); console.log(msg); };

  try {
    log("🔐 Authenticating with Procountor…");
    const token = await getAccessToken(client);
    log("✓ Authenticated");

    const startDate = `${year}-${String(fromMonth + 1).padStart(2,"0")}-01`;
    const endDate   = new Date(year, toMonth + 1, 0)
      .toISOString().split("T")[0]; // last day of toMonth

    let plData      = null;
    let balanceData = null;

    if (scope.includes("pl")) {
      log(`📡 Fetching P&L ${startDate} → ${endDate}…`);
      const raw = await fetchPL(token, startDate, endDate);
      plData    = mapPLToDashboard(raw);
      log(`✅ P&L: ${plData.length} rows mapped`);
    }

    if (scope.includes("balance")) {
      log(`📡 Fetching Balance Sheet as of ${endDate}…`);
      const raw   = await fetchBalance(token, endDate);
      balanceData = mapBalanceToDashboard(raw);
      log(`✅ Balance: ${balanceData.length} rows mapped`);
    }

    // Save to Supabase — upsert into client_snapshots
    log("💾 Saving to Supabase…");
    const upsertData = {
      client,
      last_month:  toMonth,
      updated_at:  new Date().toISOString(),
      act_name:    `Procountor sync ${startDate}–${endDate}`,
    };
    if (plData)      upsertData.act_data  = JSON.stringify(plData);
    if (balanceData) upsertData.csv_data  = JSON.stringify(balanceData);

    const { error } = await supabase
      .from("client_snapshots")
      .upsert(upsertData, { onConflict: "client" });

    if (error) throw new Error(`Supabase error: ${error.message}`);
    log(`✓ Saved to Supabase`);

    return res.json({ ok: true, logs, rowsPL: plData?.length, rowsBalance: balanceData?.length });

  } catch (err) {
    log(`❌ Error: ${err.message}`);
    return res.status(500).json({ ok: false, error: err.message, logs });
  }
}
