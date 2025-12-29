data "azurerm_client_config" "current" {}

resource "random_password" "pass" {
  length           = 20
  special          = true
  override_special = "_%@"
}

resource "azurerm_private_dns_zone" "dns" {
  name                = "${var.env}.postgres.database.azure.com"
  resource_group_name = var.resource_group_name
}

resource "azurerm_private_dns_zone_virtual_network_link" "dns_link" {
  name                  = "Gopal-dns-link-${var.env}"
  private_dns_zone_name = azurerm_private_dns_zone.dns.name
  virtual_network_id    = var.vnet_id
  resource_group_name   = var.resource_group_name
}

resource "azurerm_postgresql_flexible_server" "psql" {
  name                   = var.server_name
  resource_group_name    = var.resource_group_name
  location               = var.location
  version                = "13"
  delegated_subnet_id    = var.subnet_id
  private_dns_zone_id    = azurerm_private_dns_zone.dns.id
  administrator_login    = "gopaladmin"
  administrator_password = random_password.pass.result
  
  sku_name   = "B_Standard_B1ms"
  storage_mb = 32768
  
  # FIX: Disable public access for private network support
  public_network_access_enabled = false

  # FIX: Ignore zone changes to prevent "Zone can only be changed..." errors
  lifecycle {
    ignore_changes = [
      zone,
      high_availability
    ]
  }

  depends_on = [azurerm_private_dns_zone_virtual_network_link.dns_link]
}

resource "azurerm_postgresql_flexible_server_database" "db" {
  name      = "gopaldb"
  server_id = azurerm_postgresql_flexible_server.psql.id
  collation = "en_US.utf8"
  charset   = "utf8"
}

resource "azurerm_key_vault" "kv" {
  # STANDARD NAME (We purged the old ones, so this is safe now)
  name                = "gopal-kv-${var.env}-eastus2"
  location            = var.location
  resource_group_name = var.resource_group_name
  tenant_id           = data.azurerm_client_config.current.tenant_id
  sku_name            = "standard"

  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = data.azurerm_client_config.current.object_id
    secret_permissions = ["Get", "List", "Set", "Delete", "Purge"]
  }

  # Allow AKS to read the password
  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = var.aks_kubelet_object_id
    secret_permissions = ["Get", "List"]
  }
}

resource "azurerm_key_vault_secret" "db_pass" {
  name         = "db-admin-password"
  value        = random_password.pass.result
  key_vault_id = azurerm_key_vault.kv.id
}