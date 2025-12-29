# 1. Create the Resource Group for Dev
resource "azurerm_resource_group" "rg" {
  name     = "Gopal-rg-dev-eastus2"
  location = "eastus2"
}

# 2. Network Module (The Foundation)
module "network" {
  source = "../../modules/network"

  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  vnet_name           = "Gopal-vnet-dev-eastus2"
  address_space       = "10.0.0.0/16"
  aks_subnet_prefix   = "10.0.1.0/24"
  db_subnet_prefix    = "10.0.2.0/24"
}

# 3. AKS Module (The Backend Host)
module "aks" {
  source = "../../modules/aks"

  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  cluster_name        = "Gopal-aks-dev-eastus2"
  dns_prefix          = "gopal-aks-dev"
  subnet_id           = module.network.aks_subnet_id
}

# 4. Database Module (The Data)
module "database" {
  source = "../../modules/database"

  resource_group_name   = azurerm_resource_group.rg.name
  location              = azurerm_resource_group.rg.location
  server_name           = "gopal-psql-dev-eastus2"
  env                   = "dev"
  subnet_id             = module.network.db_subnet_id
  vnet_id               = module.network.vnet_id
  aks_kubelet_object_id = module.aks.kubelet_identity_object_id
}

# 5. ACR Module (The Image Registry)
module "acr" {
  source = "../../modules/acr"

  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  acr_name            = "gopalacrdev${random_id.unique.hex}" # Adds random string to ensure unique name
}

# 6. Web App Module (The Frontend Host)
module "webapp" {
  source = "../../modules/webapp"

  resource_group_name = azurerm_resource_group.rg.name
  location            = "centralus" # App Service Free Tier is often better available in Central US
  plan_name           = "Gopal-asp-dev-centralus"
  app_name            = "Gopal-web-dev-centralus"
  apim_url            = module.apim.gateway_url
}

# 7. APIM Module (The Gateway)
module "apim" {
  source = "../../modules/apim"

  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  apim_name           = "Gopal-apim-dev-eastus2"
  publisher_name      = "Gopal Tech"
  publisher_email     = "admin@gopal.tech"
}

# Helper to generate unique ACR name
resource "random_id" "unique" {
  byte_length = 4
}