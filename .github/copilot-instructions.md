# CardTeur agent guide

## Workspace shape
- This repo is split into three separate TypeScript projects: `openteur/` (Vite + React frontend), `server/` (Express + Mongoose API), and `e2e/` (Playwright tests). The root `package.json` only orchestrates selected build/test commands; package dependencies still live in each subproject.
- Treat `openteur/src/services/api/types.ts` and `server/models/Player.ts` as the shared contract for the `Player` entity. When adding/removing fields, update both sides together and keep Playwright fixtures in `e2e/tests/api-tests/players.spec.ts` aligned.
- Prefer the actual source files and package scripts as the source of truth when docs drift.

## Frontend architecture
- Routing is defined centrally in `openteur/src/App.tsx`. Protected pages use `PrivateRoute`; `/manage`, `/preview`, `/match`, `/add`, and `/edit-player/:id` all require authentication.
- Authentication uses **Firebase Auth** (Email/Password). `openteur/src/contexts/AuthContext.tsx` wraps the whole app with `<AuthProvider>` and exposes `currentUser`, `signIn`, and `signOut` via the `useAuth()` hook. `PrivateRoute` and `PublicRoute` both use `useAuth()` — never use the old `isLoggedIn()` pattern.
- `openteur/src/services/AuthService.tsx` now only exports `getCurrentUserToken()` which returns the Firebase ID token for authenticated API requests. All other auth logic lives in `AuthContext.tsx`.
- `openteur/src/firebase.ts` initialises the Firebase app from `VITE_FIREBASE_*` environment variables defined in `openteur/.env`. Never hardcode Firebase config values in source files.
- `PlayersPage.tsx` is the CRUD hub: it uses `PlayerContext`, toggles delete/edit/compare modes locally, renders reusable `Card` components plus the `ComparePanel` offcanvas, and owns the "Generate Random Player" card. Random generated players are created through `createPlayer`; tier names must follow `Bronze Player N`, `Silver Player N`, `Gold Player N`, where `N` is the highest visible number for that tier plus one. If no player exists for a tier, start at `1`.
- `AddPlayerForm.tsx` handles both create and edit flows. It loads an existing player when `:id` is present, calculates `offensiveOverall`, `defensiveOverall`, `athleticismOverall`, and derives `cardTitle` before submit. Preserve that derived-data flow when changing form fields.
- `MatchPage.tsx` uses `PlayerContext`, can filter the match pool by a selected crew in the Formation Builder, and must use `gkOverall` whenever the player/slot role is GK. The crew dropdown sits above "Number of Players" and is disabled after the formation is applied so existing lineups are not mutated unexpectedly.
- Frontend styling mixes Bootstrap with local CSS files per page/component (`pages/*.css`, `components/*.css`) plus shared setup in `openteur/src/styles/global.css` and `openteur/src/main.tsx`.
On both frontend and backend, make sure files are not bloated with another feature, for example if we are on a view file, and there are too many component checks and conditions, we can extract some logic to a helper file or a custom hook. Avoid putting unrelated features in the same file to keep things modular and maintainable.Readability and structure are more important than saving a few lines of code by merging features into the same file. If you find yourself adding a new feature that doesn't fit the existing file's purpose, consider creating a new file for it and importing it where needed. This keeps the codebase organized and easier to navigate for future developers.
- For visual consistency check \cardTeur\stylepreset file and use the colors and styles defined there when adding new UI elements or updating existing ones. This helps maintain a cohesive look and feel across the application, ensuring that all components align with the established design language. When in doubt about styling choices, refer back to the style preset to guide your decisions and keep the user interface consistent and visually appealing.
- On forms or sections that should be filled by users, if there are any fields that are required, make sure to add an asterisk (*) next to the field label and implement validation to prevent form submission until those fields are filled. This helps improve user experience by clearly indicating which fields are mandatory and ensuring that necessary information is collected before processing the form. Additionally, consider providing helpful error messages or visual cues to guide users in completing the required fields correctly. Also if the required fields are not filled, show a toast notification or an alert to inform the user about the missing information directly like "please fill this/these field/fields: before submitting"
- Try to add fluent animations for users to feel page is more responsive and smooth, for example when opening the compare panel, or when hovering over a player card, or when toggling edit mode. Use CSS transitions or keyframe animations to enhance the user experience without overwhelming it. Keep animations subtle and consistent with the overall design language of the application, ensuring they enhance usability rather than distract from it. When implementing animations, consider the performance implications and test them across different devices to ensure they run smoothly without causing lag or jank in the user interface.

