variable "resource_group_name" {
  description = "Groupe de ressources persistant (créé par le bootstrap) qui accueille le cluster éphémère."
  type        = string
  default     = "rg-glycosuivi-prod"
}

variable "shared_resource_group_name" {
  description = "Groupe des ressources partagées (identités, Key Vault, état Terraform)."
  type        = string
  default     = "rg-glycosuivi-shared"
}

variable "api_identity_name" {
  description = "Identité managée utilisée par les pods de l'API (Workload Identity)."
  type        = string
  default     = "id-glycosuivi-api"
}

variable "cluster_name" {
  type    = string
  default = "aks-glycosuivi"
}

variable "kubernetes_version" {
  description = "Version mineure de Kubernetes : AKS applique le dernier correctif disponible."
  type        = string
  default     = "1.36"
}

variable "node_size" {
  description = "Taille du nœud unique. B2s_v2 : 2 vCPU, 8 Go, x86 (B2ms et B2s indisponibles sur l'abonnement d'essai)."
  type        = string
  default     = "Standard_B2s_v2"
}

variable "kubernetes_namespace" {
  description = "Namespace de l'application (doit correspondre à k8s/app/namespace.yaml)."
  type        = string
  default     = "glycosuivi"
}

variable "kubernetes_service_account" {
  description = "Compte de service de l'API (doit correspondre à k8s/app/serviceaccount.yaml)."
  type        = string
  default     = "glycosuivi-api"
}

variable "tags" {
  type = map(string)
  default = {
    project    = "glycosuivi"
    env        = "prod"
    managed_by = "terraform"
    stack      = "env"
    ephemeral  = "true"
  }
}
