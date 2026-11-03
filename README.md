# TBS Dashboard

Application de gestion de commandes sur mesure pour boulangeries et pâtisseries, avec authentification, données organisées par tenant et emails transactionnels.

## Lire le projet en quelques minutes

| Sujet | Point d'entrée |
| --- | --- |
| Logique métier et contrôle du tenant | [`app/actions/commandes.ts`](app/actions/commandes.ts) |
| Réception de demandes externes | [`app/api/commandes/route.ts`](app/api/commandes/route.ts) |
| Modèle de données et politiques RLS | [`supabase/migrations/`](supabase/migrations/) |
| Vérification des clés API | [`lib/api-key.ts`](lib/api-key.ts) |
| Parcours Stripe Connect | [`app/api/stripe/`](app/api/stripe/) et [`lib/stripe.ts`](lib/stripe.ts) |

Le code utilise des filtres `tenant_id` dans les actions serveur et des politiques RLS côté base. L'intégration Stripe Connect est présente dans le dépôt ; son fonctionnement de bout en bout dépend des comptes, secrets et webhooks configurés.

**État du projet :** application en développement. Aucun compte de démonstration public ni suite de tests automatisés ou workflow CI n'est fourni dans le dépôt. Le code et les instructions d'installation constituent les points d'entrée pour une revue technique.

---

## Stack

- **Next.js 15 / React 19** — App Router, TypeScript
- **Tailwind CSS** — Design premium
- **Supabase** — Base de donnees + Auth + RLS multi-tenant
- **Resend** — Emails transactionnels
- **Stripe Connect** — Routes de connexion, callback et webhook ; génération de liens de paiement dans le code

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
2. Dans **SQL Editor**, exécuter les migrations de `supabase/migrations/` dans l’ordre : `001_init.sql`, `002_stripe_connect.sql`, puis `003_api_key_hash.sql`. Lire leurs commentaires avant de les appliquer à une base existante.
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
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_CLIENT_ID=
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
- Les politiques RLS (Row Level Security) Supabase filtrent les accès par tenant ; leur comportement doit être vérifié avec plusieurs comptes sur la base configurée
- Chaque tenant dispose d’une clé API pour les intégrations externes. Le code prend en charge des hashes bcrypt et conserve un fallback vers les anciennes clés en clair pour compatibilité.

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

- [x] Code Stripe Connect et génération de liens de paiement
- [ ] Validation du parcours Stripe de bout en bout en environnement de test
- [ ] Tests automatisés d’isolation entre tenants et des actions métier
- [ ] Intégration continue et limitation de débit de l’API
- [ ] Multi-utilisateurs par tenant
- [ ] Calendrier des evenements
- [ ] Notifications push
- [ ] Export PDF des commandes


## Points à renforcer

L’ancien [`AUDIT.md`](AUDIT.md) décrit un état historique : ses constats et résultats de commandes ne représentent pas automatiquement la version actuelle. La génération des clés API utilise encore `Math.random()` et la vérification accepte l'ancien stockage en clair. Ces points, la limitation de débit et les tests d'isolation doivent être traités avant de présenter le projet comme prêt pour la production.

Les instructions ci-dessus décrivent la configuration attendue ; cette mise à jour de documentation ne constitue pas une validation du déploiement ou du parcours de paiement.