## Backend architecture
- The API server boots from `server/index.ts`, enables JSON parsing, and mounts routers: `/api/players`, `/api/match`, and `/api/users`.
- The backend assumes MongoDB is available through `server/.env` with `MONGO_URI`. Default API port is `5002` (changed from 5001 — macOS AirPlay Receiver occupies 5001). In production the server runs on Railway and listens on whatever `PORT` env var Railway injects (configured to 8080 in the Railway dashboard).
- CORS is configured via an `allowedOrigins` allowlist in `server/index.ts`: `https://cardteur.com`, `https://cardteur.sarpakg.workers.dev`, `http://localhost:5173`. Never use `cors({ origin: '*' })` — always add new origins to the list explicitly.
- `server/routes/players.ts` is protected by `requireAuth` middleware (applied via `router.use(requireAuth)` at the top). All player CRUD endpoints require a valid Firebase ID token.
- `server/routes/users.ts` handles user registration, profile updates, account deletion, friend management, and user lookups. All routes are protected by `requireAuth`.
- `server/routes/crews.ts` lists owned crews, crews where the current uid is in `memberUids`, and legacy crews containing a player linked to the current uid. When adding a linked player to a crew, also add the player's `linkedUserId` to `memberUids`; when removing the last linked player for that user, remove that uid from `memberUids`.
- `server/middleware/auth.ts` exports `requireAuth`: verifies the `Authorization: Bearer <token>` header using Firebase Admin SDK, attaches `uid` and `email` to the request object.
- `server/firebaseAdmin.ts` initialises Firebase Admin SDK. In production it reads the `FIREBASE_SERVICE_ACCOUNT` environment variable (a JSON string set as a Railway service variable). Locally it falls back to reading `server/serviceAccountKey.json`. This file must NEVER be committed — it is listed in `.gitignore`.
- `server/serviceAccountKey.json` is the Firebase service account private key. Download from Firebase Console → Project Settings → Service Accounts → Generate new private key. Keep it local only.
- On both frontend and backend, make sure files are not bloated with another feature, for example if we are on a view file, and there are too many component checks and conditions, we can extract some logic to a helper file or a custom hook. Avoid putting unrelated features in the same file to keep things modular and maintainable. Readability and structure are more important than saving a few lines of code by merging features into the same file. If you find yourself adding a new feature that doesn't fit the existing file's purpose, consider creating a new file for it and importing it where needed. This keeps the codebase organized and easier to navigate for future developers.
## User entity & social graph
- `server/models/User.ts` stores `uid`, `email`, `displayName`, `photoURL?`, `friends: string[]` (array of uids), `createdAt`.
- `server/routes/users.ts` exposes:
  - `POST /api/users/register` — called after Firebase signup to persist user in MongoDB
  - `GET /api/users/me` — returns own profile (`uid`, `email`, `displayName`, `photoURL`)
  - `PUT /api/users/profile` — update `displayName` and/or `photoURL`
  - `DELETE /api/users/account` — deletes Firebase account + MongoDB user + removes from all friends arrays
  - `GET /api/users/search?q=` — **exact match only** on `uid` or `email` (both are `unique: true` indexed fields). Never uses regex or collection scan. Returns at most one result.
  - `GET /api/users/friends` — returns full profiles of all friends
  - `POST /api/users/friends/:friendUid` — adds friend bidirectionally (`$addToSet`)
  - `DELETE /api/users/friends/:friendUid` — removes friend bidirectionally
  - `POST /api/users/lookup-by-emails` — bulk lookup by email array (used by CrewPage)
- `FriendsPage.tsx` (`/friends`) has two tabs:
  - **My Friends** — friends list loaded once on mount, filtered client-side (zero DB queries per keystroke)
  - **Add Friend** — user submits exact UID or email, one indexed DB lookup fires only on explicit Search button/Enter
