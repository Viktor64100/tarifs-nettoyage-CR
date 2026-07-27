-- ============================================================================
-- NextCall — schéma initial
-- Multi-tenant : chaque ligne appartient à un utilisateur (auth.users).
-- La sécurité repose sur Row Level Security (RLS), pas sur le code applicatif.
-- ============================================================================

-- ---------- Enums -----------------------------------------------------------

create type plan_status as enum ('trial', 'active', 'past_due', 'canceled');

create type prospect_status as enum (
  'nouveau', 'a_rappeler', 'interesse', 'pas_interesse',
  'rdv', 'mauvais_numero', 'injoignable'
);

-- Types d'interaction = résultats d'appel + notes.
create type interaction_type as enum (
  'injoignable', 'interesse', 'a_rappeler', 'pas_interesse',
  'rdv', 'mauvais_numero', 'note', 'voice_note'
);

-- ---------- profiles (1:1 avec auth.users) ----------------------------------

create table profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  full_name            text,
  company              text,
  daily_goal           int  not null default 30,
  timezone             text not null default 'Europe/Paris',
  plan                 plan_status not null default 'trial',
  trial_ends_at        timestamptz not null default (now() + interval '14 days'),
  stripe_customer_id     text,
  stripe_subscription_id text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ---------- prospects -------------------------------------------------------

create table prospects (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  first_name       text not null,
  last_name        text,
  company          text,
  phone            text not null,
  email            text,
  sector           text,
  status           prospect_status not null default 'nouveau',
  next_follow_up_at date,                       -- pilote la file d'appels

  -- Consentement au démarchage (loi opt-in du 11/08/2026).
  -- La preuve doit être traçable : qui, quand, par quel canal.
  consent_given    boolean not null default false,
  consent_at       timestamptz,
  consent_source   text,                        -- ex : "Formulaire salon", "Devis site web"

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index prospects_user_followup_idx on prospects (user_id, next_follow_up_at);
create index prospects_user_status_idx   on prospects (user_id, status);

-- ---------- interactions (historique / timeline) ----------------------------
-- Une ligne par appel logué. Alimente aussi les stats "appels du jour".

create table interactions (
  id             uuid primary key default gen_random_uuid(),
  prospect_id    uuid not null references prospects(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  type           interaction_type not null,
  note           text,
  ai_summary     text,            -- résumé généré à partir de la note vocale
  ai_tags        text[] default '{}',
  voice_note_url text,            -- fichier dans Supabase Storage (optionnel)
  created_at     timestamptz not null default now()
);

create index interactions_prospect_idx  on interactions (prospect_id, created_at desc);
create index interactions_user_date_idx on interactions (user_id, created_at);

-- ---------- updated_at automatique ------------------------------------------

create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger profiles_touch  before update on profiles
  for each row execute function touch_updated_at();
create trigger prospects_touch before update on prospects
  for each row execute function touch_updated_at();

-- ---------- Création automatique du profil à l'inscription ------------------

create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================================
-- Row Level Security : chacun ne voit et ne modifie que ses propres données.
-- ============================================================================

alter table profiles     enable row level security;
alter table prospects    enable row level security;
alter table interactions enable row level security;

-- profiles : lecture/écriture de sa propre fiche uniquement.
create policy "profiles self select" on profiles
  for select using (auth.uid() = id);
create policy "profiles self update" on profiles
  for update using (auth.uid() = id);

-- prospects : CRUD complet limité au propriétaire.
create policy "prospects owner select" on prospects
  for select using (auth.uid() = user_id);
create policy "prospects owner insert" on prospects
  for insert with check (auth.uid() = user_id);
create policy "prospects owner update" on prospects
  for update using (auth.uid() = user_id);
create policy "prospects owner delete" on prospects
  for delete using (auth.uid() = user_id);

-- interactions : idem.
create policy "interactions owner select" on interactions
  for select using (auth.uid() = user_id);
create policy "interactions owner insert" on interactions
  for insert with check (auth.uid() = user_id);
create policy "interactions owner update" on interactions
  for update using (auth.uid() = user_id);
create policy "interactions owner delete" on interactions
  for delete using (auth.uid() = user_id);

-- ---------- Vue pratique : file d'appels du jour ----------------------------
-- Prospects à appeler maintenant = nouveaux, ou relance due (<= aujourd'hui).
-- La vue hérite du RLS des tables sous-jacentes.

create view call_queue as
select p.*
from prospects p
where p.status not in ('mauvais_numero', 'pas_interesse', 'rdv')
  and (p.status = 'nouveau' or p.next_follow_up_at <= current_date)
order by p.next_follow_up_at asc nulls last, p.created_at asc;
