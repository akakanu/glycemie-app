# Glycémie App (MVP)

Application web de suivi de la glycémie : l'utilisateur crée un compte, saisit une mesure en précisant le moment (à jeun, 1 h, 2 h ou 4 h et plus après le repas) et reçoit une interprétation avec des conseils généraux.

> Information générale uniquement. Cette application ne remplace pas un avis médical.

| Partie | Techno | Dossier | État |
|---|---|---|---|
| Backend | ASP.NET Core 8 Web API | `backend/` | Fait |
| Frontend | Angular 21 | `frontend/` | Fonctionnel, style provisoire |
| Base de données | MongoDB Atlas (M0) | n/a | Configurée |
| Design | Claude Design | `design/` | Maquette à intégrer |

## Prérequis

- SDK .NET 8
- Node.js 20+ et Angular CLI (`npm install -g @angular/cli`)
- Un cluster MongoDB Atlas avec un utilisateur de base de données et ton IP autorisée

## Configuration des secrets (backend)

Les secrets ne sont jamais dans le dépôt. En développement, ils sont stockés avec `dotnet user-secrets` (dans ton profil Windows, hors du projet) :

```bash
cd backend/src/GlycemieApi
dotnet user-secrets set "Mongo:ConnectionString" "mongodb+srv://<user>:<motdepasse>@<cluster>.mongodb.net/?retryWrites=true&w=majority"
dotnet user-secrets set "Jwt:Secret" "<au moins 32 caractères aléatoires>"
dotnet user-secrets list
```

Sans ces deux valeurs, l'API refuse de démarrer avec un message explicite.

## Lancer le backend

```bash
cd backend
dotnet test                                   # tests unitaires
dotnet run --project src/GlycemieApi --launch-profile http
```

- Swagger : http://localhost:5070/swagger (bouton **Authorize** pour coller le jeton)
- Requêtes prêtes à l'emploi : `backend/src/GlycemieApi/GlycemieApi.http`
- CORS autorisé pour `http://localhost:4200` (Angular), modifiable dans `appsettings.json`

## Lancer le frontend

Dans un second terminal, avec le backend déjà lancé :

```bash
cd frontend
npm install        # la première fois
npm start          # http://localhost:4200
npm test           # tests unitaires (Vitest)
```

En développement, Angular redirige les appels `/api` vers `http://localhost:5070` (`proxy.conf.json`) : pas de CORS ni d'URL d'API à configurer.

| Route | Page | Accès |
|---|---|---|
| `/` | Accueil | public |
| `/inscription` | Créer un compte | visiteur |
| `/connexion` | Se connecter | visiteur |
| `/mesures/nouvelle` | Saisie d'une mesure | connecté |
| `/mesures/:id` | Résultat et conseils | connecté |
| `/historique` | Historique filtrable | connecté |

Organisation : `src/app/core/` (modèles, services, intercepteur, gardes), `src/app/pages/` (une page par route), `src/app/shared/` (badge de niveau, jauge, avertissement, validateurs). Le style provisoire est dans `src/styles.scss`, avec des tokens CSS en tête de fichier à remplacer par ceux de la maquette.

## API

| Méthode | Route | Auth | Réponse |
|---|---|---|---|
| POST | `/api/auth/register` | non | 201 + jeton, 409 si courriel déjà utilisé |
| POST | `/api/auth/login` | non | 200 + jeton, 401 si identifiants incorrects |
| POST | `/api/readings` | JWT | 201 + mesure interprétée |
| GET | `/api/readings?moment=Fasting` | JWT | Historique (200 dernières, plus récente d'abord) |
| GET | `/api/readings/{id}` | JWT | Détail, 404 si la mesure n'appartient pas à l'utilisateur |

Valeurs de `moment` : `Fasting`, `OneHourAfterMeal`, `TwoHoursAfterMeal`, `FourHoursOrMoreAfterMeal`.

## Grille d'interprétation (mmol/L)

| Moment | Bas | Normal | Élevé | Très élevé |
|---|---|---|---|---|
| À jeun | < 4.0 | 4.0 à 6.0 | 6.1 à 6.9 | ≥ 7.0 |
| 1 h après | < 4.0 | 4.0 à 9.9 | 10.0 à 11.0 | ≥ 11.1 |
| 2 h après | < 4.0 | 4.0 à 7.7 | 7.8 à 11.0 | ≥ 11.1 |
| 4 h et plus | < 4.0 | 4.0 à 6.0 | 6.1 à 6.9 | ≥ 7.0 |

- **Sources** : les seuils à jeun et à 2 h suivent les critères de Diabète Canada. Il n'existe pas de norme officielle à 1 h ni à 4 h et plus : ce sont des valeurs usuelles.
- Les valeurs sont arrondies à une décimale à l'enregistrement.
- Le niveau n'est pas stocké en base : il est recalculé à chaque lecture (`Services/GlycemiaInterpreter.cs`).

## Sécurité

- Mots de passe hachés avec BCrypt (facteur 12)
- Jeton JWT valide 60 minutes
- L'identifiant utilisateur est toujours lu dans le jeton, jamais dans la requête
- Message d'erreur de connexion identique que le courriel existe ou non

## Limites du MVP

Pas de réinitialisation de mot de passe, pas de suppression de compte, pas de graphiques de tendance, une seule grille de seuils pour tous.