- `InvitePage.tsx` (`/invite/:inviterUid`) — auto-adds the inviter as a friend after login/signup. Requires auth; redirects to `/login?redirect=/invite/:uid` if not logged in.
- Both `LoginPage.tsx` and `SignupPage.tsx` read the `?redirect=` search param and navigate to it after successful auth, so the invite flow survives the login/signup redirect.
- `ProfilePage.tsx` displays the user's Firebase UID with a copy-to-clipboard button under "Account ID", so users can share it for friend lookup.
- `ProfilePage.tsx` stores profile photos in MongoDB through `/api/users/profile` and hydrates them from `/api/users/me`. Do not rely on Firebase `currentUser.photoURL` as the persistent source for CardTeur profile photos.

## Social graph design constraints
- `GET /api/users/search` must only match on indexed fields (`uid` exact, `email` exact). Never add regex or fuzzy search — at scale this causes a full collection scan.
- Profile photo access is scoped: `/users/me` returns only the authenticated user, `/users/friends` returns only friends, and lookup endpoints must receive explicit UID/email lists.
- Friend filtering on the frontend must always be client-side against the already-loaded `friends` array. Never fire a search request on each keystroke against the friends list.
- Use the service barrel in `openteur/src/services/index.ts` when importing `playerApi`, `Player`, or auth helpers.
- `apiRequest()` in `openteur/src/services/api/apiClient.ts` always sends JSON, automatically attaches a Firebase `Authorization: Bearer <token>` header via `getCurrentUserToken()`, and throws on non-2xx responses. Keep new API helpers consistent with that pattern.
- Form feedback is commonly shown with `ToastNotification` or browser dialogs (`window.confirm`, `alert`) rather than a centralized error system.
- `AdminRoute.tsx` exists but is not wired into `App.tsx`; do not assume role-based routing is active unless you add the route usage too.

## Dev workflows
- Full local dev from repo root: after installing `server/` and `openteur/` dependencies, run `npm start` to launch backend and frontend together.
- Build/test scripts must not run `npm install` as a side effect. Install dependencies explicitly in each subproject during setup or CI, then run build/test commands.
- Frontend local dev only: run `npm install` then `npm run dev` in `openteur/`.
- Backend local dev only: run `npm install` then `npm run dev` in `server/`.
- Frontend production build/lint: `npm run build` and `npm run lint` in `openteur/`.
- Backend compile/run-dist: `npm run build` and `npm run start:dist` in `server/`.
- Root `npm run build` runs the backend build first, then the frontend build.
- Playwright config does not start the app for you, so start frontend and backend before running E2E.
- Full E2E auth uses `E2E_EMAIL` and `E2E_PASSWORD` when present, with the legacy `admin@example.com` / `admin123` fallback. Keep CI environments supplied with a valid Firebase test account when running `npm test`.
- To run all Playwright tests from `e2e/`: `npm test` or `npx playwright test`.

## Cloudflare deployment
- The frontend is deployed via **Cloudflare Workers Assets**. Config lives in `wrangler.jsonc` at the repo root.
- `wrangler.jsonc` points `assets.directory` at `openteur/` — Cloudflare serves the Vite build output from there.
- To deploy manually from the repo root, run `npm run deploy`; it runs the full root build first, then `npx wrangler deploy`.
- Cloudflare integration is connected to the GitHub repo; merging a PR to `main` triggers an automatic deployment via the Cloudflare GitHub App.
- `wrangler` CLI must be installed globally or as a dev dependency: `npm install -g wrangler` or `npm install --save-dev wrangler` in the root.
- Never commit Cloudflare API tokens — use `wrangler login` locally or set `CLOUDFLARE_API_TOKEN` as a GitHub Secret for CI.

## Version control & project management
- The project is managed with **Jira** (project key: `CARDTEUR`) and source code is hosted on **GitHub** (repo: `SarpAkgunduz/cardTeur`).
- Remote is set to GitHub: `https://github.com/SarpAkgunduz/cardTeur.git`
- Jira is integrated with GitHub via the **GitHub for Atlassian** app; the Jira **Kod** tab shows branches, commits and PRs linked to stories.
- Branch naming: always prefix with the Jira story key — `CARDTEUR-{n}-short-description` (e.g. `CARDTEUR-2-mail-ozellikleri`). Create branches from the story's **Create branch** button inside Jira.
- Commit message format: `CARDTEUR-{n}: Short description of what was done`
- Workflow per story: create branch from Jira → develop → commit/push → open PR on GitHub → merge to main → move story to Done.

