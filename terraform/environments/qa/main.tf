# 1. Create the Resource Group for QA
resource "azurerm_resource_group" "rg" {
  name     = "Gopal-rg-qa-eastus2"
  location = "eastus2"
}

# 2. Network Module
module "network" {
  source = "../../modules/network"

  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  vnet_name           = "Gopal-vnet-qa-eastus2"
  address_space       = "10.0.0.0/16"
  aks_subnet_prefix   = "10.0.1.0/24"
  db_subnet_prefix    = "10.0.2.0/24"
}

# 3. AKS Module (Cluster)
module "aks" {
  source = "../../modules/aks"

  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  cluster_name        = "Gopal-aks-qa-eastus2"
  dns_prefix          = "gopal-aks-qa"
  subnet_id           = module.network.aks_subnet_id
  
  # PASS THE ACR ID HERE
  acr_id              = module.acr.acr_id
}

# 4. Database Module
module "database" {
  source = "../../modules/database"

  resource_group_name   = azurerm_resource_group.rg.name
  location              = azurerm_resource_group.rg.location
  server_name           = "gopal-psql-qa-eastus2"
  env                   = "qa"
  subnet_id             = module.network.db_subnet_id
  vnet_id               = module.network.vnet_id
  aks_kubelet_object_id = module.aks.kubelet_identity_object_id
}

# 5. ACR Module (Registry)
module "acr" {
  source = "../../modules/acr"

  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  acr_name            = "gopalacrqa${random_id.unique.hex}"
}

# 6. Web App Module (Frontend)
module "webapp" {
  source = "../../modules/webapp"

  resource_group_name = azurerm_resource_group.rg.name
  location            = "centralus"
  plan_name           = "Gopal-asp-qa-centralus"
  app_name            = "Gopal-web-qa-centralus"
  apim_url            = module.apim.gateway_url
}

# 7. APIM Module (Gateway)
module "apim" {
  source = "../../modules/apim"

  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  apim_name           = "Gopal-apim-qa-eastus2"
  publisher_name      = "Gopal Tech"
  publisher_email     = "admin@gopal.tech"
  env                 = "qa"
}

resource "random_id" "unique" {
  byte_length = 4
}