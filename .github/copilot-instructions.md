# CardTeur agent guide

## Workspace shape
- This repo is split into three separate TypeScript projects: `openteur/` (Vite + React frontend), `server/` (Express + Mongoose API), and `e2e/` (Playwright tests). There is no root package that orchestrates them.
- Treat `openteur/src/services/api/types.ts` and `server/models/Player.ts` as the shared contract for the `Player` entity. When adding/removing fields, update both sides together and keep Playwright fixtures in `e2e/tests/api-tests/players.spec.ts` aligned.
- The root `README.md` is partially outdated (for example it mentions `index.js`); prefer the actual source files and package scripts as the source of truth.

## Frontend architecture
- Routing is defined centrally in `openteur/src/App.tsx`. Protected pages use `PrivateRoute`; `/manage`, `/preview`, `/match`, `/add`, and `/edit-player/:id` all require authentication.
- Authentication uses **Firebase Auth** (Email/Password). `openteur/src/contexts/AuthContext.tsx` wraps the whole app with `<AuthProvider>` and exposes `currentUser`, `signIn`, and `signOut` via the `useAuth()` hook. `PrivateRoute` and `PublicRoute` both use `useAuth()` — never use the old `isLoggedIn()` pattern.
- `openteur/src/services/AuthService.tsx` now only exports `getCurrentUserToken()` which returns the Firebase ID token for authenticated API requests. All other auth logic lives in `AuthContext.tsx`.
- `openteur/src/firebase.ts` initialises the Firebase app from `VITE_FIREBASE_*` environment variables defined in `openteur/.env`. Never hardcode Firebase config values in source files.
- `PlayersPage.tsx` is the CRUD hub: it fetches players on mount, toggles delete/edit/compare modes locally, and renders reusable `Card` components plus the `ComparePanel` offcanvas.
- `AddPlayerForm.tsx` handles both create and edit flows. It loads an existing player when `:id` is present, calculates `offensiveOverall`, `defensiveOverall`, `athleticismOverall`, and derives `cardTitle` before submit. Preserve that derived-data flow when changing form fields.
- `MatchPage.tsx` currently bypasses `playerApi` and calls `fetch('http://localhost:5001/api/players')` directly. If you change API URLs or error handling, update both `openteur/src/services/api/apiClient.ts` and `openteur/src/pages/MatchPage.tsx`.
- Frontend styling mixes Bootstrap with local CSS files per page/component (`pages/*.css`, `components/*.css`) plus shared setup in `openteur/src/styles/global.css` and `openteur/src/main.tsx`.
On both frontend and backend, make sure files are not bloated with another feature, for example if we are on a view file, and there are too many component checks and conditions, we can extract some logic to a helper file or a custom hook. Avoid putting unrelated features in the same file to keep things modular and maintainable.Readability and structure are more important than saving a few lines of code by merging features into the same file. If you find yourself adding a new feature that doesn't fit the existing file's purpose, consider creating a new file for it and importing it where needed. This keeps the codebase organized and easier to navigate for future developers.
- For visual consistency check \cardTeur\stylepreset file and use the colors and styles defined there when adding new UI elements or updating existing ones. This helps maintain a cohesive look and feel across the application, ensuring that all components align with the established design language. When in doubt about styling choices, refer back to the style preset to guide your decisions and keep the user interface consistent and visually appealing.
- On forms or sections that should be filled by users, if there are any fields that are required, make sure to add an asterisk (*) next to the field label and implement validation to prevent form submission until those fields are filled. This helps improve user experience by clearly indicating which fields are mandatory and ensuring that necessary information is collected before processing the form. Additionally, consider providing helpful error messages or visual cues to guide users in completing the required fields correctly. Also if the required fields are not filled, show a toast notification or an alert to inform the user about the missing information directly like "please fill this/these field/fields: before submitting"
- Try to add fluent animations for users to feel page is more responsive and smooth, for example when opening the compare panel, or when hovering over a player card, or when toggling edit mode. Use CSS transitions or keyframe animations to enhance the user experience without overwhelming it. Keep animations subtle and consistent with the overall design language of the application, ensuring they enhance usability rather than distract from it. When implementing animations, consider the performance implications and test them across different devices to ensure they run smoothly without causing lag or jank in the user interface.

