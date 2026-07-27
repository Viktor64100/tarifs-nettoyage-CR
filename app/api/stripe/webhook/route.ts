import { NextResponse } from "next/server";
import { createClient as createSbClient, type SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";

// Client "service role" : le webhook n'a pas de session utilisateur, il contourne le RLS.
// Instanciation paresseuse pour ne pas faire échouer la collecte des routes par `next build`
// si les variables d'environnement ne sont pas encore définies.
let admin: SupabaseClient | null = null;
function getAdmin() {
  if (!admin) {
    admin = createSbClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return admin;
}

const PLAN_FROM_STATUS: Record<string, string> = {
  trialing: "trial", active: "active", past_due: "past_due",
  canceled: "canceled", unpaid: "past_due", incomplete: "trial",
};

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "signature invalide" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      if (s.client_reference_id) {
        await getAdmin().from("profiles").update({
          stripe_customer_id: s.customer as string,
          stripe_subscription_id: s.subscription as string,
          plan: "active",
        }).eq("id", s.client_reference_id);
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.user_id;
      const plan = PLAN_FROM_STATUS[sub.status] ?? "canceled";
      if (userId) {
        await getAdmin().from("profiles").update({ plan }).eq("id", userId);
      } else {
        await getAdmin().from("profiles").update({ plan })
          .eq("stripe_subscription_id", sub.id);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
