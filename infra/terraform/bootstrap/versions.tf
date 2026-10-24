terraform {
  required_version = ">= 1.9"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 5.11"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.9"
    }
  }

  # État local au premier apply, puis migré dans le compte de stockage créé ici
  # (voir backend.tf.example et docs/deploiement.md).
}

provider "azurerm" {
  features {}

  # Accès aux données du stockage par Entra ID plutôt que par clés partagées (désactivées).
  storage_use_azuread = true
}
