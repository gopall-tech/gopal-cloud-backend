resource "azurerm_api_management" "apim" {
  name                = var.apim_name
  location            = var.location
  resource_group_name = var.resource_group_name
  publisher_name      = var.publisher_name
  publisher_email     = var.publisher_email
  sku_name            = "Consumption_0" # Serverless Tier (Cheapest)
}
# 1. Define the API (Automates "Add API")
resource "azurerm_api_management_api" "backend_api" {
  name                = "gopal-backend-api"
  resource_group_name = var.resource_group_name
  api_management_name = azurerm_api_management.apim.name
  revision            = "1"
  display_name        = "Gopal Backend API"
  path                = "v1"                    # Automates the "v1" suffix
  protocols           = ["http", "https"]
  
  # Placeholder URL (The CI/CD pipeline will update this with the real Ingress IP later)
  service_url         = "http://REPLACE_ME_INGRESS_IP" 

  subscription_required = false                 # Automates disabling "Subscription Required"
}

# 2. Define Policy (Automates CORS)
resource "azurerm_api_management_api_policy" "api_policy" {
  api_name            = azurerm_api_management_api.backend_api.name
  api_management_name = azurerm_api_management.apim.name
  resource_group_name = var.resource_group_name

  xml_content = <<XML
<policies>
  <inbound>
    <cors allow-credentials="true">
      <allowed-origins>
        <origin>https://gopal-web-${var.env}-centralus.azurewebsites.net</origin>
        <origin>http://localhost:3000</origin>
      </allowed-origins>
      <allowed-methods>
        <method>GET</method>
        <method>POST</method>
      </allowed-methods>
      <allowed-headers>
        <header>*</header>
      </allowed-headers>
    </cors>
    <base />
  </inbound>
</policies>
XML
}

# 3. Define Operations (Automates "Add Operation")
resource "azurerm_api_management_api_operation" "get_a" {
  operation_id        = "get-backend-a"
  api_name            = azurerm_api_management_api.backend_api.name
  api_management_name = azurerm_api_management.apim.name
  resource_group_name = var.resource_group_name
  display_name        = "Get Backend A"
  method              = "GET"
  url_template        = "/api/a"
}

resource "azurerm_api_management_api_operation" "get_b" {
  operation_id        = "get-backend-b"
  api_name            = azurerm_api_management_api.backend_api.name
  api_management_name = azurerm_api_management.apim.name
  resource_group_name = var.resource_group_name
  display_name        = "Get Backend B"
  method              = "GET"
  url_template        = "/api/b"
}

resource "azurerm_api_management_api_operation" "upload_a" {
  operation_id        = "upload-backend-a"
  api_name            = azurerm_api_management_api.backend_api.name
  api_management_name = azurerm_api_management.apim.name
  resource_group_name = var.resource_group_name
  display_name        = "Upload Backend A"
  method              = "POST"
  url_template        = "/api/a/upload"
}

resource "azurerm_api_management_api_operation" "upload_b" {
  operation_id        = "upload-backend-b"
  api_name            = azurerm_api_management_api.backend_api.name
  api_management_name = azurerm_api_management.apim.name
  resource_group_name = var.resource_group_name
  display_name        = "Upload Backend B"
  method              = "POST"
  url_template        = "/api/b/upload"
}