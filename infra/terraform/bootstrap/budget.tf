# Alerte de budget sur tout l'abonnement : prévient avant que les crédits ne fondent.
resource "azurerm_consumption_budget_subscription" "main" {
  count = var.enable_budget ? 1 : 0

  name            = "budget-glycosuivi"
  subscription_id = data.azurerm_subscription.current.id
  amount          = var.budget_amount
  time_grain      = "Monthly"

  time_period {
    start_date = var.budget_start_date
  }

  dynamic "notification" {
    for_each = [50, 80, 100]
    content {
      enabled        = true
      threshold      = notification.value
      threshold_type = "Actual"
      operator       = "GreaterThanOrEqualTo"
      contact_emails = [var.alert_email]
    }
  }

  lifecycle {
    # Azure ajuste la date de début : on ne la réécrit pas à chaque apply.
    ignore_changes = [time_period]
  }
}
