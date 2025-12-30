terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }

  # --- ADD THIS BLOCK ---
  backend "azurerm" {
    resource_group_name  = "Gopal-tfstate-rg"
    storage_account_name = "gopalstate87215"
    container_name       = "tfstate"
    key                  = "qa.terraform.tfstate"
    use_oidc             = true
  }
  # ----------------------
}

provider "azurerm" {
  features {}
  use_oidc = true
}