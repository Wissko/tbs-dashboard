-- TBS Dashboard - Migration Stripe Connect
-- Ajoute stripe_account_id et stripe_connected_at sur tenants
-- Ajoute payment_link_url sur commandes

-- STRIPE: colonnes Stripe Connect sur le tenant
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS stripe_connected_at TIMESTAMPTZ DEFAULT NULL;

-- STRIPE: lien de paiement généré à l'acceptation de la commande
ALTER TABLE public.commandes
  ADD COLUMN IF NOT EXISTS payment_link_url TEXT DEFAULT NULL;