## Backend service architecture
- Business logic that is not trivial CRUD must live in `server/services/` — keep routes thin (validation + service call only).
- `server/services/emailService.ts` handles all email logic via the **Resend SDK** (`npm install resend` in `server/`). Credentials: `RESEND_API_KEY` and `SMTP_FROM` in `server/.env`. Do NOT use nodemailer — it has been removed. `SMTP_HOST/PORT/USER/PASS` vars are unused leftovers and can be deleted.
- `POST /api/match/announce` sends match announcement emails to all players who have an email address; implemented in `server/routes/match.ts`.

## Player entity notes
- `email` is an optional field (`email?: string`) on both `server/models/Player.ts` and `openteur/src/services/api/types.ts`. It is never required — skip in validation checks.
- `linkedUserId` is an optional field (`linkedUserId?: string`) that links a player card to a registered User's `uid`. When set in `AddPlayerForm`, the linked user's `photoURL` is automatically used as `cardImage`. Managed via `usePlayerForm` hook which fetches the friend list and exposes `userOptions` (self + friends) as selectable avatar chips.
- `cardTitle` is a virtual computed by the backend — never store or send it in create/update requests.
- `ownerUid` is a required field on `server/models/Player.ts` (`ownerUid: { type: String, required: true, index: true }`). It is set exclusively by the backend from the verified Firebase token — never sent by the frontend, never accepted from `req.body`.
- `CreatePlayerDto` and `UpdatePlayerDto` in `openteur/src/services/api/types.ts` both `Omit` `ownerUid` (along with `_id` and `cardTitle`) — this is intentional. Do not add `ownerUid` back to these types.
- All player queries are scoped to the authenticated user: `Player.find({ ownerUid: uid })`, `findOne({ _id, ownerUid: uid })`, `findOneAndUpdate({ _id, ownerUid: uid }, ...)`, `findOneAndDelete({ _id, ownerUid: uid })`. Never use `findById` alone on player routes — always include the `ownerUid` guard.
- `server/scripts/migratePlayerOwners.ts` is a one-time migration script that assigned `ownerUid` to legacy players (created before the ownership system). It uses Firebase Admin SDK to look up the uid by email. It should not be run again unless a similar data migration is needed.
- The system is multi-tenant: each authenticated user owns their own player roster. There is no global player list — a user can only see, edit, and delete their own players.

## Testing and integration notes
- `e2e/global-setup.ts` signs in through the real Firebase login form and writes `auth-state.json` for authenticated tests.
- `openteur/src/pages/LoginPage.tsx` now uses `useAuth().signIn()` (Firebase) and shows a loading state (`isSubmitting`) while authenticating. There is no more hardcoded credential check.
- Some Playwright tests contain stale assumptions (for example `e2e/tests/frontend-tests/players-page.spec.ts` uses `http://localhost:3000` and `/edit` while the app routes are `/manage` and port `5173`). Verify routes and ports against current source before extending those tests.
- API-level tests belong under `e2e/tests/api-tests/`; frontend interaction tests belong under `e2e/tests/frontend-tests/`. Do not turn a requested frontend test into an API test without asking first.
- When changing player fields or page selectors, update both API tests and frontend tests because they interact with concrete form IDs like `#name`, `#preferredPosition`, and `#speed`.
- The random player generator is covered by `e2e/tests/frontend-tests/random-player-generator.spec.ts`. Keep this test aligned whenever changing random tier names, ranges, generated naming, or the generator selectors.
- On tests follow edge cases and error handling paths as well, for example if there is a new required field in the player form, add tests that try to submit without filling that field and check for the expected error message. This ensures that your changes are robust and that the application behaves correctly even when users make mistakes or encounter unexpected situations. Testing edge cases and error handling is crucial for maintaining a high-quality user experience and preventing bugs from reaching production
