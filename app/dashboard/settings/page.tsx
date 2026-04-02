// STRIPE: Page settings — gestion de la connexion Stripe Connect
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ stripe_success?: string; stripe_error?: string }>;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { data: userProfile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (!userProfile?.tenant_id) {
    redirect('/login');
  }

  // Récupérer les infos du tenant (avec stripe_account_id)
  const { data: tenant } = await supabase
    .from('tenants')
    // STRIPE: on inclut stripe_account_id et stripe_connected_at
    .select('name, slug, stripe_account_id, stripe_connected_at')
    .eq('id', userProfile.tenant_id)
    .single();

  const params = await searchParams;
  const stripeSuccess = params.stripe_success === '1';
  const stripeError = params.stripe_error === '1';

  const isStripeConnected = !!tenant?.stripe_account_id;
  const connectedAt = tenant?.stripe_connected_at
    ? new Date(tenant.stripe_connected_at).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div className="min-h-screen bg-[#FAF8F5] p-6 md:p-10">
      <div className="max-w-2xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <a
            href="/dashboard"
            className="text-sm text-[#C9A96E] hover:underline mb-4 inline-block"
          >
            ← Retour au dashboard
          </a>
          <h1 className="text-3xl font-serif text-[#1A1410]">Paramètres</h1>
          <p className="text-[#6B6459] mt-1">{tenant?.name}</p>
        </div>

        {/* Notifications */}
        {stripeSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            ✅ Votre compte Stripe a été connecté avec succès !
          </div>
        )}
        {stripeError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            ❌ Une erreur est survenue lors de la connexion Stripe. Veuillez réessayer.
          </div>
        )}

        {/* STRIPE: Section Stripe Connect */}
        <div className="bg-white rounded-xl border border-[#E8E0D5] p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-serif text-[#1A1410] mb-1">Stripe Connect</h2>
              <p className="text-sm text-[#6B6459]">
                Connectez votre compte Stripe pour recevoir les acomptes directement.
              </p>
            </div>
            {/* STRIPE: badge statut */}
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                isStripeConnected
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {isStripeConnected ? 'Connecté' : 'Non connecté'}
            </span>
          </div>

          {isStripeConnected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-[#6B6459]">
                <span>✅ Compte Stripe connecté</span>
              </div>
              {connectedAt && (
                <p className="text-xs text-[#9B9086]">Connecté le {connectedAt}</p>
              )}
              <p className="text-xs text-[#9B9086] font-mono bg-[#FAF8F5] px-3 py-2 rounded border border-[#E8E0D5]">
                ID: {tenant?.stripe_account_id}
              </p>
              <p className="text-sm text-[#6B6459] mt-2">
                Les Payment Links seront automatiquement générés à l&apos;acceptation des commandes.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-[#6B6459]">
                Une fois connecté, un lien de paiement Stripe sera envoyé automatiquement
                à vos clients lors de l&apos;acceptation d&apos;une commande (acompte 30%).
              </p>
              {/* STRIPE: Bouton de connexion OAuth */}
              <a
                href="/api/stripe/connect"
                className="inline-flex items-center gap-2 bg-[#635BFF] hover:bg-[#5147e5] text-white px-6 py-3 rounded-lg font-medium transition-colors text-sm"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
                </svg>
                Connecter Stripe
              </a>
            </div>
          )}
        </div>

        {/* Info compte */}
        <div className="bg-white rounded-xl border border-[#E8E0D5] p-6 shadow-sm mt-6">
          <h2 className="text-xl font-serif text-[#1A1410] mb-4">Votre compte</h2>
          <div className="space-y-2 text-sm text-[#6B6459]">
            <div className="flex gap-2">
              <span className="font-medium text-[#1A1410] w-24">Email</span>
              <span>{user.email}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium text-[#1A1410] w-24">Slug</span>
              <span className="font-mono text-xs bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#E8E0D5]">
                {tenant?.slug}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
