# Hamed Telecom — Système de Gestion de Magasin

Application de gestion multi-boutiques pour magasin d'électronique/télécom : produits, ventes, clients, stock, fournisseurs, transferts entre boutiques, dépenses et rapports financiers.

Le projet est composé de deux parties :

- **`backend/`** — API REST développée avec **Laravel 13** (PHP 8.3)
- **`frontend/`** — Application web développée avec **React 19 + TypeScript** (Vite)

---

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Architecture](#architecture)
- [Installation](#installation)
- [Rôles & accès](#rôles--accès)
- [Structure du projet](#structure-du-projet)
- [Scripts utiles](#scripts-utiles)

---

## Fonctionnalités

### Gestion multi-boutiques
- Création et administration de plusieurs boutiques par un **Super Admin**
- Isolation des données par boutique (scoping automatique via middleware)
- Tableau de bord global (toutes boutiques) et tableau de bord par boutique

### Produits & Stock
- Catalogue de produits avec **variantes** (couleur, capacité, etc.)
- Entrées de stock, ajustements, historique des mouvements
- Alertes de stock bas

### Ventes
- Enregistrement des ventes avec plusieurs lignes/produits
- Paiements de vente (y compris paiements partiels), validation et annulation de vente
- Reçu imprimable

### Clients
- Fiche client, historique des paiements
- Gestion des dettes (dettes courantes et dettes initiales) avec paiements échelonnés
- Avances clients

### Fournisseurs & Approvisionnement
- Fiches fournisseurs
- Bons d'approvisionnement (achats) avec suivi des paiements fournisseurs

### Transferts entre boutiques
- Transfert de stock d'une boutique vers une autre
- Suivi des paiements liés aux transferts

### Retours
- Enregistrement des retours produits avec détails par ligne

### Dépenses
- Suivi des dépenses par boutique

### Rapports
- Chiffre d'affaires, stock, dettes, dépenses
- Rapport consolidé (toutes boutiques, réservé au Super Admin)
- Export des rapports (Excel / PDF)

### Administration
- Gestion des utilisateurs et des rôles par boutique
- Réinitialisation de mot de passe
- Journal d'activité et **journal d'audit** (global et par boutique)
- Référentiels et paramètres configurables par boutique

---

## Stack technique

### Backend (`backend/`)
| Composant | Détail |
|---|---|
| Framework | Laravel 13 (PHP ^8.3) |
| Authentification API | Laravel Sanctum (tokens) |
| Export Excel | maatwebsite/excel |
| Génération PDF | barryvdh/laravel-dompdf |
| Base de données | SQLite par défaut (configurable via `.env`) |
| Tests | PHPUnit / Pest |

### Frontend (`frontend/`)
| Composant | Détail |
|---|---|
| Framework | React 19 + TypeScript |
| Build tool | Vite |
| Routing | React Router 7 |
| UI | Tailwind CSS 4, Radix UI / shadcn |
| Formulaires | React Hook Form |
| Graphiques | Recharts |
| HTTP client | Axios |
| Notifications | Sonner |
| Impression | react-to-print |
| PWA | vite-plugin-pwa (application installable) |

---

## Architecture

L'API Laravel expose des routes REST sous `/api`, protégées par trois middlewares combinés :

- **`auth:sanctum`** — authentification par token
- **`role:...`** — restreint l'accès selon le rôle de l'utilisateur (`super_admin`, `admin_boutique`, `vendeur`)
- **`scope.boutique`** — isole automatiquement les données à la boutique de l'utilisateur (ou à la boutique sélectionnée via l'en-tête `X-Boutique-ID` pour un Super Admin)
- **`audit`** — journalise les actions sensibles

Côté frontend, chaque requête Axios ajoute automatiquement :
- le token d'authentification (`Authorization: Bearer ...`)
- la boutique active sélectionnée (`X-Boutique-ID`), stockée en `localStorage`

---

## Installation

### Prérequis
- PHP >= 8.3, Composer
- Node.js (version récente), npm
- Extension PHP SQLite (ou MySQL/PostgreSQL si vous adaptez la config DB)

### 1. Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate

# Créer la base de données SQLite (si non existante)
touch database/database.sqlite

# Exécuter les migrations et créer le Super Admin par défaut
php artisan migrate --seed

# Lancer le serveur de développement
php artisan serve
```

> Le seeder `SuperAdminSeeder` crée un compte Super Admin par défaut :
> - **Pseudo** : `superadmin`
> - **Mot de passe** : `admin1234`
>
> ⚠️ Pensez à changer ce mot de passe immédiatement après la première connexion, notamment en production.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

L'URL de l'API est configurée dans `frontend/src/api/axios.ts`. Par défaut elle pointe vers une instance de production ; pour développer en local, adaptez `baseURL` :

```ts
const api = axios.create({
  baseURL: 'http://localhost:8000/api', // adapter selon le port de `php artisan serve`
  // ...
})
```

---

## Rôles & accès

| Rôle | Portée | Accès |
|---|---|---|
| `super_admin` | Toutes les boutiques | Création/gestion des boutiques, rapport & dashboard consolidés, audit global, sélection de la boutique active via l'en-tête `X-Boutique-ID` |
| `admin_boutique` | Sa boutique | Gestion des produits, ventes, clients, dépenses, fournisseurs, transferts, utilisateurs, paramètres, rapports et audit de sa boutique |
| `vendeur` | Sa boutique | Ventes, produits/stock, clients, retours, transferts (accès opérationnel, sans gestion des paramètres/rapports avancés) |

---

## Structure du projet

```
.
├── backend/                   # API Laravel
│   ├── app/
│   │   ├── Http/Controllers/Api/   # Contrôleurs REST (Ventes, Produits, Clients, Rapports, ...)
│   │   ├── Http/Middleware/        # CheckRole, ScopeBoutique, AuditLogger
│   │   └── Models/                 # Boutique, Produit, Variante, Vente, Client, ...
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   └── routes/api.php         # Déclaration des routes API
│
└── frontend/                  # Application React
    └── src/
        ├── api/                # Appels HTTP par domaine (ventes, produits, clients, ...)
        ├── components/         # Composants partagés et UI (shadcn)
        ├── contexts/           # Contextes React (auth, boutique active, ...)
        ├── pages/              # Pages par module (ventes, produits, clients, rapports, ...)
        └── utils/              # Fonctions utilitaires (formatage, constantes)
```

---

## Scripts utiles

### Backend
```bash
php artisan test          # Lancer les tests
php artisan migrate:fresh --seed   # Réinitialiser la base de données
```

### Frontend
```bash
npm run dev       # Serveur de développement
npm run build     # Build de production (tsc + vite build)
npm run lint       # Linter ESLint
npm run preview   # Prévisualiser le build de production
```