@description('Azure region to deploy resources')
param location string = resourceGroup().location

@description('Name of the Static Web App')
param appName string

@description('SKU of the Static Web App')
@allowed(['Free', 'Standard'])
param sku string = 'Free'

resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: appName
  location: location
  sku: {
    name: sku
    tier: sku
  }
  properties: {}
}

@description('Deployment token for CI/CD pipeline')
output deploymentToken string = staticWebApp.listSecrets().properties.apiKey
