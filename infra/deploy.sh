#!/bin/bash
set -euo pipefail

RESOURCE_GROUP="rg-log-dashboard"
LOCATION="japaneast"
DEPLOYMENT_NAME="log-dashboard"

echo "=== Creating resource group ==="
az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION"

echo "=== Deploying Bicep template ==="
DEPLOYMENT_OUTPUT=$(az deployment group create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$DEPLOYMENT_NAME" \
  --parameters main.bicepparam \
  --output json)

echo "=== Retrieving deployment token ==="
DEPLOYMENT_TOKEN=$(echo "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.deploymentToken.value')

echo ""
echo "Deployment token retrieved successfully."
echo "Register the following value as a GitHub Secret:"
echo ""
echo "  Name : AZURE_STATIC_WEB_APPS_API_TOKEN"
echo "  Value: $DEPLOYMENT_TOKEN"
echo ""
echo "=== Done ==="
