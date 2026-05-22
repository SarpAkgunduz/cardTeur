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
| `bootstrap-icons` | Icon library | Imported in `src/main.tsx` as `bootstrap-icons/font/bootstrap-icons.css`; must be installed or Vite will throw an import-analysis error |
| `firebase` | Auth (Email/Password) | Config via `VITE_FIREBASE_*` in `openteur/.env` |
| `vite` | Dev server & bundler | Run with `npm run dev` |

## E2E (`e2e/`) — `npm install` in `e2e/`
| Package | Purpose | Notes |
|---------|---------|-------|
| `@playwright/test` | E2E test runner | Install in `e2e/` only — do NOT install in `openteur/` or `server/` |

After `npm install` in `e2e/`, also run:
```bash
npx playwright install
```
This downloads the browser binaries Playwright needs. Must be re-run on each new machine.

Available scripts:
```bash
npm test
```

`npm test` runs the Playwright suite with the shared Playwright config. Full E2E auth uses `global-setup.ts`; E2E auth reads `E2E_EMAIL` and `E2E_PASSWORD` when present, otherwise falls back to the legacy local test account.

## Root scripts

- `npm start` runs backend and frontend together; dependencies still need to be installed inside `server/` and `openteur/`.
- `npm run build` runs the backend build first, then the frontend build.
- Do not put `npm install` inside build/test scripts. Dependency installation belongs in setup/CI steps, not inside package scripts that are expected to compile or test.

## Backend (`server/`) — `npm install` in `server/`
| Package | Purpose | Notes |
|---------|---------|-------|
| `express` | HTTP server | Port 5002 (changed from 5001 — macOS AirPlay Receiver occupies 5001) |
| `mongoose` | MongoDB ODM | `MONGO_URI` in `server/.env` |
| `dotenv` | Env var loading | Must call `dotenv.config({ path: path.resolve(__dirname, '.env') })` with absolute path — plain `dotenv.config()` may miss `.env` when cwd differs |
| `firebase-admin` | Token verification middleware | Reads `server/serviceAccountKey.json` — never commit this file |
| `cors` | CORS headers | Hardcoded to `http://localhost:5173` |
| `resend` | Email sending | `RESEND_API_KEY` + `SMTP_FROM=onboarding@resend.dev` in `server/.env` |
| `nodemailer` | **LEGACY — no longer used** | Left in package.json but emailService.ts has been migrated to Resend. Do not use. |

## Required `server/.env` keys
```
MONGO_URI=...
PORT=5002
RESEND_API_KEY=re_...
SMTP_FROM=onboarding@resend.dev
```

## Production environment (Railway)
The backend is deployed on Railway at `https://cardteur-production.up.railway.app`.
- Root directory is set to `/server` in the Railway dashboard.
- Build command: `npm run build` (compiles TypeScript via `tsc`).
- Start command: `node dist/index.js`.
- Railway injects a `PORT` env var; the server reads it with `const PORT = process.env.PORT || 5002`.
- The Railway networking port must be set to **8080** in the Railway dashboard (Railway proxies external traffic to 8080 regardless of `PORT`).
- Required Railway service variables: `MONGO_URI`, `RESEND_API_KEY`, `SMTP_FROM`, `FIREBASE_SERVICE_ACCOUNT` (JSON string of the service account key — copy the full contents of `serviceAccountKey.json`).
- `server/firebaseAdmin.ts` reads `FIREBASE_SERVICE_ACCOUNT` env var in production; falls back to `serviceAccountKey.json` locally.
- Frontend `apiClient.ts` uses `VITE_API_BASE_URL || 'https://cardteur-production.up.railway.app/api'`. Local dev overrides this via `openteur/.env.development.local` (not committed): `VITE_API_BASE_URL=http://localhost:5002/api`.

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
| `Server running on port 5001` shown but frontend gets `Failed to fetch` / `connection refused` | macOS AirPlay Receiver (Control Center) occupies port 5001 — server binds but is immediately shadowed | Change default port to `5002` in `server/index.ts` (`const PORT = process.env.PORT \|\| 5002`) and update `API_BASE_URL` in `openteur/src/services/api/apiClient.ts` to `http://localhost:5002/api`. Alternatively disable AirPlay Receiver in System Settings → General → AirDrop & Handoff. |
| Browser tab icon (favicon) not showing | `openteur/index.html` references `/pagelogo/logo.png` (lowercase) but the actual folder is `public/pageLogo/` (capital L) — Vite dev server is case-sensitive on macOS | Use `/pageLogo/logo.png` in the `<link rel="icon">` tag. |
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
