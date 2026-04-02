# TBS Dashboard

SaaS de gestion de commandes sur mesure — boulangeries et patisseries.

---

## Stack

- **Next.js 14** — App Router, TypeScript
- **Tailwind CSS** — Design premium
- **Supabase** — Base de donnees + Auth + RLS multi-tenant
- **Resend** — Emails transactionnels
- **Stripe** — Paiement (architecture anticipee, non implementee)

---

## Setup

### 1. Cloner le repo

```bash
git clone https://github.com/Wissko/tbs-dashboard.git
cd tbs-dashboard
npm install
```

### 2. Configurer Supabase

1. Creer un nouveau projet sur [supabase.com](https://supabase.com)
2. Dans **SQL Editor**, executer le contenu de `supabase/migrations/001_init.sql`
3. Recuperer vos cles dans **Settings > API**

### 3. Variables d'environnement

Copier `.env.example` en `.env.local` et remplir les valeurs :

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
RESEND_API_KEY=re_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Creer le premier tenant et utilisateur

Dans Supabase SQL Editor :

```sql
-- 1. Creer le tenant
INSERT INTO public.tenants (name, slug, email)
VALUES ('Baraka Boulangerie', 'baraka', 'contact@baraka-boulangerie.fr')
RETURNING id, api_key;

-- Noter l'id et l'api_key retournes

-- 2. Creer un utilisateur (depuis l'app Supabase > Authentication > Users)
-- Email : admin@baraka-boulangerie.fr
-- Puis executer :
INSERT INTO public.users (id, tenant_id, email, role)
VALUES ('<user-id-from-auth>', '<tenant-id>', 'admin@baraka-boulangerie.fr', 'admin');
```

### 5. Lancer en local

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

---

## Architecture multi-tenant

- Chaque tenant (boulangerie) a un espace isole
- Les utilisateurs sont lies a un tenant via `users.tenant_id`
- La RLS (Row Level Security) Supabase garantit l'isolation : un user ne voit jamais les donnees d'un autre tenant
- Chaque tenant a une `api_key` unique pour les integrations externes

---

## API externe

### POST /api/commandes

Permet aux formulaires externes (ex: site client) d'envoyer des commandes.

**Headers requis :**
```
x-api-key: <api_key_du_tenant>
Content-Type: application/json
```

**Body :**
```json
{
  "type": "Gateau de mariage",
  "date_evenement": "2024-06-15",
  "personnes": "80",
  "description": "Gateau 3 etages, vanille et framboise",
  "allergies": "Noix",
  "prenom": "Marie",
  "nom": "Dupont",
  "email": "marie@exemple.fr",
  "telephone": "0612345678"
}
```

**Reponse succes (201) :**
```json
{ "success": true, "id": "uuid-de-la-commande" }
```

---

## Structure du projet

```
tbs-dashboard/
├── app/
│   ├── actions/          # Server Actions (auth, commandes)
│   ├── api/commandes/    # Route API externe
│   ├── dashboard/        # Page principale protegee
│   ├── login/            # Page de connexion
│   └── layout.tsx
├── components/dashboard/ # Composants UI du dashboard
├── lib/
│   ├── supabase/         # Clients Supabase (browser, server, admin)
│   ├── email.ts          # Templates emails Resend
│   └── types.ts          # Types TypeScript
├── supabase/
│   └── migrations/
│       └── 001_init.sql  # Migration SQL complete
├── middleware.ts          # Protection des routes
└── .env.example
```

---

## Deploiement

Compatible Vercel (recommande) :

1. Importer le repo sur [vercel.com](https://vercel.com)
2. Configurer les variables d'environnement
3. `NEXT_PUBLIC_APP_URL` = URL de production

---

## Roadmap

- [ ] Stripe — paiement acompte en ligne
- [ ] Multi-utilisateurs par tenant
- [ ] Calendrier des evenements
- [ ] Notifications push
- [ ] Export PDF des commandes
