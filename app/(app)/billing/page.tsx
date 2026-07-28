import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import BillingScreen from "@/components/billing/BillingScreen";

export const metadata: Metadata = { title: "Facturation" };

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, trial_ends_at, stripe_customer_id")
    .single();

  return (
    <BillingScreen
      plan={profile?.plan ?? "trial"}
      trialEndsAt={profile?.trial_ends_at ?? null}
      hasStripeCustomer={!!profile?.stripe_customer_id}
    />
  );
}
