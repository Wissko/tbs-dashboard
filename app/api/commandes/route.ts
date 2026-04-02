import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// SECURITY: Strict input validation schema — rejects malformed or oversized data
// without exposing internal error details to the caller
interface CommandeInput {
  type: string;
  date_evenement: string;
  personnes: string;
  description: string;
  allergies?: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
}

// SECURITY: Validate a single field against type, length and optional regex
function validateField(
  value: unknown,
  maxLength: number,
  pattern?: RegExp
): boolean {
  if (typeof value !== 'string') return false;
  if (value.length === 0 || value.length > maxLength) return false;
  if (pattern && !pattern.test(value)) return false;
  return true;
}

// SECURITY: Validate all incoming commande fields — rejects invalid input
// Returns null on success, or a generic error message string on failure
function validateCommandeInput(body: Record<string, unknown>): string | null {
  // type: non-empty, max 100 chars
  if (!validateField(body.type, 100)) {
    return 'Champ invalide.';
  }

  // date_evenement: YYYY-MM-DD format
  if (!validateField(body.date_evenement, 10, /^\d{4}-\d{2}-\d{2}$/)) {
    return 'Champ invalide.';
  }

  // personnes: 1-4 digit number string (1–9999)
  if (!validateField(body.personnes, 4, /^\d{1,4}$/)) {
    return 'Champ invalide.';
  }

  // description: non-empty, max 2000 chars
  if (!validateField(body.description, 2000)) {
    return 'Champ invalide.';
  }

  // allergies: optional, max 500 chars
  if (body.allergies !== undefined && body.allergies !== '') {
    if (!validateField(body.allergies, 500)) {
      return 'Champ invalide.';
    }
  }

  // prenom: non-empty, max 100 chars
  if (!validateField(body.prenom, 100)) {
    return 'Champ invalide.';
  }

  // nom: non-empty, max 100 chars
  if (!validateField(body.nom, 100)) {
    return 'Champ invalide.';
  }

  // SECURITY: Validate email format
  if (!validateField(body.email, 255, /^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return 'Champ invalide.';
  }

  // SECURITY: Validate telephone format (digits, spaces, +, -, parentheses, 6-20 chars)
  if (!validateField(body.telephone, 20, /^[\d\s\+\-\(\)]{6,20}$/)) {
    return 'Champ invalide.';
  }

  return null;
}

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Clé API manquante.' },
      { status: 401 }
    );
  }

  const supabase = createAdminClient();

  // Vérifier la clé API et récupérer le tenant
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id')
    .eq('api_key', apiKey)
    .single();

  if (tenantError || !tenant) {
    return NextResponse.json(
      { error: 'Clé API invalide.' },
      { status: 401 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    // SECURITY: Generic error — do not expose parse details
    return NextResponse.json(
      { error: 'Corps de requête invalide.' },
      { status: 400 }
    );
  }

  // SECURITY: Validate all fields with strict type/length/format checks
  const validationError = validateCommandeInput(body);
  if (validationError) {
    // SECURITY: Generic error message — do not expose which field failed or why
    return NextResponse.json(
      { error: validationError },
      { status: 400 }
    );
  }

  const input = body as unknown as CommandeInput;

  const { data, error } = await supabase
    .from('commandes')
    .insert({
      tenant_id: tenant.id,
      type: input.type,
      date_evenement: input.date_evenement,
      personnes: input.personnes,
      description: input.description,
      allergies: input.allergies || '',
      prenom: input.prenom,
      nom: input.nom,
      email: input.email,
      telephone: input.telephone,
      statut: 'en_attente',
    })
    .select('id')
    .single();

  if (error) {
    // SECURITY: Log internal error but return generic message to caller
    console.error('Erreur insertion commande:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'enregistrement.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, id: data.id }, { status: 201 });
}
