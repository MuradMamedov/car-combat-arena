# 🚀 Deployment Plan: Split Architecture

Deploy Car Combat Arena with **GitHub Pages** (client) + **Azure Container Apps** (server).

```
┌────────────────────────────────────────┐
│            GitHub Repository           │
│                                        │
│  ┌──────────┐      ┌───────────────┐   │
│  │ src/     │      │ .github/      │   │
│  │ client/  │      │ workflows/    │   │
│  │ server/  │      │               │   │
│  └──────────┘      └───────────────┘   │
└────────────────────────────────────────┘
                    │
       push to main │
┌───────────────────┴───────────────────┐
▼                                       ▼
┌───────────────────────┐   ┌───────────────────────┐
│   deploy-client.yml   │   │   deploy-server.yml   │
│   GitHub Actions      │   │   GitHub Actions      │
└───────────────────────┘   └───────────────────────┘
            │                           │
            ▼                           ▼
┌───────────────────────┐   ┌───────────────────────┐
│    GitHub Pages       │   │  Azure Container Apps │
│    (Static Client)    │   │  (WebSocket Server)   │
│                       │   │                       │
│  yourname.github.io/  │◀──│  *.azurecontainerapps │
│  game                 │WSS│  .io:443              │
└───────────────────────┘   └───────────────────────┘
            │                           │
            └───────────┬───────────────┘
                        │
                        ▼
                ┌───────────────┐
                │    Players    │
                │   (Browser)   │
                └───────────────┘
```

---

## 📋 Phase 1: Code Preparation

### 1.1 Configure Dynamic Server URL

Update `src/client/main.ts` - replace the `getServerUrl()` function:

```typescript
function getServerUrl(): string {
  // Production: use environment variable set at build time
  // Development: use localhost
  const wsHost = import.meta.env.VITE_WS_SERVER_URL;

  if (wsHost) {
    return wsHost; // e.g., "wss://your-app.azurecontainerapps.io"
  }

  // Fallback for local dev
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.hostname || "localhost";
  return `${protocol}//${host}:8080`;
}
```

### 1.2 Create Dockerfile

Create `Dockerfile` in project root:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy built server
COPY dist/server ./dist/server

# Expose port
EXPOSE 8080

# Start WebSocket server
CMD ["node", "dist/server/index.js"]
```

### 1.3 Create .dockerignore

Create `.dockerignore` in project root:

```
node_modules
src
*.md
.git
.gitignore
.github
```

---

## 📋 Phase 2: GitHub Pages Setup (Client)

### 2.1 Create GitHub Actions Workflow

Create `.github/workflows/deploy-client.yml`:

```yaml
name: Deploy Client to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build-and-deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build client
        run: npm run build
        env:
          VITE_WS_SERVER_URL: ${{ vars.WS_SERVER_URL }}

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist/client

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 2.2 Enable GitHub Pages

1. Go to repository **Settings** → **Pages**
2. Set Source to **GitHub Actions**

---

## 📋 Phase 3: Azure Container Apps Setup (Server)

### 3.1 Prerequisites

- Azure CLI installed (`az`)
- Azure account with active subscription
- Docker installed (for local testing)

### 3.2 Create Azure Resources (One-Time Setup)

Run these commands to create the Azure infrastructure:

```bash
# Set variables (customize these!)
RESOURCE_GROUP="car-combat-rg"
LOCATION="eastus"
CONTAINER_ENV="car-combat-env"
APP_NAME="car-combat-server"
REGISTRY_NAME="carcombatregistry"  # must be globally unique, lowercase, no dashes

# Login to Azure
az login

# Create resource group
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION

# Create container registry
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $REGISTRY_NAME \
  --sku Basic \
  --admin-enabled true

# Create container apps environment
az containerapp env create \
  --name $CONTAINER_ENV \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION

# Build and push initial image (run from project root after npm run build)
az acr build \
  --registry $REGISTRY_NAME \
  --image car-combat-server:latest .

# Create the container app
az containerapp create \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --environment $CONTAINER_ENV \
  --registry-server $REGISTRY_NAME.azurecr.io \
  --registry-username $(az acr credential show -n $REGISTRY_NAME --query username -o tsv) \
  --registry-password $(az acr credential show -n $REGISTRY_NAME --query passwords[0].value -o tsv) \
  --image $REGISTRY_NAME.azurecr.io/car-combat-server:latest \
  --target-port 8080 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 3

# Get the app URL (save this for GitHub variables!)
az containerapp show \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query properties.configuration.ingress.fqdn \
  --output tsv
