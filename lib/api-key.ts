// SECURITY: Utilitaires pour le hashing et la vérification des clés API tenants
// Utilise bcrypt (work factor 12) — clé jamais stockée en clair après génération

import bcrypt from 'bcryptjs';
import { createAdminClient } from '@/lib/supabase/admin';

const BCRYPT_ROUNDS = 12;

/**
 * Génère une clé API brute (hex 32 bytes) + son hash bcrypt + son préfixe lisible.
 * À appeler à la création d'un tenant — retourner la clé brute UNE SEULE FOIS au créateur.
 */
export async function generateApiKey(): Promise<{
  rawKey: string;
  hash: string;
  prefix: string;
}> {
  const raw = Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  ).join('');
  const hash = await bcrypt.hash(raw, BCRYPT_ROUNDS);
  const prefix = raw.substring(0, 8);
  return { rawKey: raw, hash, prefix };
}

/**
 * Vérifie une clé API reçue dans une requête.
 * Charge tous les tenants dont le prefix correspond (réduction du scope),
 * puis compare bcrypt.
 * Retourne l'objet tenant si valide, null sinon.
 */
export async function verifyApiKey(
  rawKey: string
): Promise<{ id: string } | null> {
  if (!rawKey || rawKey.length < 8) return null;

  const prefix = rawKey.substring(0, 8);
  const adminClient = createAdminClient();

  // SECURITY: On filtre sur le prefix pour éviter de charger toute la table
  const { data: candidates } = await adminClient
    .from('tenants')
    .select('id, api_key_hash')
    .eq('api_key_prefix', prefix);

  if (!candidates || candidates.length === 0) {
    // Fallback rétrocompat : vérification sur api_key brute (ancien format)
    // À retirer une fois tous les tenants migrés
    const { data: legacy } = await adminClient
      .from('tenants')
      .select('id')
      .eq('api_key', rawKey)
      .single();
    return legacy ?? null;
  }

  for (const candidate of candidates) {
    if (!candidate.api_key_hash) continue;
    const match = await bcrypt.compare(rawKey, candidate.api_key_hash);
    if (match) return { id: candidate.id };
  }

  return null;
}
