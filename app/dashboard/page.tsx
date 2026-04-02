import { createClient } from '@/lib/supabase/server';
import type { Commande } from '@/lib/types';
import DashboardClient from '@/components/dashboard/DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Le middleware gère la redirection si pas de session
  // On affiche un fallback vide si user null (ne devrait pas arriver)
  if (!user) {
    return null;
  }

  // Récupérer le profil et tenant
  const { data: userProfile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  const { data: tenant } = await supabase
    .from('tenants')
    .select('name, slug')
    .eq('id', userProfile?.tenant_id || '')
    .maybeSingle();

  // Récupérer les commandes du tenant (RLS applique la sécurité)
  const { data: commandes } = await supabase
    .from('commandes')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <DashboardClient
      commandes={(commandes as Commande[]) || []}
      tenantName={tenant?.name || 'Dashboard'}
      userEmail={user.email || ''}
    />
  );
}
