'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { envoyerEmailAcceptation, envoyerEmailRefus } from '@/lib/email';

async function getTenantInfo(supabase: Awaited<ReturnType<typeof createClient>>, tenantId: string) {
  const { data } = await supabase
    .from('tenants')
    .select('name, email')
    .eq('id', tenantId)
    .single();
  return data;
}

// SECURITY: Helper to verify authenticated user and return their tenant_id
async function getAuthenticatedUserTenantId(supabase: Awaited<ReturnType<typeof createClient>>): Promise<{ tenantId: string } | { error: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié.' };

  const { data: userProfile } = await supabase
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
  const { data: commande, error: fetchError } = await supabase
    .from('commandes')
    .select('*')
    .eq('id', commandeId)
    .eq('tenant_id', tenantId)
    .single();

  if (fetchError || !commande) {
    return { error: 'Commande introuvable.' };
  }

  const acompte = prixTotal * 0.3;

  // Mettre à jour la commande
  const { error: updateError } = await supabase
    .from('commandes')
    .update({ statut: 'acceptee', prix_total: prixTotal })
    .eq('id', commandeId)
    .eq('tenant_id', tenantId); // SECURITY: double-check tenant on update

  if (updateError) {
    return { error: 'Erreur lors de la mise a jour.' };
  }

  // Récupérer les infos tenant
  const tenant = await getTenantInfo(supabase, commande.tenant_id);

  // Envoyer email
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
      });
    } catch (emailError) {
      console.error('Erreur email acceptation:', emailError);
    }
  }

  revalidatePath('/dashboard');
  return { success: true, acompte };
}

export async function refuserCommande(commandeId: string) {
  const supabase = await createClient();

  // SECURITY: Verify authentication and get user tenant_id
  const authResult = await getAuthenticatedUserTenantId(supabase);
  if ('error' in authResult) return { error: authResult.error };
  const { tenantId } = authResult;

  // SECURITY: Fetch commande with tenant_id check (defence in depth against IDOR)
  const { data: commande, error: fetchError } = await supabase
    .from('commandes')
    .select('*')
    .eq('id', commandeId)
    .eq('tenant_id', tenantId)
    .single();

  if (fetchError || !commande) {
    return { error: 'Commande introuvable.' };
  }

  const { error: updateError } = await supabase
    .from('commandes')
    .update({ statut: 'refusee' })
    .eq('id', commandeId)
    .eq('tenant_id', tenantId); // SECURITY: double-check tenant on update

  if (updateError) {
    return { error: 'Erreur lors de la mise a jour.' };
  }

  const tenant = await getTenantInfo(supabase, commande.tenant_id);

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
  const { data: commande, error: fetchError } = await supabase
    .from('commandes')
    .select('id')
    .eq('id', commandeId)
    .eq('tenant_id', tenantId)
    .single();

  if (fetchError || !commande) {
    return { error: 'Commande introuvable.' };
  }

  const { error } = await supabase
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
