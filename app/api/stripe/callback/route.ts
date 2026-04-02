// STRIPE: Route GET /api/stripe/callback
// Reçoit le code OAuth Stripe → échange → stocke stripe_account_id
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // tenantId passé en state
  const error = searchParams.get('error');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  // STRIPE: Gérer les erreurs de l'OAuth (ex: utilisateur a annulé)
  if (error) {
    console.error('[STRIPE] OAuth error:', error, searchParams.get('error_description'));
    return NextResponse.redirect(`${appUrl}/dashboard/settings?stripe_error=1`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/dashboard/settings?stripe_error=1`);
  }

  // SECURITY: Vérifier que l'utilisateur connecté correspond au tenantId dans state
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${appUrl}/login`);
  }

  const { data: userProfile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (!userProfile?.tenant_id || userProfile.tenant_id !== state) {
    // SECURITY: Le state ne correspond pas — potentielle attaque CSRF
    console.error('[STRIPE] State mismatch — possible CSRF attack');
    return NextResponse.redirect(`${appUrl}/dashboard/settings?stripe_error=1`);
  }

  try {
    // STRIPE: Échanger le code OAuth contre un access_token
    const response = await stripe.oauth.token({
      grant_type: 'authorization_code',
      code,
    });

    const stripeAccountId = response.stripe_user_id;
    if (!stripeAccountId) {
      throw new Error('stripe_user_id manquant dans la réponse OAuth');
    }

    // Stocker le stripe_account_id dans la table tenants
    const adminClient = createAdminClient();
    const { error: updateError } = await adminClient
      .from('tenants')
      .update({
        stripe_account_id: stripeAccountId,
        stripe_connected_at: new Date().toISOString(),
      })
      .eq('id', userProfile.tenant_id);

    if (updateError) {
      console.error('[STRIPE] Erreur stockage stripe_account_id:', updateError);
      return NextResponse.redirect(`${appUrl}/dashboard/settings?stripe_error=1`);
    }

    console.log(`[STRIPE] Compte connecté: ${stripeAccountId} pour tenant ${userProfile.tenant_id}`);
    return NextResponse.redirect(`${appUrl}/dashboard/settings?stripe_success=1`);

  } catch (err) {
    console.error('[STRIPE] Erreur échange OAuth:', err);
    return NextResponse.redirect(`${appUrl}/dashboard/settings?stripe_error=1`);
  }
}
