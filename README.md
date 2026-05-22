# CardTeur

CardTeur is a full-stack web application that allows users to create, view, and manage custom football player cards, similar to those seen in football card and manager games.

The app lets users assign abilities, upload images, generate random roster cards, organize crews, and build match lineups from all players or from a selected crew.

Users can assign stats, upload images, compare players, manage friends/crews, and send match announcements via email. Authentication is handled via Firebase Auth (Email/Password + Google).

---

## 🛠️ Tech Stack

### Frontend (`openteur/`)

* React + TypeScript
* React Router DOM
* Bootstrap + Bootstrap Icons
* Firebase (Auth)
* Vite

### Backend (`server/`)

* Node.js + Express.js + TypeScript
* MongoDB (Mongoose ODM)
* Firebase Admin SDK (token verification)
* Resend (email sending)
* dotenv, cors

### E2E Tests (`e2e/`)

* Playwright

---

## 📂 Project Structure

```
cardteur/
├── openteur/              # Frontend (React + Vite)
│   ├── public/
│   ├── src/
│   └── package.json
├── server/                # Backend (Express + MongoDB)
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   ├── index.ts
│   └── package.json
├── e2e/                   # Playwright end-to-end tests
│   ├── tests/
│   ├── global-setup.ts
│   └── package.json
├── wrangler.jsonc         # Cloudflare Workers deployment config
└── .gitignore
```

---

## 🔑 Required Secret Files (NOT committed to git)

| File | Description |
|------|-------------|
| `server/serviceAccountKey.json` | Firebase Admin SDK private key — download from Firebase Console → Project Settings → Service Accounts → Generate new private key |
| `openteur/.env` | Frontend Firebase config (see below) |
| `server/.env` | Backend env vars (see below) |

### `openteur/.env`
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### `server/.env`
```
MONGO_URI=...
PORT=5002
RESEND_API_KEY=re_...
SMTP_FROM=onboarding@resend.dev
```

---

## ⚙️ Setup Guide

### 1. Clone the Project

```bash
git clone https://github.com/SarpAkgunduz/cardTeur.git
cd cardTeur
```

### 2. Setup the Backend

```bash
cd server
npm install
```

Create `server/.env` (see above) and place `server/serviceAccountKey.json` from Firebase Console.

```bash
npm run dev
# → Connected to MongoDB
# → Server running on port 5002
```

> ⚠️ **macOS only**: Port 5001 is occupied by AirPlay Receiver (Control Center). The server uses port **5002** by default. If you change the port, also update `API_BASE_URL` in `openteur/src/services/api/apiClient.ts`.

### 3. Setup the Frontend

```bash
cd openteur
npm install
```

Create `openteur/.env` (see above).

```bash
npm run dev
# → http://localhost:5173
```

### 4. Run Both Apps From The Root

After installing dependencies in `server/` and `openteur/`, you can start the backend and frontend together from the repo root:

```bash
npm start
```

This runs `server npm run dev` and `openteur npm run dev` in parallel. The backend serves port `5002`; the frontend serves port `5173`.

Root scripts do not install dependencies automatically. Run `npm install` inside `server/`, `openteur/`, and `e2e/` during setup or CI before running build/test commands.

### 5. Setup E2E Tests

```bash
cd e2e
npm install
npx playwright install
```

Start both frontend and backend before running tests. Authenticated tests sign in through the real Firebase login form. Set these env vars when the fallback test account is not valid:

```bash
E2E_EMAIL=...
E2E_PASSWORD=...
```

```bash
npx playwright test
npm test
```

`npx playwright test` and `npm test` both run the full Playwright suite from `e2e/`.

The root build compiles the backend and builds the frontend:

```bash
npm run build
```

From `openteur/`, `npm run build` only runs the frontend build.

---

## 📖 Features

* Firebase Auth (Email/Password + Google Sign-In)
* Create custom player cards with detailed stats
* Generate random Bronze, Silver, or Gold players from the roster screen
* Upload player images
* Assign offensive, defensive, and athleticism overalls
* Goalkeeper cards and match lineups use `gkOverall` for GK roles
* Delete or compare player cards with a sliding compare panel
* Preview squad grouped by position (GK → DEF → MID → ATT)
* Manage friends and crews; linked crew members can see crews they were added to
* Build match lineups from all players or from a selected crew
* Profile photos are stored in the app profile (`/users/me` / `/users/profile`) and are visible to friends/linked crew contexts only
* Match announcement emails via Resend
* Multi-tenant: each user owns their own player roster

---

## 🔐 License

This project is open-source and available under the MIT License.
