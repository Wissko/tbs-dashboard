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

  // SECURITY: Guard explicite — profil manquant = état incohérent, on affiche une erreur claire
  if (!userProfile?.tenant_id) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-6">
        <div className="bg-white rounded-xl border border-red-200 p-8 max-w-md text-center shadow-sm">
          <h2 className="text-xl font-serif text-red-700 mb-2">Profil introuvable</h2>
          <p className="text-sm text-[#6B6459]">
            Votre compte utilisateur n&apos;est pas associé à un tenant. Contactez l&apos;administrateur.
          </p>
          <a
            href="/login"
            className="inline-block mt-4 text-sm text-[#C9A96E] hover:underline"
          >
            Retour à la connexion
          </a>
        </div>
      </div>
    );
  }

  const { data: tenant } = await supabase
    .from('tenants')
    .select('name, slug')
    .eq('id', userProfile.tenant_id)
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