```

### 3.3 Create Service Principal for GitHub Actions

```bash
# Get your subscription ID
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

# Create service principal
az ad sp create-for-rbac \
  --name "car-combat-github-actions" \
  --role contributor \
  --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP \
  --sdk-auth

# Copy the entire JSON output - you'll need it for GitHub secrets
```

### 3.4 Create GitHub Actions Workflow for Server

Create `.github/workflows/deploy-server.yml`:

```yaml
name: Deploy Server to Azure Container Apps

on:
  push:
    branches: [main]
    paths:
      - "src/server/**"
      - "src/shared/**"
      - "Dockerfile"
      - "package.json"
  workflow_dispatch:

env:
  AZURE_CONTAINER_REGISTRY: carcombatregistry
  CONTAINER_APP_NAME: car-combat-server
  RESOURCE_GROUP: car-combat-rg

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build project
        run: npm run build

      - name: Login to Azure
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Login to Azure Container Registry
        run: az acr login --name ${{ env.AZURE_CONTAINER_REGISTRY }}

      - name: Build and push container image
        run: |
          az acr build \
            --registry ${{ env.AZURE_CONTAINER_REGISTRY }} \
            --image car-combat-server:${{ github.sha }} \
            --image car-combat-server:latest .

      - name: Deploy to Azure Container Apps
        run: |
          az containerapp update \
            --name ${{ env.CONTAINER_APP_NAME }} \
            --resource-group ${{ env.RESOURCE_GROUP }} \
            --image ${{ env.AZURE_CONTAINER_REGISTRY }}.azurecr.io/car-combat-server:${{ github.sha }}
```

---

## 📋 Phase 4: Configuration

### 4.1 GitHub Repository Secrets

Go to repository **Settings** → **Secrets and variables** → **Actions** → **Secrets**

| Secret Name         | Value                                                  |
| ------------------- | ------------------------------------------------------ |
| `AZURE_CREDENTIALS` | The entire JSON output from service principal creation |

### 4.2 GitHub Repository Variables

Go to repository **Settings** → **Secrets and variables** → **Actions** → **Variables**

| Variable Name   | Value                                                  |
| --------------- | ------------------------------------------------------ |
| `WS_SERVER_URL` | `wss://<your-app-name>.<region>.azurecontainerapps.io` |

> **Note**: Get the exact URL from the `az containerapp show` command in Phase 3.2

---

## 📋 Phase 5: Deployment

### 5.1 Deployment Order

1. ✅ Complete all code changes (Phase 1)
2. ✅ Create Azure resources (Phase 3.2)
3. ✅ Create service principal (Phase 3.3)
4. ✅ Add GitHub secrets and variables (Phase 4)
5. ✅ Commit and push all changes to `main`
6. ✅ GitHub Actions will automatically deploy both client and server

### 5.2 Verify Deployment

1. Check GitHub Actions tab for workflow status
2. Visit your GitHub Pages URL: `https://<username>.github.io/<repo-name>`
3. Open browser console to verify WebSocket connection
4. Test multiplayer by opening in two browser tabs

---

## 💰 Estimated Costs

| Service                                       | Monthly Cost     |
| --------------------------------------------- | ---------------- |
| GitHub Pages                                  | **Free**         |
| Azure Container Registry (Basic)              | ~$5              |
| Azure Container Apps (1 replica, mostly idle) | ~$0-5            |
| Azure Container Apps (active gameplay)        | ~$5-15           |
| **Total**                                     | **~$5-20/month** |

> **Tip**: Set `--min-replicas 0` to scale to zero when not in use (saves money but adds ~30s cold start)

---

## 🔧 Troubleshooting

### WebSocket Connection Fails

1. Check browser console for errors
2. Verify `WS_SERVER_URL` variable is set correctly
3. Ensure Azure Container App ingress is set to `external`
4. Check Azure Container App logs:
   ```bash
   az containerapp logs show \
     --name car-combat-server \
     --resource-group car-combat-rg \
     --follow
   ```

### GitHub Pages Shows 404

1. Ensure Pages is enabled with "GitHub Actions" source
2. Check the deploy-client workflow completed successfully
3. Verify `dist/client/index.html` exists after build

### Azure Deployment Fails

1. Verify service principal has `contributor` role
2. Check `AZURE_CREDENTIALS` secret is valid JSON
3. Ensure registry name matches in workflow and Azure

---

## 🧹 Cleanup (If Needed)

To delete all Azure resources:

```bash
az group delete --name car-combat-rg --yes --no-wait
```

To disable GitHub Pages:

1. Go to repository **Settings** → **Pages**
2. Set Source to **None**
