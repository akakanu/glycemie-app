# Déploiement de GlycoSuivi sur Azure

Ce document décrit comment GlycoSuivi est déployé sur Azure, comment s'en servir au quotidien et comment résoudre les problèmes déjà rencontrés.

**Principe :** l'environnement de production est **éphémère**. Le cluster Kubernetes n'existe que pendant les sessions de travail : il est créé par `env-up`, puis détruit par `env-down`, ou automatiquement chaque nuit. Entre deux sessions, il ne reste que des ressources qui ne coûtent presque rien.

---

## 1. Architecture

```
                        ┌──────────────── GitHub ────────────────┐
 push / PR ───────────► │ ci.yml       tests, build, scan, push   │──► ghcr.io/akakanu/glycemie-app/{api,web}
                        │ env-up.yml   (manuel) crée et déploie   │
                        │ deploy.yml   (après CI sur main)         │──OIDC──► Azure (aucun mot de passe)
                        │ env-down.yml (manuel + chaque nuit)      │
                        └─────────────────────────────────────────┘

 Azure, Canada Est
 ┌─ rg-glycosuivi-shared (PERSISTANT, ~0 $) ────────────────────────────────┐
 │  Stockage de l'état Terraform                                            │
 │  Key Vault : mongo-connection-string, jwt-secret, tls-backup             │
 │  Identités : id-glycosuivi-github, id-glycosuivi-plan, id-glycosuivi-api │
 └──────────────────────────────────────────────────────────────────────────┘
 ┌─ rg-glycosuivi-prod (PERSISTANT, VIDE entre deux sessions) ──────────────┐
 │  ÉPHÉMÈRE : AKS aks-glycosuivi, 1 nœud Standard_B2s_v2                   │
 │    traefik       Traefik (Gateway API) + IP publique + label DNS         │
 │    cert-manager  certificats Let's Encrypt                               │
 │    glycosuivi    Gateway HTTPS ─ /api ─► api (2 pods) ─► Key Vault       │
 │                                └ /    ─► web (nginx)                      │
 └──────────────────────────────────────────────────────────────────────────┘
          │ IP de sortie (change à chaque création)
          ▼
 MongoDB Atlas (Azure Toronto) : base glycemie-prod, IP autorisée 24 h via l'API
```

| Brique | Choix | Pourquoi |
|---|---|---|
| Registre d'images | GitHub Container Registry | Gratuit pour un dépôt public |
| Kubernetes | AKS, tier Free, 1 nœud B2s_v2 | Le moins cher possible. B2ms et B2s ne sont pas disponibles sur l'abonnement d'essai |
| Ingress | Traefik 3.7 + Gateway API v1.6.3 | L'add-on NGINX d'AKS perd son support en novembre 2026. Son successeur (Istio) est trop lourd pour un seul nœud |
| Certificats | cert-manager + Let's Encrypt (HTTP-01) | Gratuit. Le certificat est sauvegardé entre les sessions (limite : 5 certificats identiques par semaine) |
| Secrets | Key Vault + driver CSI + Workload Identity | Aucun secret dans le dépôt, dans Terraform ni dans GitHub (sauf la clé API Atlas) |
| Accès GitHub vers Azure | OIDC (identités fédérées) | Aucun mot de passe Azure stocké dans GitHub |
| Infrastructure | Terraform (azurerm 5.x) | Deux stacks : `bootstrap` (persistant) et `env` (éphémère) |

## 2. Routine d'une session de travail

| # | Action | Durée |
|---|---|---|
| 1 | GitHub, puis **Actions**, **env-up** et **Run workflow** (`tls` = `prod`) | ~6 min (cluster neuf) |
| 2 | Travailler : chaque push sur `main` est testé par `ci`, puis redéployé par `deploy` | ~8 min par push |
| 3 | GitHub, puis **Actions**, **env-down** et **Run workflow** | ~7 min |

L'URL est https://glycosuivi.canadaeast.cloudapp.azure.com. Elle ne répond **que pendant une session**.

Si tu oublies `env-down`, il se lance tout seul chaque nuit à 3 h (heure du Québec). L'accès à Atlas, lui, expire de toute façon après 24 h.

`env-up` accepte deux paramètres :
- `image_tag` : vide par défaut, c'est alors le dernier commit de `main`. Exemple : `sha-1a2b3c4`.
- `tls` : `prod` (vrai certificat) ou `staging` (certificat de test, non reconnu par les navigateurs, mais sans quota). À utiliser pour mettre au point sans consommer le quota de Let's Encrypt.

## 3. Coûts

