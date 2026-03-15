// api/sync-netvisor.js — Vercel Serverless Function
// Env vars needed per dashboard:
//   NETVISOR_CUSTOMER_ID     = your Netvisor Customer ID
//   NETVISOR_PARTNER_ID      = Partner ID (from Netvisor API agreement)
//   NETVISOR_PARTNER_SECRET  = Partner secret
//   NETVISOR_PRIVATE_KEY     = Your company's private key
//   NETVISOR_LANGUAGE        = FI (default)
//   SUPABASE_URL             = https://jzqgndcrukggcwthxyrv.supabase.co
//   SUPABASE_SERVICE_KEY     = service role key

import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const NETVISOR_BASE = "https://integration.netvisor.fi";

const supabase = createClient(
  process.env.SUPABASE_URL || "https://jzqgndcrukggcwthxyrv.supabase.co",
  process.env.SUPABASE_SERVICE_KEY
);

// ── Netvisor HMAC authentication header ──────────────────────────────────────
function buildAuthHeader(url) {
  const timestamp  = new Date().toISOString().replace("T"," ").substring(0,19);
  const transId    = crypto.randomBytes(8).toString("hex");
  const lang       = process.env.NETVISOR_LANGUAGE || "FI";
  const customerId = process.env.NETVISOR_CUSTOMER_ID;
  const partnerId  = process.env.NETVISOR_PARTNER_ID;

  // String to sign: URL + "&" + customerId + "&" + partnerId + "&" + lang + "&" + timestamp + "&" + transId
  const toSign   = `${url}&${customerId}&${partnerId}&${lang}&${timestamp}&${transId}`;
  const mac1     = crypto.createHmac("sha256", process.env.NETVISOR_PRIVATE_KEY).update(toSign).digest("hex");
  const mac2     = crypto.createHmac("sha256", process.env.NETVISOR_PARTNER_SECRET).update(mac1).digest("hex");

  return [
    `Integration=${partnerId}`,
    `CustomerId=${customerId}`,
    `Timestamp=${timestamp}`,
    `Language=${lang}`,
    `TransactionId=${transId}`,
    `MAC=${mac2}`,
    `MacHashCalculationAlgorithm=SHA256`,
  ].join("&");
}

// ── Fetch from Netvisor ───────────────────────────────────────────────────────
async function fetchNetvisor(path) {
  const url     = `${NETVISOR_BASE}${path}`;
  const authStr = buildAuthHeader(url);
  const res     = await fetch(url, {
    headers: { "X-Netvisor-Authentication": authStr },
  });
  if (!res.ok) throw new Error(`Netvisor fetch failed: ${res.status} ${await res.text()}`);
  return res.text(); // returns XML
}

// ── Parse Netvisor XML P&L ────────────────────────────────────────────────────
function parseNetvisorPL(xml) {
  // Very simplified XML parsing — in production use a proper XML parser
  // Netvisor returns AccountingReportByMonth with Ledgers
  const rows = [];
  const matches = xml.matchAll(/<AccountingLedger[^>]*>([\s\S]*?)<\/AccountingLedger>/g);
  for (const m of matches) {
    const account = m[1].match(/<AccountNumber>(.*?)<\/AccountNumber>/)?.[1] || "";
    const name    = m[1].match(/<AccountName>(.*?)<\/AccountName>/)?.[1] || "";
    const amounts = [...m[1].matchAll(/<MonthlyAmount[^>]*>(.*?)<\/MonthlyAmount>/g)]
      .map(a => parseFloat(a[1].replace(",",".")) || 0);
    rows.push({ account, name, months: amounts, total: amounts.reduce((a,b)=>a+b,0) });
  }
  return rows;
}

// ── Parse Netvisor XML Balance ────────────────────────────────────────────────
function parseNetvisorBalance(xml) {
  const rows = [];
  const matches = xml.matchAll(/<BalanceSheetRow[^>]*>([\s\S]*?)<\/BalanceSheetRow>/g);
  for (const m of matches) {
    const account = m[1].match(/<AccountNumber>(.*?)<\/AccountNumber>/)?.[1] || "";
    const name    = m[1].match(/<AccountName>(.*?)<\/AccountName>/)?.[1] || "";
    const value   = parseFloat(m[1].match(/<Amount>(.*?)<\/Amount>/)?.[1]?.replace(",",".") || "0");
    const side    = parseFloat(value) >= 0 ? "ASSETS" : "LIABILITIES";
    rows.push({ account, name, value, side });
  }
  return rows;
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { client, fromMonth, toMonth, year, scope } = req.body;
  if (!client) return res.status(400).json({ error: "Missing client" });

  const logs = [];
  const log  = (msg) => { logs.push(msg); console.log(msg); };

  try {
    log("🔐 Building Netvisor authentication…");

    const startDate = `${year}${String(fromMonth + 1).padStart(2,"0")}01`;
    const endDate   = `${year}${String(toMonth + 1).padStart(2,"0")}${new Date(year, toMonth + 1, 0).getDate()}`;

    let plData      = null;
    let balanceData = null;

    if (scope.includes("pl")) {
      log(`📡 Fetching P&L ${startDate} → ${endDate}…`);
      const xml = await fetchNetvisor(
        `/accountingledger.nv?startdate=${startDate}&enddate=${endDate}&reportformat=bymonth`
      );
      plData = parseNetvisorPL(xml);
      log(`✅ P&L: ${plData.length} rows mapped`);
    }

    if (scope.includes("balance")) {
      log(`📡 Fetching Balance Sheet as of ${endDate}…`);
      const xml   = await fetchNetvisor(
        `/balancesheet.nv?enddate=${endDate}`
      );
      balanceData = parseNetvisorBalance(xml);
      log(`✅ Balance: ${balanceData.length} rows mapped`);
    }

    log("💾 Saving to Supabase…");
    const upsertData = {
      client,
      last_month:  toMonth,
      updated_at:  new Date().toISOString(),
      act_name:    `Netvisor sync ${startDate}–${endDate}`,
    };
    if (plData)      upsertData.act_data = JSON.stringify(plData);
    if (balanceData) upsertData.csv_data = JSON.stringify(balanceData);

    const { error } = await supabase
      .from("client_snapshots")
      .upsert(upsertData, { onConflict: "client" });

    if (error) throw new Error(`Supabase error: ${error.message}`);
    log("✓ Saved to Supabase");

    return res.json({ ok: true, logs, rowsPL: plData?.length, rowsBalance: balanceData?.length });

  } catch (err) {
    log(`❌ Error: ${err.message}`);
    return res.status(500).json({ ok: false, error: err.message, logs });
  }
}
