import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Commande } from '@/lib/types';
import DashboardClient from '@/components/dashboard/DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Récupérer le profil et tenant de l'utilisateur
  const { data: userProfile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (!userProfile) {
    redirect('/login');
  }

  const { data: tenant } = await supabase
    .from('tenants')
    .select('name, slug')
    .eq('id', userProfile.tenant_id)
    .single();

  // Récupérer les commandes du tenant (RLS applique la sécurité automatiquement)
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
