variable "location" {
  description = "Région Azure (Canada Est : seule région canadienne avec des VM x86 B-series disponibles sur l'abonnement d'essai)."
  type        = string
  default     = "canadaeast"
}

variable "github_repository" {
  description = "Dépôt GitHub autorisé à se connecter à Azure en OIDC (propriétaire/nom)."
  type        = string
  default     = "akakanu/glycemie-app"
}

variable "github_owner_id" {
  description = "Identifiant numérique du propriétaire du dépôt (GET /repos/{owner}/{repo} > owner.id)."
  type        = number
  default     = 74557945
}

variable "github_repository_id" {
  description = "Identifiant numérique du dépôt (GET /repos/{owner}/{repo} > id)."
  type        = number
  default     = 1409058393
}

variable "alert_email" {
  description = "Courriel des alertes de budget. Passé en variable d'environnement (TF_VAR_alert_email), jamais commité."
  type        = string
  sensitive   = true
}

variable "budget_amount" {
  description = "Seuil mensuel de l'alerte de budget, en dollars US."
  type        = number
  default     = 10
}

variable "budget_start_date" {
  description = "Premier jour du mois de départ du budget (format RFC 3339)."
  type        = string
  default     = "2026-10-01T00:00:00Z"
}

variable "enable_budget" {
  description = "Crée l'alerte de budget. À passer à false si l'offre d'essai ne prend pas en charge les budgets."
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags appliqués à toutes les ressources."
  type        = map(string)
  default = {
    project    = "glycosuivi"
    managed_by = "terraform"
    stack      = "bootstrap"
  }
}
