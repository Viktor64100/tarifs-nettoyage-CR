-- ============================================================================
-- Date/heure du rendez-vous, capturée quand l'issue "RDV obtenu" est loguée.
-- Colonne additive et nullable : n'affecte aucune ligne existante ni le RLS
-- déjà en place sur interactions (les policies s'appliquent à la ligne entière).
-- ============================================================================

alter table interactions add column meeting_at timestamptz;
