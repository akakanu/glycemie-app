# Identifiants (pas des secrets) à reporter dans les variables du dépôt GitHub.

output "github_variables" {
  description = "Variables à créer dans GitHub (Settings > Secrets and variables > Actions > Variables)."
  value = {
    AZURE_CLIENT_ID         = azurerm_user_assigned_identity.github.client_id
    AZURE_PLAN_CLIENT_ID    = azurerm_user_assigned_identity.plan.client_id
    AZURE_TENANT_ID         = data.azurerm_client_config.current.tenant_id
    AZURE_SUBSCRIPTION_ID   = data.azurerm_subscription.current.subscription_id
    API_CLIENT_ID           = azurerm_user_assigned_identity.api.client_id
    KEYVAULT_NAME           = azurerm_key_vault.main.name
    TFSTATE_RESOURCE_GROUP  = azurerm_resource_group.shared.name
    TFSTATE_STORAGE_ACCOUNT = azurerm_storage_account.tfstate.name
  }
}

output "keyvault_name" {
  value = azurerm_key_vault.main.name
}

output "tfstate_storage_account" {
  value = azurerm_storage_account.tfstate.name
}
