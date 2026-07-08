# CardTeur — Claude Code Guide

## Workspace shape
- Three separate TypeScript subprojects: `openteur/` (Vite + React frontend), `server/` (Express + Mongoose API), `e2e/` (Playwright tests). Root `package.json` only orchestrates build/test commands; each subproject manages its own deps.
- `openteur/src/services/api/types.ts` and `server/models/Player.ts` are the shared Player contract. When adding/removing fields, update both sides together and keep `e2e/tests/api-tests/players.spec.ts` aligned.
- Prefer actual source files and package scripts as the source of truth when docs drift.

---

## Behavior rules

### Don't
- Add comments, docstrings, or JSDoc unless explicitly asked.
- Refactor existing code — only make the requested change.
- Extend the user's idea or add adjacent improvements without asking first.
- Create helper abstractions for one-time operations.
- Add unnecessary try/catch on top of existing error handling.
- Write validation for scenarios that don't exist.
- Remove Bootstrap or other libraries without being asked.
- Add a feature to a page that already has a dedicated page for it (e.g. don't put email editing in `AddPlayerForm` — that's `CrewPage`'s concern).

### Do
- Read relevant files before making changes.
- Stick to dark theme colors for CSS changes.
- Ask if the request is ambiguous or context is unclear.
- Always write comments in English — applies to both code committed to the codebase and code snippets shared in conversation. Never write inline comments in any other language.
- Keep mode buttons mutually exclusive — activating one closes the others.
- Inline edit always supports `Enter` = save, `Escape` = cancel.
- Extract logic to a custom hook or helper file when a view file grows too large or holds unrelated concerns. Readability beats saving lines.

### Requires confirmation
- Deleting files.
- `git push`, `git reset --hard`, `git push --force`.
- Database schema changes.
- Moving an idea beyond the exact requested scope.

---

## Frontend architecture

- Routing defined in `openteur/src/App.tsx`. Protected pages use `PrivateRoute`; `/manage`, `/preview`, `/match`, `/add`, `/edit-player/:id` all require auth.
- Auth: Firebase Email/Password. `openteur/src/contexts/AuthContext.tsx` wraps the app with `<AuthProvider>`, exposes `currentUser`, `signIn`, `signOut` via `useAuth()`. Never use the old `isLoggedIn()` pattern.
- `openteur/src/services/AuthService.tsx` only exports `getCurrentUserToken()` (Firebase ID token). All other auth logic lives in `AuthContext.tsx`.
- Firebase config comes from `VITE_FIREBASE_*` env vars in `openteur/.env`. Never hardcode config values in source files.
- `PlayersPage.tsx` is the CRUD hub — uses `PlayerContext`, toggle delete/edit/compare modes locally, renders `Card` and `ComparePanel`. Owns the "Generate Random Player" card. Tier naming: `Bronze/Silver/Gold Player N` where `N` is highest visible number for that tier + 1 (start at 1 if none exist).
- `AddPlayerForm.tsx` handles create and edit flows. Calculates `offensiveOverall`, `defensiveOverall`, `athleticismOverall`, derives `cardTitle` before submit. Preserve that derived-data flow.
- `MatchPage.tsx` uses `PlayerContext`, can filter by crew in Formation Builder, must use `gkOverall` for GK slots. Crew dropdown is disabled after formation is applied.
- Styling: Bootstrap + per-page/component CSS (`pages/*.css`, `components/*.css`) + `openteur/src/styles/global.css`.
- Check `cardTeur/stylepreset/` for colors and styles when adding new UI elements.
- Required fields on forms: add `*` to label, show a toast listing missing fields on failed submit (e.g. "please fill these fields: Name, Position"). Never submit without required fields.
- Animations: use CSS `transition`/`keyframes`, durations 0.3–0.5s, `cubic-bezier` easing. Keep subtle and consistent.

### Page responsibilities (do not mix concerns)
| Page | Owns |
|---|---|
| `PlayersPage` | Player CRUD, compare, random generator |
| `PreviewPage` | Read-only roster grouped by position (GK→DEF→MID→ATT). No edit actions. |
| `CrewPage` (`/crew`) | Contact info (email) for players |
| `AddPlayerForm` | Stats, identity, user-linking (`linkedUserId`) |
| `FriendsPage` (`/friends`) | Two tabs: My Friends (client-side filter), Add Friend (exact UID/email lookup) |
| `ProfilePage` (`/profile`) | Display name, photo, password, Account ID (copyable Firebase UID), danger zone |
| `InvitePage` (`/invite/:inviterUid`) | Auto-adds inviter as friend after login/signup |

---

## Backend architecture

- Server boots from `server/index.ts`, mounts `/api/players`, `/api/matches`, `/api/users`, `/api/crews`, `/api/uploads`.
- MongoDB via `MONGO_URI` in `server/.env`. Default port `5002` (not 5001 — macOS AirPlay Receiver occupies 5001). Production on Railway uses `PORT` env var (set to 8080 in Railway dashboard).
- CORS allowlist in `server/index.ts`: `https://cardteur.com`, `https://cardteur.sarpakg.workers.dev`, `http://localhost:5173`. Never use `cors({ origin: '*' })`.
- All routes protected by `requireAuth` middleware (`server/middleware/auth.ts`), which verifies `Authorization: Bearer <token>` via Firebase Admin SDK and attaches `uid`/`email` to the request.
- `server/firebaseAdmin.ts`: in production reads `FIREBASE_SERVICE_ACCOUNT` env var (JSON string on Railway). Locally falls back to `server/serviceAccountKey.json`. **Never commit this file.**
- Business logic beyond trivial CRUD lives in `server/services/` — keep routes thin (validation + service call only).
- Email via Resend SDK (`server/services/emailService.ts`). Credentials: `RESEND_API_KEY` and `SMTP_FROM` in `server/.env`. Do NOT use nodemailer — removed.

### Player entity
- `ownerUid` is required, set by backend from verified token — never sent by frontend, never accepted from `req.body`.
- All player queries scoped: `Player.find({ ownerUid: uid })`. Never use `findById` alone — always include `ownerUid` guard.
- `cardTitle` is a backend virtual — never store or send in create/update.
- `email` is optional (`email?: string`) — never required, never validated in forms.
- `linkedUserId` links a player card to a User's `uid`. When set, `AddPlayerForm` uses that user's `photoURL` as `cardImage` (via `usePlayerForm` hook).
- `CreatePlayerDto` and `UpdatePlayerDto` both `Omit` `ownerUid`, `_id`, and `cardTitle` — intentional.

### Crews route (`server/routes/crews.ts`)
- Lists owned crews, crews where `memberUids` includes current uid, and legacy crews containing a player linked to current uid.
- When adding a linked player to a crew, add the player's `linkedUserId` to `memberUids`. When removing the last linked player for that user, remove uid from `memberUids`.

### User entity & social graph
- `server/models/User.ts`: `uid`, `email`, `displayName`, `photoURL?`, `friends: string[]`, `createdAt`.
- `GET /api/users/search` — **exact match only** on `uid` or `email` (both indexed). Never regex or fuzzy search.
- Profile photos stored in MongoDB via `/api/users/profile`. Do not rely on Firebase `currentUser.photoURL`.
- Friend filtering on frontend is always client-side against the loaded `friends` array — never per-keystroke DB queries.
- `apiRequest()` in `apiClient.ts` always sends JSON, attaches Firebase token, throws on non-2xx. Keep new helpers consistent.
- Use service barrel `openteur/src/services/index.ts` when importing `playerApi`, `Player`, or auth helpers.

---

## CSS & Theme

- Background `#1A2B42`, panel bg `rgba(36, 59, 90, 0.75)`, accent `#00deec`, error `#ff6b6b`.
- Navbar-style headers: `background: rgba(36, 59, 90, 0.85); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255,255,255,0.1); height: 64px`.
- Section headers: `background: rgba(36, 59, 90, 0.75); border-left: 3px solid #00deec; border-radius: 0 8px 8px 0`.
- All buttons use `.btn-ct`; active/cancel state toggled with `.active-mode`.
- FIFA-style card tiers in `Card.css`: keep the blue CardTeur metal base. Bronze/silver/gold read through accent colors, not completely different palettes.
- CSS class naming: BEM-like `component-name__element` (e.g. `players-grid__item`).
- Each page/component has its own CSS file; shared global styles in `global.css`.
- Inline edit controls (pencil icon): hidden by default, revealed on `.row:hover` via `opacity: 0 → 1`.

---

## TypeScript
- Type definitions kept in sync between `openteur/src/services/api/types.ts` and `server/models/Player.ts`. When adding a Player field, update both.

---

## Internationalization (i18n) — web (`openteur/`)
- Stack: `i18next` + `react-i18next` + `i18next-browser-languagedetector`. Setup lives in `openteur/src/i18n/index.ts`, imported once via `import './i18n'` in `main.tsx`.
- 9 languages configured in `LANGUAGES`/`resources`: `en`, `tr`, `de`, `az`, `pl`, `ru`, `zh`, `ko`, `ja`. Each has a file in `openteur/src/i18n/locales/<code>.ts`, typed as `const x: typeof en = {...}` against `en.ts` — this means adding/removing/renaming a key in `en.ts` requires the same change in **all 9** locale files or `tsc -b` fails with `TS2307`/missing-property errors. `en.ts` is the source of truth for key shape.
- Detection: browser language via `navigator`, cached in `localStorage` under `ct_lang`. Fallback language is `en`.
- Usage pattern: `import { useTranslation } from 'react-i18next'; const { t } = useTranslation();` then `t('section.key')`. Interpolation uses `{{var}}` (e.g. `t('match.saveFailed', { message })`).
- Key sections in `locales/*.ts`: `common`, `nav`, `landing`, `home`, `auth`, `tutorial`, `players`, `playerForm`, `stats`, `preview`, `match`, `schedule`, `crew`, `friends`, `profile`, `mdm`. `pricing`, `referrals`, `users`, `invite` have **no key section yet** — add one before wiring those pages.
- Fully wired (all structural UI text uses `t()`): `LandingPage`, `HomePage`, `LoginPage`, `SignupPage`, `PlayersPage`, `PreviewPage`, `MatchPage`, `SchedulePage`, `CrewPage`, `FriendsPage`, `ProfilePage`, `AddPlayerForm` (+ its `usePlayerForm` hook, which supplies the `stats.*` labels for `StatGrid`), `Navbar`, `GoogleSignInButton`, `MatchDetailsModal`, `tutorial/TutorialOverlay` (via `titleKey`/`textKey` in `tutorialSteps.ts`).
- Not wired at all (no `t()` calls, no key section): `PricingPage`, `ReferralsPage`, `UsersPage`, `InvitePage`.
- Not wired, no dedicated key section either: `ComparePanel`, `ConfirmDialog`, `UpgradeModal`, `PlanUsageMeter`, `FootballPitch`, `AppFooter`.
- Convention observed across every wired file: dynamic toast/error strings (`showMsg('Failed to ...')`, `ConfirmDialog` messages, inline hint text) are largely left as hardcoded English unless a matching key already existed pre-authored (e.g. `players.generateFailed`, `match.saveFailed`, `schedule.deleteFailed`). Don't invent new keys for every toast — only add one if the string is structural/repeated, and remember to add it to all 9 locale files.
- `validatePlayer.ts` (`openteur/src/utils/validatePlayer.ts`) returns raw English error strings — it's a plain function, not a hook, so it can't call `t()` without threading the translator through as a parameter. Left untranslated; out of scope until someone decides to refactor its signature.
- `openteur/src/i18n/` is currently **untracked in git** (`git status` shows `??`) — nothing under it has ever been committed. Commit it once the remaining pages are wired, or earlier if there's a risk of losing work.

## Internationalization (i18n) — mobile (`mobile/`)
- Fully wired, all 9 languages (`en`, `tr`, `de`, `az`, `pl`, `ru`, `zh`, `ko`, `ja`), mirroring the web setup but as an independent implementation — separate key structure, separate locale files, no code shared with `openteur/src/i18n/`.
- Setup lives in `mobile/i18n/index.ts` + `mobile/i18n/locales/<code>.ts`. Same typed-locale pattern as web: `import type en from './en'; const xx: typeof en = {...}`, so `en.ts` is the source of truth for key shape and any key change must be mirrored in all 9 files or `tsc` fails.
- Unlike web (`localStorage`, synchronous), mobile persists the chosen language in `@react-native-async-storage/async-storage` under the same `ct_lang` key, and init is async: `initI18n()` returns a `Promise` that must be awaited before the app renders. `mobile/app/_layout.tsx`'s `RootLayout` awaits it in a `useEffect` and shows an `ActivityIndicator` gate until ready, before the `AuthProvider`/`PlayerProvider`/`TutorialProvider` tree mounts.
- Device language detection uses `Intl.DateTimeFormat().resolvedOptions().locale` (Hermes/RN's built-in Intl polyfill) rather than adding `expo-localization` as a new native dependency.
- Key sections in `mobile/i18n/locales/*.ts`: `common`, `nav`, `auth`, `tutorial`, `roster`, `match`, `preview`, `crew`, `friends`, `playerForm`, `stats`. Mobile's key names/shape are independent of web's — e.g. `stats.gkPositioning`/`gkSpeed` are explicitly GK-prefixed on mobile (web reuses the shared `positioning`/`speed` keys for both contexts).
- Fully wired screens/components: `(auth)/login`, `(auth)/signup`, `(tabs)/_layout` (tab bar labels), `(tabs)/roster`, `(tabs)/match`, `(tabs)/preview`, `(tabs)/crew`, `(tabs)/friends`, `player/add`, `player/[id]`, `ScreenHeader` (help alert), `ComparePanel`, `TutorialOverlay` + `tutorialSteps.ts` (converted to `titleKey`/`textKey`, same pattern as web), `useGoogleSignIn` hook, `PlayerContext` (load-failure fallback string).
- Same convention as web: the random-player-generator's tier *naming* (`Bronze/Silver/Gold Player N`, used for regex-based sequence numbering) stays hardcoded English in `roster.tsx`'s `RANDOM_TIERS` — only the tier-picker UI labels are translated (`roster.bronze`/`silver`/`gold`), so generated player names stay consistent across languages, matching `PlayersPage`'s tier-naming rule on web.
- `PlayerCard.tsx` (short stat abbreviations only — REF/HAN/DIV/OFF/ATH/DEF) and `Toast.tsx` (message passed as prop) intentionally left untranslated, consistent with web leaving analogous short labels/abbreviations alone.
- Verified with `npx tsc -p tsconfig.json --noEmit` (mobile has no dedicated typecheck script in `package.json`) — clean, no errors.

---

## Dev workflows

```bash
# Full local dev (from repo root — installs each subproject first)
npm start

# Frontend only
cd openteur && npm install && npm run dev

# Backend only
cd server && npm install && npm run dev

# Production builds
npm run build          # backend first, then frontend
npm run lint           # in openteur/

# E2E tests (start frontend + backend first)
cd e2e && npm install && npx playwright install
npm test
```

- Build/test scripts must not run `npm install` as a side-effect. Install explicitly during setup.
- E2E auth uses `E2E_EMAIL` / `E2E_PASSWORD`; falls back to legacy `admin@example.com` / `admin123`. Supply valid Firebase test account in CI.
- Playwright config doesn't start the app — start frontend and backend manually before running E2E.

---

## Deployment

### Frontend → cardteur.com (Cloudflare Workers Assets)
```bash
npm run build          # from repo root
npx wrangler deploy
```
Merging to `main` also triggers automatic Cloudflare deployment via GitHub App.

### Backend → Railway
```bash
git push origin main   # Railway auto-deploys server/ on push to main
```
Railway config: root dir `/server`, build `npm run build`, start `node dist/index.js`, port `8080`.

---

## Environment variables

### `server/.env`
```
MONGO_URI=...
PORT=5002
RESEND_API_KEY=re_...
SMTP_FROM=onboarding@resend.dev
```

### `openteur/.env`
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### Railway service variables
`MONGO_URI`, `RESEND_API_KEY`, `SMTP_FROM`, `FIREBASE_SERVICE_ACCOUNT` (full JSON contents of `serviceAccountKey.json`).

---

## Key dependencies

| Location | Package | Notes |
|---|---|---|
| `openteur/` | `react`, `react-dom`, `react-router-dom` | |
| `openteur/` | `bootstrap`, `bootstrap-icons` | Icons imported in `main.tsx` |
| `openteur/` | `firebase` | Auth only |
| `openteur/` | `vite` | Dev server & bundler |
| `server/` | `express`, `mongoose`, `dotenv` | Use `path.resolve(__dirname, '.env')` for dotenv |
| `server/` | `firebase-admin` | Token verification |
| `server/` | `cors` | Allowlist only |
| `server/` | `resend` | Email sending — NOT nodemailer |
| `e2e/` | `@playwright/test` | Install in `e2e/` only |

---

## Version control

- Jira project key: `CARDTEUR`. GitHub repo: `SarpAkgunduz/cardTeur`.
- Branch naming: `CARDTEUR-{n}-short-description`. Create from Jira story.
- Commit format: `CARDTEUR-{n}: Short description`.
- Workflow: create branch from Jira → develop → commit/push → open PR → merge to main → move story to Done.

---

## Testing

- API tests under `e2e/tests/api-tests/`; frontend tests under `e2e/tests/frontend-tests/`.
- When changing player fields or page selectors, update both API and frontend tests (they use concrete IDs like `#name`, `#preferredPosition`, `#speed`).
- Test edge cases and error paths — e.g. required field missing → expect the specific error toast.
- Some existing tests have stale assumptions (wrong ports/routes). Verify against current source before extending.
- Random player generator covered by `e2e/tests/frontend-tests/random-player-generator.spec.ts` — keep aligned when changing tier logic.

---

## Known gotchas

| Problem | Cause | Fix |
|---|---|---|
| `Failed to fetch` on port 5001 | macOS AirPlay Receiver occupies 5001 | Use port 5002 |
| Favicon not showing | Case mismatch: `pageLogo` vs `pagelogo` | Use `/pageLogo/logo.png` |
| `Missing API key` for Resend | dotenv wrong cwd | `dotenv.config({ path: path.resolve(__dirname, '../.env') })` |
| `connect ECONNREFUSED 127.0.0.1:587` | Old nodemailer code still running | Restart server |
| Firebase Admin fails to init | `serviceAccountKey.json` missing | Download from Firebase Console → Project Settings → Service Accounts |
| `Cannot find module 'resend'` | Not installed | `cd server && npm install resend` |