| Poste | Quand | Coût |
|---|---|---|
| Nœud B2s_v2, disque, load balancer, IP publique | Pendant une session | ~0,12 $ US par heure |
| Stockage de l'état Terraform, Key Vault | Toujours | < 0,10 $ US par mois |
| GHCR, GitHub Actions | Toujours | 0 $ (dépôt public) |

Abonnement **Azure Free Trial** : 200 $ US de crédit, plafond de dépense actif, valable 30 jours (jusqu'au 22 novembre 2026 environ). Une alerte de budget envoie un courriel à 50, 80 et 100 % de 10 $ US par mois.

Garde-fous contre une dépense oubliée :
- le plafond de dépense de l'essai ;
- `env-down` chaque nuit ;
- le contrôle « groupe vide » à la fin d'`env-down` ;
- l'alerte de budget.

**Après le 30e jour**, trois options :
- passer en pay-as-you-go, à quelques sous par session ;
- passer à Azure for Students ;
- faire une pause. Dans ce cas, on peut détruire aussi le bootstrap avec `terraform destroy` dans `infra/terraform/bootstrap`.

## 4. Installation depuis zéro

À ne faire qu'une fois. Tout a déjà été fait pour ce dépôt. Cette section sert à reconstruire l'environnement, ou à comprendre comment il a été construit.

### 4.1 Prérequis sur le poste

```powershell
winget install Microsoft.AzureCLI
winget install Helm.Helm
az aks install-cli          # kubectl et kubelogin
az login
```

Terraform 1.9 ou plus récent est aussi nécessaire. Docker n'est **pas** nécessaire sur le poste : les images sont construites par GitHub Actions. Pour tester des conteneurs à la main, ouvre le dépôt dans GitHub Codespaces (fichier `.devcontainer/`).

Enregistrer une fois les fournisseurs de ressources : `Microsoft.ContainerService`, `Microsoft.KeyVault`, `Microsoft.ManagedIdentity`, `Microsoft.Storage`, `Microsoft.Network`, `Microsoft.Compute`, `Microsoft.OperationalInsights` et `Microsoft.Consumption`.

### 4.2 Terraform bootstrap (persistant)

```powershell
cd infra/terraform/bootstrap
$env:ARM_SUBSCRIPTION_ID = (az account show --query id -o tsv)
$env:TF_VAR_alert_email = "ton@courriel"
terraform init
terraform apply
```

Ensuite, on migre l'état dans le compte de stockage créé par l'apply :
1. copier `backend.tf.example` en `backend.tf` ;
2. y remplacer `<compte>` par la sortie `tfstate_storage_account` ;
3. lancer `terraform init -migrate-state` ;
4. supprimer le `terraform.tfstate` local.

`terraform output github_variables` donne les valeurs des variables GitHub de la section 4.4.

### 4.3 Secrets de l'application dans Key Vault

> ⚠️ **Sous Windows, ne passe jamais un secret par `--value`** : `az` est un fichier `.cmd`, et les caractères `&` d'une chaîne MongoDB la coupent, même entre apostrophes dans PowerShell. Passe par un fichier :

```powershell
$f = New-TemporaryFile
Set-Content -Path $f -NoNewline -Encoding ascii -Value 'mongodb+srv://glycosuivi-prod:MOT_DE_PASSE@cluster0.xxxxxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
az keyvault secret set --vault-name <keyvault> -n mongo-connection-string --file $f --encoding utf-8 --output none
Remove-Item $f

# Clé JWT : générateur cryptographique (pas Get-Random)
$b = New-Object byte[] 48; [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b)
$f = New-TemporaryFile; Set-Content -Path $f -NoNewline -Encoding ascii -Value ([Convert]::ToBase64String($b))
az keyvault secret set --vault-name <keyvault> -n jwt-secret --file $f --encoding utf-8 --output none
Remove-Item $f
```

### 4.4 MongoDB Atlas

1. **Utilisateur de base** `glycosuivi-prod` : rôle intégré **`readWrite` sur la base `glycemie-prod`**, avec le champ *Collection* **vide**. Dans la liste des utilisateurs, la colonne *MongoDB Roles* doit afficher `readWrite@glycemie-prod`, et non `readWrite@glycemie-prod.quelquechose`. Ce dernier format veut dire que le rôle est limité à une seule collection.
2. **Clé API de projet** : Project Identity & Access, puis Applications, API Keys et Create API Key, avec le seul rôle **Project Network Access Manager**. Laisse son *API Access List* vide, ou mets `0.0.0.0/0`, car les runners GitHub changent d'IP.

### 4.5 Configuration GitHub

- **Environnement** `production`, limité à la branche `main`.
- **Variables** : `AZURE_CLIENT_ID`, `AZURE_PLAN_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, `API_CLIENT_ID`, `KEYVAULT_NAME`, `TFSTATE_RESOURCE_GROUP`, `TFSTATE_STORAGE_ACCOUNT`, `ATLAS_PROJECT_ID` et `LETSENCRYPT_EMAIL`.
- **Secrets** : `ATLAS_PUBLIC_KEY` et `ATLAS_PRIVATE_KEY`.
- **Règle de protection de `main`** :
  - PR obligatoire ;
  - 7 vérifications de la CI obligatoires ;
  - ni force-push ni suppression.

## 5. Fichiers de référence

| Fichier | Rôle |
|---|---|
| `.github/workflows/ci.yml` | Tests, build et scan Trivy des images, kubeconform, Terraform, ShellCheck et actionlint. Publication GHCR sur `main` |
| `.github/workflows/env-up.yml` | Crée l'environnement et déploie |
| `.github/workflows/env-down.yml` | Détruit l'environnement (manuel et chaque nuit) |
| `.github/workflows/deploy.yml` | Redéploie après la CI, retour arrière automatique en cas d'échec |
| `infra/terraform/bootstrap/` | Ressources persistantes |
| `infra/terraform/env/` | Cluster AKS et fédération de l'identité `api` |
| `k8s/platform/` | Versions et valeurs Helm de Traefik et cert-manager, émetteurs Let's Encrypt |
| `k8s/app/` | Namespace, API, web, Gateway et routes, SecretProviderClass |
| `scripts/` | Logique des workflows (Atlas, IP de sortie, certificat, plateforme, déploiement, tests de fumée, diagnostic) |

## 6. Dépannage

Tous ces problèmes ont été rencontrés lors des premières sessions.

| Symptôme | Cause | Solution |
|---|---|---|
| `AADSTS700213: No matching federated identity record` | GitHub utilise le format de sujet OIDC **immuable** : `repo:akakanu@<id>/glycemie-app@<id>:environment:production` | Les sujets sont construits à partir de `github_owner_id` et `github_repository_id` dans `bootstrap/variables.tf` |
| `helm upgrade` de cert-manager : *conflict with "admissionsenforcer"* | AKS modifie le `namespaceSelector` des webhooks. Helm 4 (server-side apply) refuse alors d'écraser ce champ | Les sélecteurs d'AKS sont déclarés à l'identique dans `cert-manager-values.yaml` |
| L'API ne démarre pas, log `Servers : []` | Hôte Atlas incomplet dans la chaîne (`cluster0.mongodb.net` au lieu de `cluster0.xxxxxxx.mongodb.net`) | Corriger `mongo-connection-string` dans Key Vault (section 4.3), puis `kubectl rollout restart deployment/api -n glycosuivi` |
| `user is not allowed to do action [createIndex]` | Rôle Atlas trop restreint, ou limité à une collection | Section 4.4, étape 1 |
| `/health/ready` répond 503 | MongoDB injoignable **ou** authentification refusée (la sonde utilise `listCollections`, qui exige l'authentification) | `kubectl logs deployment/api -n glycosuivi` |
| Étape Atlas : `HTTP 401` ou `403` | Clé API sans le bon rôle, ou liste d'IP de la clé trop restrictive | Section 4.4, étape 2 |
| Tests de fumée : 404 juste après le certificat | Traefik charge les routes HTTPS quelques secondes après l'émission | Déjà géré : les tests réessaient pendant 2 minutes |
| `env-down` : « Ressources encore présentes » | Délai de l'index Azure juste après une suppression | Déjà géré : le contrôle réessaie pendant 3 minutes. Si l'erreur persiste, regarde le portail |
| Certificat bloqué (`kubectl get certificate -A` non prêt) | Quota Let's Encrypt atteint, ou DNS pas encore propagé | `kubectl describe challenge -A`. Relancer `env-up` avec `tls=staging` pour vérifier le reste |
| Pod en `CrashLoopBackOff` | Configuration ou secret manquant | `scripts/diagnose.sh` (lancé automatiquement par les workflows en cas d'échec) |
| Terraform : *state lock* | Un workflow a été interrompu pendant un apply ou un destroy | `terraform force-unlock <id>` dans la stack concernée, en local |

Pour inspecter le cluster depuis le poste pendant une session :

```powershell
az aks get-credentials --admin -g rg-glycosuivi-prod -n aks-glycosuivi --overwrite-existing
kubectl get pods -A
kubectl get gateway,httproute,certificate -n glycosuivi
```
