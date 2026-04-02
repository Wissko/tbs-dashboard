-- TBS Dashboard - Migration hashing clés API
-- SECURITY: On ajoute api_key_hash (bcrypt) et api_key_prefix (8 chars lisibles pour le debug)
-- L'api_key brute ne sera plus stockée après cette migration

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS api_key_hash TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS api_key_prefix TEXT DEFAULT NULL;

-- Note : la migration des valeurs existantes (calcul du hash)
-- est faite applicativement via le script de migration scripts/migrate-api-keys.ts
-- car bcrypt ne peut pas être exécuté nativement en SQL (Postgres).
-- Après migration applicative, api_key pourra être supprimée dans une migration ultérieure.
-- Pour l'instant on garde api_key pour rétrocompatibilité.
