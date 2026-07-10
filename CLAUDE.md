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

## Billing & Plans

- Real system, not a stub — do not assume it's placeholder work just because it's undocumented above this line.
- `server/config/plans.ts`: `Plan = 'free' | 'premium' | 'premium_plus'`. `PLAN_LIMITS` table drives `maxPlayers` (22/44/∞), `maxCrews` (1/5/∞), `maxFriends` (25/∞/∞), `matchHistoryMonths` (3/12/60), `fullResImages`, `analytics`, `referralSlots` (0/1/6).
- `server/services/planService.ts` (`getUserPlan`/`getUserLimits`) is consumed directly by `players.ts` (blocks create at `maxPlayers`, 403 `PLAN_LIMIT_PLAYERS`), `crews.ts` (`maxCrews`), `users.ts` (`maxFriends`), `matches.ts` (`matchHistoryMonths`) — enforcement is real and DB-driven, not per-route hardcoding.
- `User` model carries `plan`, `planRenewsAt`, `billingProvider`, `billingCustomerId`, `billingSubscriptionId`, `referralRewardMonths`.
- Referrals (`server/models/Referral.ts`, `referralService.ts`) are wired to `referralSlots` and grant a free month via `referralRewardMonths` on redemption — triggered from `applySubscriptionEvent` on `'activated'`.

### Provider routing (`server/services/billing/index.ts`)
- `providerForRegion(countryCode)`: `TR` → iyzico, everything else → Paddle. Frontend passes `countryCode` in the `/api/billing/checkout` request body.
- `getAdapter(provider)` returns `paddleAdapter` or `iyzicoAdapter`, both implementing the shared `BillingAdapter` interface (`server/services/billing/types.ts`): `createCheckout(params)` and `verifyAndParse(rawBody, headers)`.
- `verifyAndParse` may return a `Promise` (iyzico needs an async lookup) or a plain value (Paddle verifies synchronously via HMAC) — the union return type covers both; `routes/billing.ts` always `await`s it.
- `applySubscriptionEvent(provider, event)` is the single place that writes `User.plan`/`billingProvider`/etc. and fires referral rewards — both adapters funnel into it, don't duplicate this logic per-provider.

### Paddle adapter (`server/services/billing/paddle.ts`) — real, just unconfigured
- Calls Paddle's REST API directly via `fetch` (no SDK) — `POST {PADDLE_API}/transactions` for checkout, returns `{ url }` for a straight `window.location` redirect on the frontend.
- `PADDLE_API()` picks sandbox vs production host from `PADDLE_ENV`.
- Webhook (`POST /api/billing/webhook/paddle`) verifies the `paddle-signature` header via HMAC-SHA256 against `PADDLE_WEBHOOK_SECRET`, maps `subscription.activated/created` → `activated`, `subscription.updated` → `updated`, `subscription.canceled` → `canceled`.
- `custom_data.uid`/`custom_data.tier`/`custom_data.referralCode` set at checkout time are echoed back on the webhook — this is how we map a Paddle event back to a Firebase uid.
- **Not yet functional in this environment**: no `PADDLE_API_KEY`/`PADDLE_PRICE_*`/`PADDLE_WEBHOOK_SECRET` are set in `server/.env`. Checkout will 502 until a real Paddle account/product/prices are created and the env vars below are filled in.

