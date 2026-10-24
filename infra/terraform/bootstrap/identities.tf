# Trois identités managées, sans aucun mot de passe :
# - github : utilisée par les workflows GitHub Actions (création et destruction de l'environnement) ;
# - plan   : lecture seule, pour les terraform plan des pull requests ;
# - api    : utilisée par les pods de l'API pour lire Key Vault (fédérée avec AKS à chaque session).

resource "azurerm_user_assigned_identity" "github" {
  name                = "id-glycosuivi-github"
  resource_group_name = azurerm_resource_group.shared.name
  location            = azurerm_resource_group.shared.location
  tags                = var.tags
}

resource "azurerm_user_assigned_identity" "plan" {
  name                = "id-glycosuivi-plan"
  resource_group_name = azurerm_resource_group.shared.name
  location            = azurerm_resource_group.shared.location
  tags                = var.tags
}

resource "azurerm_user_assigned_identity" "api" {
  name                = "id-glycosuivi-api"
  resource_group_name = azurerm_resource_group.shared.name
  location            = azurerm_resource_group.shared.location
  tags                = var.tags
}

# --- Fédération OIDC avec GitHub : un jeton GitHub signé remplace tout secret ---

locals {
  github_issuer   = "https://token.actions.githubusercontent.com"
  github_audience = ["api://AzureADTokenExchange"]

  # Format « immuable » des jetons GitHub (use_immutable_subject) : il inclut les identifiants numériques
  # du propriétaire et du dépôt. Un dépôt supprimé puis recréé sous le même nom n'hérite donc pas des accès.
  # Ex. repo:akakanu@74557945/glycemie-app@1409058393:environment:production
  github_owner          = split("/", var.github_repository)[0]
  github_repo           = split("/", var.github_repository)[1]
  github_subject_prefix = "repo:${local.github_owner}@${var.github_owner_id}/${local.github_repo}@${var.github_repository_id}"
}

# Workflows qui ciblent l'environnement GitHub « production » (env-up, env-down, deploy).
resource "azurerm_federated_identity_credential" "github_production" {
  name                      = "github-environment-production"
  user_assigned_identity_id = azurerm_user_assigned_identity.github.id
  issuer                    = local.github_issuer
  audience                  = local.github_audience
  subject                   = "${local.github_subject_prefix}:environment:production"
}

# Pull requests : identité en lecture seule uniquement.
resource "azurerm_federated_identity_credential" "plan_pull_request" {
  name                      = "github-pull-request"
  user_assigned_identity_id = azurerm_user_assigned_identity.plan.id
  issuer                    = local.github_issuer
  audience                  = local.github_audience
  subject                   = "${local.github_subject_prefix}:pull_request"
}
