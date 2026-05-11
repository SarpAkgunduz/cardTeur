# CardTeur

CardTeur is a full-stack web application that allows users to create, view, and manage custom football player cards, similar to those seen in FIFA or football manager games.

The app lets users assign abilities, upload images, and categorize player cards. Future plans include implementing team-matching features to automatically form balanced teams.

Users can assign stats, upload images, compare players, and send match announcements via email. Authentication is handled via Firebase Auth (Email/Password + Google).

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

### 4. Setup E2E Tests

```bash
cd e2e
npm install
npx playwright install
```

> Start both frontend and backend before running tests — Playwright does not auto-start the app.
> Update `e2e/global-setup.ts` with a valid Firebase account before running.

```bash
npx playwright test
```

---

## 📖 Features

* Firebase Auth (Email/Password + Google Sign-In)
* Create custom player cards with detailed stats
* Upload player images
* Assign offensive, defensive, and athleticism overalls
* Delete or compare player cards with a sliding compare panel
* Preview squad grouped by position (GK → DEF → MID → ATT)
* Match announcement emails via Resend
* Multi-tenant: each user owns their own player roster

---

## 🔐 License

This project is open-source and available under the MIT License.
