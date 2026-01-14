# 🚀 Cara Deploy Manual ke Azure Static Web Apps

## Opsi 1: Deploy dengan SWA CLI (Paling Mudah)

### Install SWA CLI:
```bash
npm install -g @azure/static-web-apps-cli
```

### Build aplikasi:
```bash
npm run build
```

### Deploy:
```bash
# Login ke Azure
swa login

# Deploy (akan minta pilih subscription & resource group)
swa deploy ./build --app-name absa-web-app
```

---

## Opsi 2: Deploy dengan Azure CLI

### Install Azure CLI:
Download dari: https://aka.ms/installazurecliwindows

### Login dan Deploy:
```bash
# Login
az login

# Build aplikasi
npm run build

# Deploy ke Static Web App
az staticwebapp create \
  --name absa-web-app \
  --resource-group absa \
  --source ./build \
  --location "eastasia" \
  --branch main \
  --token YOUR_GITHUB_TOKEN
```

---

## Opsi 3: Deploy Lewat VS Code Extension (Paling Gampang!)

### Install Extension:
1. Buka VS Code Extensions (Ctrl+Shift+X)
2. Cari: **"Azure Static Web Apps"**
3. Install

### Deploy:
1. Klik ikon Azure di sidebar
2. Klik **"+"** di Static Web Apps
3. Pilih subscription → create new app
4. Ikuti wizard
5. Klik kanan app → **Deploy**

---

## Opsi 4: Zip Deploy Manual

### Build dan Zip:
```bash
# Build
npm run build

# Compress folder build (PowerShell)
Compress-Archive -Path ./build/* -DestinationPath app.zip
```

### Upload di Azure Portal:
1. Buka Azure Portal → Static Web Apps
2. Pilih app Anda
3. Deployment → Upload → pilih app.zip

---

## 📝 Recommendation

Saya rekomendasikan **Opsi 3 (VS Code Extension)** karena:
- ✅ Paling mudah dan visual
- ✅ Tidak perlu command line
- ✅ Langsung dari VS Code
- ✅ Auto-detect build settings

Atau **Opsi 1 (SWA CLI)** kalau suka command line.
