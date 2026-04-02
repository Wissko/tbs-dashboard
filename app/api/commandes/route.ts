import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

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
    return NextResponse.json(
      { error: 'Corps de requête invalide.' },
      { status: 400 }
    );
  }

  // Validation des champs requis
  const champsRequis = [
    'type', 'date_evenement', 'personnes', 'description',
    'prenom', 'nom', 'email', 'telephone',
  ];

  for (const champ of champsRequis) {
    if (!body[champ] || typeof body[champ] !== 'string') {
      return NextResponse.json(
        { error: `Champ requis manquant ou invalide : ${champ}` },
        { status: 400 }
      );
    }
  }

  const { data, error } = await supabase
    .from('commandes')
    .insert({
      tenant_id: tenant.id,
      type: body.type,
      date_evenement: body.date_evenement,
      personnes: body.personnes,
      description: body.description,
      allergies: (body.allergies as string) || '',
      prenom: body.prenom,
      nom: body.nom,
      email: body.email,
      telephone: body.telephone,
      statut: 'en_attente',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Erreur insertion commande:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'enregistrement.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, id: data.id }, { status: 201 });
}
