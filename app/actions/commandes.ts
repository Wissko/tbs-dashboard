'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { envoyerEmailAcceptation, envoyerEmailRefus } from '@/lib/email';
// STRIPE: import du client Stripe pour créer les payment links
import { stripe } from '@/lib/stripe';

async function getTenantInfo(tenantId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from('tenants')
    // STRIPE: on sélectionne aussi stripe_account_id pour la génération du payment link
    .select('name, email, stripe_account_id')
    .eq('id', tenantId)
    .single();
  return data;
}

// SECURITY: Helper to verify authenticated user and return their tenant_id
async function getAuthenticatedUserTenantId(supabase: Awaited<ReturnType<typeof createClient>>): Promise<{ tenantId: string } | { error: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié.' };

  const admin = createAdminClient();
  const { data: userProfile } = await admin
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (!userProfile?.tenant_id) return { error: 'Profil utilisateur introuvable.' };

  return { tenantId: userProfile.tenant_id };
}

export async function accepterCommande(commandeId: string, prixTotal: number) {
  const supabase = await createClient();

  // SECURITY: Verify authentication and get user tenant_id
  const authResult = await getAuthenticatedUserTenantId(supabase);
  if ('error' in authResult) return { error: authResult.error };
  const { tenantId } = authResult;

  // SECURITY: Validate prixTotal to avoid unbounded mutations
  if (!Number.isFinite(prixTotal) || prixTotal <= 0 || prixTotal > 1_000_000) {
    return { error: 'Prix invalide.' };
  }

  // SECURITY: Fetch commande with tenant_id check (defence in depth against IDOR)
  const adminC = createAdminClient();
  const { data: commande, error: fetchError } = await adminC
    .from('commandes')
    .select('*')
    .eq('id', commandeId)
    .eq('tenant_id', tenantId)
    .single();

  if (fetchError || !commande) {
    return { error: 'Commande introuvable.' };
  }

  const acompte = prixTotal * 0.3;
  // STRIPE: montant de l'acompte en centimes (30% du total)
  const acompteEnCentimes = Math.round(prixTotal * 0.30 * 100);

  // Récupérer les infos tenant (avec stripe_account_id)
  const tenant = await getTenantInfo(commande.tenant_id);

  // STRIPE: Générer un Payment Link Stripe si le tenant est connecté à Stripe
  let paymentLinkUrl: string | null = null;
  if (tenant?.stripe_account_id && process.env.STRIPE_SECRET_KEY) {
    try {
      // STRIPE: Créer d'abord un Price (inline product) sur le compte connecté
      const price = await stripe.prices.create(
        {
          currency: 'eur',
          unit_amount: acompteEnCentimes,
          product_data: {
            name: `Acompte 30% — ${commande.type} (${commande.date_evenement})`,
          },
        },
        { stripeAccount: tenant.stripe_account_id }
      );

      // STRIPE: Créer le Payment Link avec metadata commande_id pour le webhook
      const paymentLink = await stripe.paymentLinks.create(
        {
          line_items: [{ price: price.id, quantity: 1 }],
          metadata: {
            commande_id: commandeId,
          },
          after_completion: {
            type: 'hosted_confirmation',
            hosted_confirmation: {
              custom_message: 'Merci ! Votre acompte a bien été reçu.',
            },
          },
        },
        { stripeAccount: tenant.stripe_account_id }
      );

      paymentLinkUrl = paymentLink.url;
      console.log(`[STRIPE] Payment Link créé: ${paymentLinkUrl} pour commande ${commandeId}`);
    } catch (stripeError) {
      // STRIPE: On ne bloque pas l'acceptation si Stripe échoue
      console.error('[STRIPE] Erreur création payment link:', stripeError);
    }
  }

  // Mettre à jour la commande (statut + prix + payment_link_url si disponible)
  const adminClient = createAdminClient();
  const { error: updateError } = await adminClient
    .from('commandes')
    .update({
      statut: 'acceptee',
      prix_total: prixTotal,
      // STRIPE: stocker le lien de paiement dans la commande
      ...(paymentLinkUrl ? { payment_link_url: paymentLinkUrl } : {}),
    })
    .eq('id', commandeId)
    .eq('tenant_id', tenantId); // SECURITY: double-check tenant on update

  if (updateError) {
    return { error: 'Erreur lors de la mise a jour.' };
  }

  // Envoyer email avec le payment link si disponible
  if (tenant) {
    try {
      await envoyerEmailAcceptation({
        destinataire: commande.email,
        prenom: commande.prenom,
        type: commande.type,
        dateEvenement: commande.date_evenement,
        prixTotal,
        acompte,
        tenantName: tenant.name,
        tenantEmail: tenant.email,
        // STRIPE: passer le lien de paiement à l'email
        paymentLinkUrl: paymentLinkUrl ?? undefined,
      });
    } catch (emailError) {
      console.error('Erreur email acceptation:', emailError);
    }
  }

  revalidatePath('/dashboard');
  return { success: true, acompte, paymentLinkUrl };
}

export async function refuserCommande(commandeId: string) {
  const supabase = await createClient();

  // SECURITY: Verify authentication and get user tenant_id
  const authResult = await getAuthenticatedUserTenantId(supabase);
  if ('error' in authResult) return { error: authResult.error };
  const { tenantId } = authResult;

  // SECURITY: Fetch commande with tenant_id check (defence in depth against IDOR)
  const adminC = createAdminClient();
  const { data: commande, error: fetchError } = await adminC
    .from('commandes')
    .select('*')
    .eq('id', commandeId)
    .eq('tenant_id', tenantId)
    .single();

  if (fetchError || !commande) {
    return { error: 'Commande introuvable.' };
  }

  const { error: updateError } = await createAdminClient()
    .from('commandes')
    .update({ statut: 'refusee' })
    .eq('id', commandeId)
    .eq('tenant_id', tenantId); // SECURITY: double-check tenant on update

  if (updateError) {
    return { error: 'Erreur lors de la mise a jour.' };
  }

  const tenant = await getTenantInfo(commande.tenant_id);

  if (tenant) {
    try {
      await envoyerEmailRefus({
        destinataire: commande.email,
        prenom: commande.prenom,
        type: commande.type,
        tenantName: tenant.name,
        tenantEmail: tenant.email,
      });
    } catch (emailError) {
      console.error('Erreur email refus:', emailError);
    }
  }

  revalidatePath('/dashboard');
  return { success: true };
}

export async function toggleAcompteRecu(commandeId: string, acompteActuel: boolean) {
  const supabase = await createClient();

  // SECURITY: Verify authentication and get user tenant_id
  const authResult = await getAuthenticatedUserTenantId(supabase);
  if ('error' in authResult) return { error: authResult.error };
  const { tenantId } = authResult;

  // SECURITY: Verify commande ownership before mutation
  const adminC = createAdminClient();
  const { data: commande, error: fetchError } = await adminC
    .from('commandes')
    .select('id')
    .eq('id', commandeId)
    .eq('tenant_id', tenantId)
    .single();

  if (fetchError || !commande) {
    return { error: 'Commande introuvable.' };
  }

  const { error } = await createAdminClient()
    .from('commandes')
    .update({ acompte_envoye: !acompteActuel })
    .eq('id', commandeId)
    .eq('tenant_id', tenantId); // SECURITY: double-check tenant on update

  if (error) {
    return { error: 'Erreur lors de la mise a jour.' };
  }

  revalidatePath('/dashboard');
  return { success: true };
}
