@description('The Azure region for all resources.')
param location string = resourceGroup().location

@description('The name of the Virtual Network.')
param vnetName string = 'vnet-prod'

@description('Standard tags for resource tracking.')
param resourceTags object = {
  Environment: 'Prod'
  Project: 'AzureDevOpsProject'
  Owner: 'Steven Richards'
}

// Parameters of image tags from azure-pipelines.yml
param backendImageTag string
param frontendImageTag string
param acrName string = 'acr${uniqueString(resourceGroup().id)}' // uniqueString ensures a globally unique name
param keyVaultName string = 'kv-${uniqueString(resourceGroup().id)}'

// Virtual Network & Subnets
resource vnet 'Microsoft.Network/virtualNetworks@2023-09-01' = {
  name: vnetName
  location: location
  tags: resourceTags
  properties: {
    addressSpace: {
      addressPrefixes: [
        '10.0.0.0/16'
      ]
    }
    subnets: [
      {
        name: 'snet-capstone-prod'
        properties: {
          addressPrefix: '10.0.0.0/23'
          serviceEndpoints: [
            {
              service: 'Microsoft.Storage'
            }
          ]
          delegations: [
            {
              name: 'cae-delegation'
              properties: {
                serviceName: 'Microsoft.App/environments'
              }
            }
          ]
        }
      }
    ]
  }
}

// Azure Container Registry
resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: acrName
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: false
  }
}

// User Assigned Managed Identity
resource userIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: 'id-app-service-puller'
  location: location
}

// Role Assignment (Giving the Identity "Pull" permission on the Registry)
resource acrPullRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(acr.id, userIdentity.id, 'AcrPull')
  scope: acr
  properties: {
    principalId: userIdentity.properties.principalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d')
    principalType: 'ServicePrincipal'
  }
}

// Key Vault
resource keyVault 'Microsoft.KeyVault/vaults@2023-02-01' = {
  name: keyVaultName
  location: location
  properties: {
    tenantId: tenant().tenantId
    sku: {
      family: 'A'
      name: 'standard'
    }
    accessPolicies: []
  }
}

// Azure Container App Environment
resource containerAppEnv 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: 'cae-portfolio'
  location: location
  properties: {
    workloadProfiles: [
      {
        name: 'Consumption'
        workloadProfileType: 'Consumption'
      }
    ]
    vnetConfiguration: {
      infrastructureSubnetId: resourceId('Microsoft.Network/virtualNetworks/subnets', vnetName, 'snet-capstone-prod')
    }
  }
}

// Grant the Backend Container App access to Key Vault
resource keyVaultAccess 'Microsoft.KeyVault/vaults/accessPolicies@2023-02-01' = {
  parent: keyVault
  name: 'add'
  properties: {
    accessPolicies: [
      {
        tenantId: tenant().tenantId
        objectId: userIdentity.properties.principalId
        permissions: {
          secrets: [
            'get'
            'list'
          ]
        }
      }
    ]
  }
}

// Backend Container App (FastAPI)
resource backendApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'app-backend'
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${userIdentity.id}': {}
    }
  }
  dependsOn: [
    keyVaultAccess // Wait for permissions to be active
    acrPullRole    // Ensure ACR pull is also ready
  ]
  properties: {
    managedEnvironmentId: containerAppEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 8000
      }
      registries: [
        {
          server: acr.properties.loginServer
          identity: userIdentity.id
        }
      ]
      secrets: [
        {
          name: 'openai-api-key'
          keyVaultUrl: 'https://${keyVault.name}.vault.azure.net/secrets/openai-api-key'
          identity: userIdentity.id
        }
        {
          name: 'openai-api-url'
          keyVaultUrl: 'https://${keyVault.name}.vault.azure.net/secrets/openai-api-url'
          identity: userIdentity.id
        }
        {
          name: 'password'
          keyVaultUrl: 'https://${keyVault.name}.vault.azure.net/secrets/password'
          identity: userIdentity.id
        }
        {
          name: 'algo'
          keyVaultUrl: 'https://${keyVault.name}.vault.azure.net/secrets/algo'
          identity: userIdentity.id
        }
        {
          name: 'resend-api-key'
          keyVaultUrl: 'https://${keyVault.name}.vault.azure.net/secrets/resend-api-key'
          identity: userIdentity.id
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'capstone-backend'
          image: '${acr.properties.loginServer}/capstone-backend:${backendImageTag}'
          env: [
            {
              name: 'OPENAI_API_KEY'
              secretRef: 'openai-api-key'
            }
            {
              name: 'OPENAI_API_URL'
              secretRef: 'openai-api-url'
            }
            {
              name: 'PASSWORD'
              secretRef: 'password'
            }
            {
              name: 'ALGO'
              secretRef: 'algo'
            }
            {
              name: 'RESEND_API_KEY'
              secretRef: 'resend-api-key'
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
      }
    }
  }
}

// Frontend Container App (React)
resource frontendApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'app-frontend'
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: { '${userIdentity.id}': {} }
  }
  properties: {
    managedEnvironmentId: containerAppEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 3000
      }
      registries: [
        {
          server: acr.properties.loginServer
          identity: userIdentity.id
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'capstone-frontend'
          image: '${acr.properties.loginServer}/capstone-frontend:${frontendImageTag}'
          env: [
            {
              name: 'VITE_API_BASE_URL'
              value: 'https://placeholder-backend-url'
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
      }
    }
  }
}

// Outputs for referencing later
output vnetId string = vnet.id
output acrLoginServer string = acr.properties.loginServer
output frontendHostName string = frontendApp.properties.configuration.ingress.fqdn
output backendHostName string = backendApp.properties.configuration.ingress.fqdn
