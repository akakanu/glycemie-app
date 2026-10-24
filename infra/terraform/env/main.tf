# Partie ÉPHÉMÈRE de l'infrastructure : créée au début de chaque session (env-up),
# détruite à la fin (env-down, et chaque nuit par sécurité).

data "azurerm_resource_group" "prod" {
  name = var.resource_group_name
}

data "azurerm_user_assigned_identity" "api" {
  name                = var.api_identity_name
  resource_group_name = var.shared_resource_group_name
}

resource "azurerm_kubernetes_cluster" "main" {
  name                = var.cluster_name
  location            = data.azurerm_resource_group.prod.location
  resource_group_name = data.azurerm_resource_group.prod.name
  dns_prefix          = "glycosuivi"
  kubernetes_version  = var.kubernetes_version
  sku_tier            = "Free"

  # Groupe des ressources techniques d'AKS (VM, disques, load balancer, IP) : nommé explicitement,
  # il est supprimé avec le cluster.
  node_resource_group = "${var.resource_group_name}-nodes"

  # Cluster de quelques heures : pas de mises à jour automatiques en cours de session.
  node_os_upgrade_channel = "None"

  # Workload Identity : les pods de l'API obtiennent un jeton Azure sans aucun secret.
  oidc_issuer_enabled       = true
  workload_identity_enabled = true

  role_based_access_control_enabled = true

  default_node_pool {
    name                        = "system"
    vm_size                     = var.node_size
    node_count                  = 1
    os_disk_size_gb             = 30
    temporary_name_for_rotation = "tmp"

    upgrade_settings {
      max_surge = "1"
    }
  }

  # Provisionnement classique par pool de nœuds (pas de Node Auto Provisioning / Karpenter) :
  # un seul nœud fixe, pour un coût prévisible.
  node_provisioning_profile {
    mode = "Manual"
  }

  identity {
    type = "SystemAssigned"
  }

  network_profile {
    network_plugin      = "azure"
    network_plugin_mode = "overlay"
    load_balancer_sku   = "standard"
    outbound_type       = "loadBalancer"
  }

  # Driver CSI Key Vault : synchronise les secrets dans le Secret Kubernetes glycosuivi-api-secrets.
  key_vault_secrets_provider {
    secret_rotation_enabled = true
  }

  tags = var.tags
}

# Fédère l'identité api avec le compte de service Kubernetes de CE cluster
# (l'émetteur OIDC change à chaque création).
resource "azurerm_federated_identity_credential" "api" {
  name                      = var.cluster_name
  user_assigned_identity_id = data.azurerm_user_assigned_identity.api.id
  issuer                    = azurerm_kubernetes_cluster.main.oidc_issuer_url
  audience                  = ["api://AzureADTokenExchange"]
  subject                   = "system:serviceaccount:${var.kubernetes_namespace}:${var.kubernetes_service_account}"
}
