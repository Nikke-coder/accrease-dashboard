import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  "https://jzqgndcrukggcwthxyrv.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6cWduZGNydWtnZ2N3dGh4eXJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjk1MDc0MiwiZXhwIjoyMDg4NTI2NzQyfQ.9MN8k-RkBYskeAYDpBQAKWVEoT_L81-uy4ivV_b0L5w"
);

const PACKAGES = { spark: 200, insight: 400, oracle: 1000 };

// Known test card fingerprints / last4 values Stripe uses in test mode
const TEST_CARD_LAST4 = ["4242", "4343", "0002", "0341", "9995", "0069"];

export const config = { api: { bodyParser: false } };

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const buf = await buffer(req);
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session    = event.data.object;
    const client     = session.metadata?.client;
    const pkg        = session.metadata?.package;
    const user_email = session.metadata?.user_email || session.customer_email;
    const credits    = PACKAGES[pkg];

    if (!client || !credits) {
      console.error("Missing metadata:", session.metadata);
      return res.status(400).send("Missing metadata");
    }

    // ── Test card detection ──────────────────────────────────────────────────
    // Fetch payment intent to check card details
    let isTestCard = false;
    try {
      if (session.payment_intent) {
        const pi = await stripe.paymentIntents.retrieve(session.payment_intent, {
          expand: ["payment_method"],
        });
        const last4 = pi.payment_method?.card?.last4;
        const livemode = event.livemode;
        if (!livemode || (last4 && TEST_CARD_LAST4.includes(last4))) {
          isTestCard = true;
        }
      }
    } catch(e) {
      console.warn("Could not check payment method:", e.message);
    }

    if (isTestCard) {
      // Log abuse attempt
      await supabase.from("stripe_abuse_log").insert({
        client, user_email, package: pkg,
        stripe_id: session.id,
        reason: "Test card used in production attempt",
      });
      console.warn(`⚠ Test card attempt blocked: ${user_email} / ${client}`);
      return res.json({ received: true, blocked: true });
    }

    // ── Normal flow — add credits ────────────────────────────────────────────
    const lookupKey = user_email || client;
    const lookupCol = user_email ? "user_email" : "client";

    const { data: existing } = await supabase
      .from("ai_credits").select("balance").eq(lookupCol, lookupKey).maybeSingle();

    const newBalance = (existing?.balance || 0) + credits;

    await supabase.from("ai_credits").upsert(
      { [lookupCol]: lookupKey, client, balance: newBalance, updated_at: new Date().toISOString() },
      { onConflict: lookupCol }
    );

    // Get Stripe receipt URL from payment intent
    let receipt_url = null;
    let invoice_pdf = null;
    try {
      if (session.payment_intent) {
        const pi = await stripe.paymentIntents.retrieve(session.payment_intent);
        const charge = pi.latest_charge;
        if (charge) {
          const ch = await stripe.charges.retrieve(charge);
          receipt_url = ch.receipt_url;
        }
      }
    } catch(e) { console.warn("Could not fetch receipt:", e.message); }

    await supabase.from("ai_transactions").insert({
      client, user_email, credits, type: "purchase",
      package: pkg, stripe_id: session.id,
      receipt_url,
    });

    console.log(`✓ ${user_email || client} +${credits} cr → ${newBalance}`);
  }

  res.json({ received: true });
}
