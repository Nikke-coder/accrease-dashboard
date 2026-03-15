import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_IDS = {
  spark:   process.env.STRIPE_PRICE_SPARK,
  insight: process.env.STRIPE_PRICE_INSIGHT,
  oracle:  process.env.STRIPE_PRICE_ORACLE,
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { package: pkg, client } = req.body;
  if (!PRICE_IDS[pkg]) return res.status(400).json({ error: "Unknown package" });

  const baseUrl = process.env.NEXT_PUBLIC_URL;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: PRICE_IDS[pkg], quantity: 1 }],
    metadata: { client, package: pkg },
    success_url: `${baseUrl}/payment-success.html`,
    cancel_url:  `${baseUrl}?billing=cancelled`,
  });

  res.json({ url: session.url });
}
