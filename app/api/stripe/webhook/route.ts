// STRIPE: Route POST /api/stripe/webhook
// Écoute les événements Stripe — notamment checkout.session.completed
// pour marquer l'acompte comme reçu dans la commande
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import Stripe from 'stripe';

// STRIPE: Désactiver le body parser Next.js — Stripe a besoin du raw body
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error('[STRIPE] Webhook: signature ou secret manquant');
    return NextResponse.json({ error: 'Configuration webhook invalide.' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    // STRIPE: Vérifier la signature pour s'assurer que la requête vient bien de Stripe
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('[STRIPE] Webhook signature invalide:', err);
    return NextResponse.json({ error: 'Signature invalide.' }, { status: 400 });
  }

  // STRIPE: Traiter l'événement checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    // STRIPE: On stocke l'ID de la commande TBS dans payment_intent metadata
    const commandeId = session.metadata?.commande_id;
    if (commandeId) {
      const adminClient = createAdminClient();
      const { error } = await adminClient
        .from('commandes')
        .update({ acompte_envoye: true })
        .eq('id', commandeId);

      if (error) {
        console.error('[STRIPE] Erreur mise à jour acompte_envoye:', error);
        return NextResponse.json({ error: 'Erreur base de données.' }, { status: 500 });
      }

      console.log(`[STRIPE] Acompte reçu pour commande ${commandeId}`);
    } else {
      console.warn('[STRIPE] checkout.session.completed sans commande_id en metadata');
    }
  }

  return NextResponse.json({ received: true });
}
