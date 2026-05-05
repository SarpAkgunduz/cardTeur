---
description: "NPM dependency registry, required installations, and troubleshooting guide for CardTeur."
applyTo: "**"
---

# CardTeur Dependency Registry

## Frontend (`openteur/`) — `npm install` in `openteur/`
| Package | Purpose | Notes |
|---------|---------|-------|
| `react`, `react-dom` | UI framework | |
| `react-router-dom` | Client-side routing | |
| `bootstrap` | UI components | Mixed with custom CSS |
| `firebase` | Auth (Email/Password) | Config via `VITE_FIREBASE_*` in `openteur/.env` |
| `vite` | Dev server & bundler | Run with `npm run dev` |

## Backend (`server/`) — `npm install` in `server/`
| Package | Purpose | Notes |
|---------|---------|-------|
| `express` | HTTP server | Port 5001 |
| `mongoose` | MongoDB ODM | `MONGO_URI` in `server/.env` |
| `dotenv` | Env var loading | Must call `dotenv.config({ path: path.resolve(__dirname, '.env') })` with absolute path — plain `dotenv.config()` may miss `.env` when cwd differs |
| `firebase-admin` | Token verification middleware | Reads `server/serviceAccountKey.json` — never commit this file |
| `cors` | CORS headers | Hardcoded to `http://localhost:5173` |
| `resend` | Email sending | `RESEND_API_KEY` + `SMTP_FROM=onboarding@resend.dev` in `server/.env` |
| `nodemailer` | **LEGACY — no longer used** | Left in package.json but emailService.ts has been migrated to Resend. Do not use. |

## Required `server/.env` keys
```
MONGO_URI=...
PORT=5001
RESEND_API_KEY=re_...
SMTP_FROM=onboarding@resend.dev
```

## Required `openteur/.env` keys
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

---

## Dependency Troubleshooting

When a runtime error mentions a missing package or unexpected behavior in a known library, run through this checklist **before** changing code:

### 1. Check if the package is actually installed
```powershell
# In server/ or openteur/
Test-Path node_modules/<package-name>
```
If missing: `npm install <package-name>`

### 2. Verify env vars are loaded correctly
```powershell
node -e "require('dotenv').config({ path: require('path').resolve(__dirname ?? '.', '.env') }); console.log(Object.keys(process.env).filter(k => !k.startsWith('npm')))"
```
If a key shows as `undefined` at runtime, `dotenv.config()` is probably running from wrong cwd — use `path.resolve(__dirname, '.env')`.

### 3. Known issues & resolutions

| Error | Cause | Fix |
|-------|-------|-----|
| `Missing API key. Pass it to the constructor new Resend("re_123")` | `RESEND_API_KEY` not loaded — dotenv ran from wrong directory | In `emailService.ts`: `dotenv.config({ path: path.resolve(__dirname, '../.env') })` |
| `Unable to fetch data. The request could not be resolved.` | Network cannot reach `api.resend.com` — firewall/corporate network | Switch to hotspot or VPN; Resend requires outbound HTTPS to `api.resend.com` |
| `connect ECONNREFUSED 127.0.0.1:587` | Old nodemailer code still running — server not restarted after Resend migration | Restart server with `npm run dev` |
| `fetch failed` on Resend API | Node < 18 (no native fetch) or network blocked | Check `node --version` ≥ 18; test with `node -e "fetch('https://api.resend.com').then(r=>console.log(r.status)).catch(e=>console.log(e.message))"` |
| Firebase Admin SDK fails to initialize | `serviceAccountKey.json` missing or path wrong | Download from Firebase Console → Project Settings → Service Accounts → Generate new private key. Place at `server/serviceAccountKey.json` |
| `Cannot find module 'resend'` | Package not installed in `server/` | `cd server && npm install resend` |

### 4. After any `npm install`, always restart the server
`npm run dev` in `server/` — ts-node recompiles on restart, new packages are picked up.

### 5. Resend free-plan constraints
- Without a verified domain: can only send to the email address used to register on resend.com
- Limit: 3,000 emails/month, 100/day
- To send to arbitrary addresses: verify a domain at resend.com/domains or upgrade plan
