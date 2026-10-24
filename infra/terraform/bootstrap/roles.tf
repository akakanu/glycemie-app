# Droits minimaux de chaque identité (principe du moindre privilège).

locals {
  role_assignments = {
    # GitHub : gère l'environnement éphémère dans rg-glycosuivi-prod...
    github_prod_contributor = {
      scope     = azurerm_resource_group.prod.id
      role      = "Contributor"
      principal = azurerm_user_assigned_identity.github.principal_id
    }
    # ... lit les ressources partagées (identité api, Key Vault) comme sources de données...
    github_shared_reader = {
      scope     = azurerm_resource_group.shared.id
      role      = "Reader"
      principal = azurerm_user_assigned_identity.github.principal_id
    }
    # ... crée la fédération de l'identité api avec chaque nouveau cluster AKS...
    github_api_identity = {
      scope     = azurerm_user_assigned_identity.api.id
      role      = "Managed Identity Contributor"
      principal = azurerm_user_assigned_identity.github.principal_id
    }
    # ... lit et écrit l'état Terraform...
    github_tfstate = {
      scope     = azurerm_storage_container.tfstate.id
      role      = "Storage Blob Data Contributor"
      principal = azurerm_user_assigned_identity.github.principal_id
    }
    # ... et sauvegarde le certificat TLS dans Key Vault entre deux sessions.
    github_keyvault = {
      scope     = azurerm_key_vault.main.id
      role      = "Key Vault Secrets Officer"
      principal = azurerm_user_assigned_identity.github.principal_id
    }

    # Plan (pull requests) : lecture seule partout.
    plan_prod_reader = {
      scope     = azurerm_resource_group.prod.id
      role      = "Reader"
      principal = azurerm_user_assigned_identity.plan.principal_id
    }
    plan_shared_reader = {
      scope     = azurerm_resource_group.shared.id
      role      = "Reader"
      principal = azurerm_user_assigned_identity.plan.principal_id
    }
    plan_tfstate = {
      scope     = azurerm_storage_container.tfstate.id
      role      = "Storage Blob Data Reader"
      principal = azurerm_user_assigned_identity.plan.principal_id
    }

    # API : lit uniquement les valeurs des secrets.
    api_keyvault = {
      scope     = azurerm_key_vault.main.id
      role      = "Key Vault Secrets User"
      principal = azurerm_user_assigned_identity.api.principal_id
    }

    # Alaxe : saisit les secrets et migre l'état du bootstrap dans le stockage.
    owner_keyvault = {
      scope     = azurerm_key_vault.main.id
      role      = "Key Vault Secrets Officer"
      principal = data.azurerm_client_config.current.object_id
    }
    owner_tfstate = {
      scope     = azurerm_storage_account.tfstate.id
      role      = "Storage Blob Data Contributor"
      principal = data.azurerm_client_config.current.object_id
    }
  }
}

resource "azurerm_role_assignment" "this" {
  for_each = local.role_assignments

  scope                = each.value.scope
  role_definition_name = each.value.role
  principal_id         = each.value.principal
}
