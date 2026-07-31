import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

// POST -> { url } : ouvre le portail client Stripe (gérer/annuler l'abonnement).
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("stripe_customer_id").single();
  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: "Aucun abonnement Stripe associé à ce compte." }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${appUrl}/settings`,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("stripe billing portal session creation failed", e);
    const message = e instanceof Error ? e.message : "Erreur Stripe inconnue.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
