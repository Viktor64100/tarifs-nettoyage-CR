-- ============================================================================
-- Cache du coaching hebdomadaire IA : { week: "2026-W31", insight: string,
-- generated_at: timestamptz } — régénéré au plus une fois par semaine ISO,
-- au premier chargement du dashboard une fois assez de données disponibles.
-- Additive et nullable, sans impact sur le RLS existant.
-- ============================================================================

alter table profiles add column weekly_coaching jsonb;
