terraform {
  required_version = ">= 1.9"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 5.11"
    }
  }

  # Backend partiel : le groupe de ressources et le compte de stockage sont fournis à l'init
  # (-backend-config), à partir des variables GitHub TFSTATE_RESOURCE_GROUP et TFSTATE_STORAGE_ACCOUNT.
  backend "azurerm" {
    container_name   = "tfstate"
    key              = "env.tfstate"
    use_azuread_auth = true
  }
}

provider "azurerm" {
  features {}

  # L'identité GitHub n'a aucun droit au niveau de l'abonnement :
  # les fournisseurs de ressources ont été enregistrés une fois, à la main (phase 0).
  resource_provider_registrations = "none"
}
