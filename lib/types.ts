export type Statut = 'en_attente' | 'acceptee' | 'refusee';

export type Commande = {
  id: string;
  tenant_id: string;
  created_at: string;
  type: string;
  date_evenement: string;
  personnes: string;
  description: string;
  allergies: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  statut: Statut;
  prix_total: number | null;
  acompte_envoye: boolean;
};

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  email: string;
  api_key: string;
  created_at: string;
};

export type UserProfile = {
  id: string;
  tenant_id: string;
  email: string;
  role: 'admin' | 'member';
  created_at: string;
};
