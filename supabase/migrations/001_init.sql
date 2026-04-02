-- TBS Dashboard - Migration initiale
-- Multi-tenant SaaS pour gestion de commandes sur mesure

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: tenants
-- ============================================
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE: users (profils liés à Supabase Auth)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE: commandes
-- ============================================
CREATE TABLE IF NOT EXISTS public.commandes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  type TEXT NOT NULL,
  date_evenement TEXT NOT NULL,
  personnes TEXT NOT NULL,
  description TEXT NOT NULL,
  allergies TEXT NOT NULL DEFAULT '',
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  email TEXT NOT NULL,
  telephone TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'acceptee', 'refusee')),
  prix_total NUMERIC(10, 2) DEFAULT NULL,
  acompte_envoye BOOLEAN NOT NULL DEFAULT FALSE
);

-- ============================================
-- INDEX
-- ============================================
CREATE INDEX IF NOT EXISTS commandes_tenant_id_idx ON public.commandes(tenant_id);
CREATE INDEX IF NOT EXISTS commandes_statut_idx ON public.commandes(statut);
CREATE INDEX IF NOT EXISTS users_tenant_id_idx ON public.users(tenant_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commandes ENABLE ROW LEVEL SECURITY;

-- Politique tenants : un user voit uniquement son tenant
CREATE POLICY "tenant_select_own" ON public.tenants
  FOR SELECT
  USING (
    id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Politique users : un user voit uniquement les membres de son tenant
CREATE POLICY "users_select_own_tenant" ON public.users
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- Politique commandes : lecture/écriture uniquement sur son tenant
CREATE POLICY "commandes_select_own_tenant" ON public.commandes
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "commandes_insert_own_tenant" ON public.commandes
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "commandes_update_own_tenant" ON public.commandes
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid()
    )
  );

-- ============================================
-- FONCTION : créer le profil user à l'inscription
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Le tenant_id doit être passé dans les metadata lors de la création via service role
  IF NEW.raw_user_meta_data ->> 'tenant_id' IS NOT NULL THEN
    INSERT INTO public.users (id, tenant_id, email)
    VALUES (
      NEW.id,
      (NEW.raw_user_meta_data ->> 'tenant_id')::UUID,
      NEW.email
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger sur auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- DONNÉES DE DÉMO (optionnel - à supprimer en prod)
-- ============================================
-- INSERT INTO public.tenants (name, slug, email)
-- VALUES ('Baraka Boulangerie', 'baraka', 'contact@baraka-boulangerie.fr');
