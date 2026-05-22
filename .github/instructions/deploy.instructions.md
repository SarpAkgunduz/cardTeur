---
description: "Deploy instructions for cardteur.com (frontend) and Railway (backend)."
applyTo: "**"
---

# Deploy Instructions

## Frontend → cardteur.com (Cloudflare Workers)

```bash
cd /Users/sarpakgunduz/Desktop/cardTeur
npm run build
npx wrangler deploy
```

Root `npm run build` builds the backend first, then runs the frontend build.

Build scripts assume dependencies are already installed. In CI/deploy environments, install dependencies in `server/`, `openteur/`, and `e2e/` before running the root build.

## Backend → cardteur-production.up.railway.app (Railway)

```bash
git add .
git commit -m "CARDTEUR-X: açıklama"
git push origin main
```

Railway, `main` branch'e her push'ta otomatik olarak `server/` klasörünü build edip deploy eder.
