-- ============================================================================
-- Garde-fou de coût sur les endpoints IA (résumé d'appel, transcription).
-- Plafond technique généreux (très au-dessus d'un usage normal) : protège
-- contre une boucle applicative, un abus de clé ou un bug côté client
-- qui ferait exploser la facture OpenAI. Ce n'est pas une limite de plan
-- commercial (Free/Pro) — juste un filet de sécurité infra.
-- ============================================================================

create table ai_usage_daily (
  user_id uuid not null references auth.users(id) on delete cascade,
  day     date not null default current_date,
  count   int  not null default 0,
  primary key (user_id, day)
);

alter table ai_usage_daily enable row level security;

create policy "ai usage owner select" on ai_usage_daily
  for select using (auth.uid() = user_id);
create policy "ai usage owner insert" on ai_usage_daily
  for insert with check (auth.uid() = user_id);
create policy "ai usage owner update" on ai_usage_daily
  for update using (auth.uid() = user_id);
