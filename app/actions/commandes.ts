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

export async function accepterCommande(commandeId: string, prixTotal: number) {
  const supabase = await createClient();

  // Récupérer la commande
  const { data: commande, error: fetchError } = await supabase
    .from('commandes')
    .select('*')
    .eq('id', commandeId)
    .single();

  if (fetchError || !commande) {
    return { error: 'Commande introuvable.' };
  }

  const acompte = prixTotal * 0.3;

  // Mettre à jour la commande
  const { error: updateError } = await supabase
    .from('commandes')
    .update({ statut: 'acceptee', prix_total: prixTotal })
    .eq('id', commandeId);

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

  const { data: commande, error: fetchError } = await supabase
    .from('commandes')
    .select('*')
    .eq('id', commandeId)
    .single();

  if (fetchError || !commande) {
    return { error: 'Commande introuvable.' };
  }

  const { error: updateError } = await supabase
    .from('commandes')
    .update({ statut: 'refusee' })
    .eq('id', commandeId);

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

  const { error } = await supabase
    .from('commandes')
    .update({ acompte_envoye: !acompteActuel })
    .eq('id', commandeId);

  if (error) {
    return { error: 'Erreur lors de la mise a jour.' };
  }

  revalidatePath('/dashboard');
  return { success: true };
}