## Backend architecture
- The API server boots from `server/index.ts`, enables JSON parsing, and mounts routers: `/api/players` and `/api/match`.
- The backend assumes MongoDB is available through `server/.env` with `MONGO_URI`. Default API port is `5001`; CORS is hard-coded to `http://localhost:5173`.
- `server/routes/players.ts` is protected by `requireAuth` middleware (applied via `router.use(requireAuth)` at the top). All player CRUD endpoints require a valid Firebase ID token.
- `server/middleware/auth.ts` exports `requireAuth`: verifies the `Authorization: Bearer <token>` header using Firebase Admin SDK, attaches `uid` and `email` to the request object.
- `server/firebaseAdmin.ts` initialises Firebase Admin SDK from `server/serviceAccountKey.json`. This file must NEVER be committed — it is listed in `.gitignore`.
- `server/serviceAccountKey.json` is the Firebase service account private key. Download from Firebase Console → Project Settings → Service Accounts → Generate new private key. Keep it local only.
- On both frontend and backend, make sure files are not bloated with another feature, for example if we are on a view file, and there are too many component checks and conditions, we can extract some logic to a helper file or a custom hook. Avoid putting unrelated features in the same file to keep things modular and maintainable. Readability and structure are more important than saving a few lines of code by merging features into the same file. If you find yourself adding a new feature that doesn't fit the existing file's purpose, consider creating a new file for it and importing it where needed. This keeps the codebase organized and easier to navigate for future developers.
## Project-specific coding patterns
- Use the service barrel in `openteur/src/services/index.ts` when importing `playerApi`, `Player`, or auth helpers.
- `apiRequest()` in `openteur/src/services/api/apiClient.ts` always sends JSON, automatically attaches a Firebase `Authorization: Bearer <token>` header via `getCurrentUserToken()`, and throws on non-2xx responses. Keep new API helpers consistent with that pattern.
- Form feedback is commonly shown with `ToastNotification` or browser dialogs (`window.confirm`, `alert`) rather than a centralized error system.
- `AdminRoute.tsx` exists but is not wired into `App.tsx`; do not assume role-based routing is active unless you add the route usage too.

## Dev workflows
- Frontend local dev: run `npm install` then `npm run dev` in `openteur/`.
- Backend local dev: run `npm install` then `npm run dev` in `server/`.
- Frontend production build/lint: `npm run build` and `npm run lint` in `openteur/`.
- Backend compile/run-dist: `npm run build` and `npm run start:dist` in `server/`.
- Playwright has no package scripts in `e2e/package.json`; run tests from `e2e/` with `npx playwright test`.
- Playwright config does not start the app for you (`webServer` is commented out), so start frontend and backend manually before running E2E.

## Version control & project management
- The project is managed with **Jira** (project key: `CARDTEUR`) and source code is hosted on **GitHub** (repo: `SarpAkgunduz/cardTeur`).
- Remote is set to GitHub: `https://github.com/SarpAkgunduz/cardTeur.git`
- Jira is integrated with GitHub via the **GitHub for Atlassian** app; the Jira **Kod** tab shows branches, commits and PRs linked to stories.
- Branch naming: always prefix with the Jira story key — `CARDTEUR-{n}-short-description` (e.g. `CARDTEUR-2-mail-ozellikleri`). Create branches from the story's **Create branch** button inside Jira.
- Commit message format: `CARDTEUR-{n}: Short description of what was done`
- Workflow per story: create branch from Jira → develop → commit/push → open PR on GitHub → merge to main → move story to Done.

## Backend service architecture
- Business logic that is not trivial CRUD must live in `server/services/` — keep routes thin (validation + service call only).
- `server/services/emailService.ts` handles all SMTP logic via nodemailer. SMTP credentials are read from `server/.env` (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`).
- `POST /api/match/announce` sends match announcement emails to all players who have an email address; implemented in `server/routes/match.ts`.

## Player entity notes
- `email` is an optional field (`email?: string`) on both `server/models/Player.ts` and `openteur/src/services/api/types.ts`. It is never required — skip in validation checks.
- `cardTitle` is a virtual computed by the backend — never store or send it in create/update requests.

## Testing and integration notes
- `e2e/global-setup.ts` previously used hardcoded fake credentials (`admin@example.com` / `admin123`) with a localStorage session. This is now **stale** — auth is real Firebase Auth. The global setup must be updated to sign in via Firebase before running E2E tests.
- `openteur/src/pages/LoginPage.tsx` now uses `useAuth().signIn()` (Firebase) and shows a loading state (`isSubmitting`) while authenticating. There is no more hardcoded credential check.
- Some Playwright tests contain stale assumptions (for example `e2e/tests/frontend-tests/players-page.spec.ts` uses `http://localhost:3000` and `/edit` while the app routes are `/manage` and port `5173`). Verify routes and ports against current source before extending those tests.
- When changing player fields or page selectors, update both API tests and frontend tests because they interact with concrete form IDs like `#name`, `#preferredPosition`, and `#speed`.
- On tests follow edge cases and error handling paths as well, for example if there is a new required field in the player form, add tests that try to submit without filling that field and check for the expected error message. This ensures that your changes are robust and that the application behaves correctly even when users make mistakes or encounter unexpected situations. Testing edge cases and error handling is crucial for maintaining a high-quality user experience and preventing bugs from reaching production