import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

// POST -> { url } : ouvre le Checkout Stripe (abonnement 15 €/mois, essai 14 j).
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("stripe_customer_id").single();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: profile?.stripe_customer_id ?? undefined,
    customer_email: profile?.stripe_customer_id ? undefined : user.email,
    client_reference_id: user.id,                 // relie la session à l'utilisateur
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    subscription_data: { trial_period_days: 14, metadata: { user_id: user.id } },
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/settings?checkout=cancel`,
  });

  return NextResponse.json({ url: session.url });
}
