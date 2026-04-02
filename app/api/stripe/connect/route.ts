// STRIPE: Route GET /api/stripe/connect
// Génère l'URL OAuth Stripe Connect et redirige le tenant
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripeConnectOAuthUrl } from '@/lib/stripe';

export async function GET() {
  const supabase = await createClient();

  // SECURITY: Vérifier que l'utilisateur est authentifié
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL!));
  }

  // Récupérer le tenant_id de l'utilisateur
  const { data: userProfile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (!userProfile?.tenant_id) {
    return NextResponse.json({ error: 'Profil utilisateur introuvable.' }, { status: 400 });
  }

  // STRIPE: Générer l'URL OAuth avec le tenantId en state
  const oauthUrl = getStripeConnectOAuthUrl(userProfile.tenant_id);

  return NextResponse.redirect(oauthUrl);
}
