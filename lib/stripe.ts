// STRIPE: client Stripe centralisé — uniquement côté serveur
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  // En dev, on tolère l'absence de la clé mais on log un avertissement
  console.warn('[STRIPE] STRIPE_SECRET_KEY non définie — fonctionnalités Stripe désactivées');
}

// STRIPE: instance Stripe platform (acct_1THbhSIsLIN06SrB)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder', {
  apiVersion: '2025-03-31.basil',
  typescript: true,
});

// STRIPE: URL de redirect après OAuth Stripe Connect
export function getStripeConnectOAuthUrl(tenantId: string): string {
  const clientId = process.env.STRIPE_CLIENT_ID ?? '';
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/callback`;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: 'read_write',
    redirect_uri: redirectUri,
    state: tenantId, // SECURITY: on passe le tenantId pour valider au retour
  });

  return `https://connect.stripe.com/oauth/authorize?${params.toString()}`;
}
