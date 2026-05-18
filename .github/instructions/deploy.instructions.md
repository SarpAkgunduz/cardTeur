---
description: "Deploy instructions for cardteur.com (frontend) and Railway (backend)."
applyTo: "**"
---

# Deploy Instructions

## Frontend → cardteur.com (Cloudflare Workers)

```bash
cd /Users/sarpakgunduz/Desktop/cardTeur/openteur
npm run build
cd ..
npx wrangler deploy
```

## Backend → cardteur-production.up.railway.app (Railway)

```bash
git add .
git commit -m "CARDTEUR-X: açıklama"
git push origin main
```

Railway, `main` branch'e her push'ta otomatik olarak `server/` klasörünü build edip deploy eder.
