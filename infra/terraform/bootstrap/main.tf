# Partie PERSISTANTE de l'infrastructure (coût quasi nul) :
# état Terraform, Key Vault, identités et groupe de ressources prod (vide entre deux sessions).
# Lancée une seule fois, en local, avec le compte d'Alaxe (az login).

data "azurerm_client_config" "current" {}

data "azurerm_subscription" "current" {}

# Suffixe aléatoire stable : les noms de stockage et de Key Vault doivent être uniques dans tout Azure.
resource "random_string" "suffix" {
  length  = 6
  upper   = false
  special = false
}

locals {
  suffix = random_string.suffix.result
}

resource "azurerm_resource_group" "shared" {
  name     = "rg-glycosuivi-shared"
  location = var.location
  tags     = var.tags
}

# Groupe de l'environnement éphémère : il reste vide entre deux sessions.
# Le créer ici permet de limiter les droits de GitHub à ce seul groupe.
resource "azurerm_resource_group" "prod" {
  name     = "rg-glycosuivi-prod"
  location = var.location
  tags     = merge(var.tags, { env = "prod" })
}

# --- État Terraform ---

resource "azurerm_storage_account" "tfstate" {
  name                     = "stglycosuivitf${local.suffix}"
  resource_group_name      = azurerm_resource_group.shared.name
  location                 = azurerm_resource_group.shared.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  min_tls_version          = "TLS1_2"

  # Pas de clés partagées ni d'accès anonyme : uniquement Entra ID.
  shared_access_key_enabled       = false
  default_to_oauth_authentication = true
  allow_nested_items_to_be_public = false

  blob_properties {
    versioning_enabled = true

    delete_retention_policy {
      days = 7
    }

    container_delete_retention_policy {
      days = 7
    }
  }

  tags = var.tags
}

resource "azurerm_storage_container" "tfstate" {
  name                  = "tfstate"
  storage_account_id    = azurerm_storage_account.tfstate.id
  container_access_type = "private"
}

# --- Secrets applicatifs ---

resource "azurerm_key_vault" "main" {
  name                       = "kv-glycosuivi-${local.suffix}"
  resource_group_name        = azurerm_resource_group.shared.name
  location                   = azurerm_resource_group.shared.location
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "standard"
  rbac_authorization_enabled = true
  soft_delete_retention_days = 7
  purge_protection_enabled   = false
  tags                       = var.tags
}
