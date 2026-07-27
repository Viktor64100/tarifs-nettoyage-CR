// Types applicatifs. À remplacer/compléter par la génération Supabase :
//   npx supabase gen types typescript --project-id <ref> > types/supabase.ts

export type PlanStatus = "trial" | "active" | "past_due" | "canceled";

export type ProspectStatus =
  | "nouveau" | "a_rappeler" | "interesse" | "pas_interesse"
  | "rdv" | "mauvais_numero" | "injoignable";

export type InteractionType = ProspectStatus | "note" | "voice_note";

export interface Prospect {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string | null;
  company: string | null;
  phone: string;
  email: string | null;
  sector: string | null;
  status: ProspectStatus;
  next_follow_up_at: string | null;
  consent_given: boolean;
  consent_at: string | null;
  consent_source: string | null;
  created_at: string;
  updated_at: string;
}

export interface Interaction {
  id: string;
  prospect_id: string;
  user_id: string;
  type: InteractionType;
  note: string | null;
  ai_summary: string | null;
  ai_tags: string[];
  voice_note_url: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  company: string | null;
  daily_goal: number;
  timezone: string;
  plan: PlanStatus;
  trial_ends_at: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}
