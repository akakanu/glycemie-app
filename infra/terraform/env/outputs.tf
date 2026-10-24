output "cluster_name" {
  value = azurerm_kubernetes_cluster.main.name
}

output "resource_group_name" {
  value = azurerm_kubernetes_cluster.main.resource_group_name
}

output "node_resource_group" {
  value = azurerm_kubernetes_cluster.main.node_resource_group
}

output "kubernetes_version" {
  value = azurerm_kubernetes_cluster.main.current_kubernetes_version
}