### iyzico adapter (`server/services/billing/iyzico.ts`) — implemented, not yet sandbox-verified
- Uses the `iyzipay` npm SDK (callback-based, wrapped in `Promise`s here) + `@types/iyzipay` for types. Client is lazily constructed from `IYZICO_API_KEY`/`IYZICO_SECRET_KEY`, host picked via `IYZICO_BASE_URL` (a full URL, sandbox vs prod, matching `MONETIZATION_HANDOFF.md`'s convention — not an env-name flag like Paddle's `PADDLE_ENV`).
- `createCheckout` calls `subscriptionCheckoutForm.initialize` and returns `formHtml` (the `checkoutFormContent` iyzico gives back), **not** a `url`. This is a real difference from Paddle — **the frontend (`PricingPage.tsx`) does not handle this yet**; it currently only does `window.location = result.url`, which will be `undefined` for iyzico. Needs a follow-up to render `formHtml` (e.g. in an iframe/container) before iyzico checkout can actually work end-to-end.
- **identityNumber (TC Kimlik No) gap**: iyzico's Subscription Customer model requires `name`, `surname`, `identityNumber` — none of these are collected anywhere in the app today (`ProfilePage`/`AddPlayerForm` don't ask for it). `createCheckout` throws a clear error if `CheckoutParams.iyzico` isn't supplied. A small form (probably on `PricingPage` before initiating a TR checkout) needs to collect this before the iyzico path can be used for real.
- `conversationId` is set to the Firebase `uid` at initialize time (iyzico's equivalent of Paddle's `custom_data`) and read back via `subscription.retrieve` in the webhook handler — **not verified against a live sandbox**, confirm iyzico actually echoes it back before relying on it in production.
- Webhook verification pattern is deliberately "retrieve to confirm": iyzico has no HMAC secret like Paddle's, so `verifyAndParse` only reads a reference code off the raw webhook body (field name guessed — `subscriptionReferenceCode`/`iyziReferenceCode`/`referenceCode`, unverified), then calls `subscription.retrieve` and trusts iyzico's authoritative response instead of the webhook payload directly.
- **Before going live**: create a real iyzico sandbox account, confirm the actual webhook payload shape, confirm `conversationId` round-trips, and decide how/where to collect identity number + build the `formHtml` frontend rendering.
- Full original design rationale (tiers, pricing, referral discount mechanics, R2 image migration, mobile IAP plan) lives in `MONETIZATION_PLAN.md`; build status / manual to-do list lives in `MONETIZATION_HANDOFF.md` — both at repo root. Read those before making further billing changes, they're more detailed than this section.

### Env vars this subsystem needs (not yet in `server/.env`)
```
PADDLE_API_KEY=...
PADDLE_ENV=sandbox            # or production
PADDLE_PRICE_PREMIUM_MONTHLY=...
PADDLE_PRICE_PREMIUM_ANNUAL=...
PADDLE_PRICE_PREMIUM_PLUS_MONTHLY=...
PADDLE_PRICE_PREMIUM_PLUS_ANNUAL=...
PADDLE_WEBHOOK_SECRET=...

IYZICO_API_KEY=...
IYZICO_SECRET_KEY=...
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com   # prod: https://api.iyzipay.com
IYZICO_CALLBACK_URL=...        # where iyzico redirects after the hosted checkout form completes
IYZICO_PLAN_PREMIUM_MONTHLY=...
IYZICO_PLAN_PREMIUM_ANNUAL=...
IYZICO_PLAN_PREMIUM_PLUS_MONTHLY=...
IYZICO_PLAN_PREMIUM_PLUS_ANNUAL=...
```

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
- Key sections in `locales/*.ts`: `common`, `nav`, `landing`, `home`, `auth`, `tutorial`, `players`, `playerForm`, `stats`, `preview`, `match`, `schedule`, `crew`, `friends`, `profile`, `mdm`, `pricing`. `referrals`, `users`, `invite` have **no key section yet** — add one before wiring those pages.
- Fully wired (all structural UI text uses `t()`): `LandingPage`, `HomePage`, `LoginPage`, `SignupPage`, `PlayersPage`, `PreviewPage`, `MatchPage`, `SchedulePage`, `CrewPage`, `FriendsPage`, `ProfilePage`, `AddPlayerForm` (+ its `usePlayerForm` hook, which supplies the `stats.*` labels for `StatGrid`), `Navbar` (includes a `/pricing` link in `NAV_LINKS`, key `nav.pricing`), `PricingPage`, `GoogleSignInButton`, `MatchDetailsModal`, `tutorial/TutorialOverlay` (via `titleKey`/`textKey` in `tutorialSteps.ts`).
- `PricingPage`'s tier names (`Free`/`Premium`/`Premium+`) are translated per-locale (`pricing.freeName` etc.) — unlike card tiers (`Bronze`/`Silver`/`Gold`), there's no name-matching/regex logic depending on these staying English, so full translation was the simpler, more correct choice.
- Not wired at all (no `t()` calls, no key section): `ReferralsPage`, `UsersPage`, `InvitePage`.
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
Billing (`PADDLE_*`, `IYZICO_*`) and R2 (`R2_*`) env vars are also expected by the code but not yet present in this file — see `## Billing & Plans` above and `MONETIZATION_HANDOFF.md` for the full list and setup steps.

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
