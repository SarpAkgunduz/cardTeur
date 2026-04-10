# CardTeur agent guide

## Workspace shape
- This repo is split into three separate TypeScript projects: `openteur/` (Vite + React frontend), `server/` (Express + Mongoose API), and `e2e/` (Playwright tests). There is no root package that orchestrates them.
- Treat `openteur/src/services/api/types.ts` and `server/models/Player.ts` as the shared contract for the `Player` entity. When adding/removing fields, update both sides together and keep Playwright fixtures in `e2e/tests/api-tests/players.spec.ts` aligned.
- The root `README.md` is partially outdated (for example it mentions `index.js`); prefer the actual source files and package scripts as the source of truth.

## Frontend architecture
- Routing is defined centrally in `openteur/src/App.tsx`. Protected pages use `PrivateRoute`; `/manage`, `/preview`, `/match`, `/add`, and `/edit-player/:id` all require a local session.
- Authentication is frontend-only today. `openteur/src/services/AuthService.tsx` stores a 7-day session in localStorage under `openteur:auth:session`; there is no server-side auth or token exchange.
- `PlayersPage.tsx` is the CRUD hub: it fetches players on mount, toggles delete/edit/compare modes locally, and renders reusable `Card` components plus the `ComparePanel` offcanvas.
- `AddPlayerForm.tsx` handles both create and edit flows. It loads an existing player when `:id` is present, calculates `offensiveOverall`, `defensiveOverall`, `athleticismOverall`, and derives `cardTitle` before submit. Preserve that derived-data flow when changing form fields.
- `MatchPage.tsx` currently bypasses `playerApi` and calls `fetch('http://localhost:5001/api/players')` directly. If you change API URLs or error handling, update both `openteur/src/services/api/apiClient.ts` and `openteur/src/pages/MatchPage.tsx`.
- Frontend styling mixes Bootstrap with local CSS files per page/component (`pages/*.css`, `components/*.css`) plus shared setup in `openteur/src/styles/global.css` and `openteur/src/main.tsx`.
On both frontend and backend, make sure files are not bloated with another feature, for example if we are on a view file, and there are too many component checks and conditions, we can extract some logic to a helper file or a custom hook. Avoid putting unrelated features in the same file to keep things modular and maintainable.Readability and structure are more important than saving a few lines of code by merging features into the same file. If you find yourself adding a new feature that doesn't fit the existing file's purpose, consider creating a new file for it and importing it where needed. This keeps the codebase organized and easier to navigate for future developers.
- For visual consistency check \cardTeur\stylepreset file and use the colors and styles defined there when adding new UI elements or updating existing ones. This helps maintain a cohesive look and feel across the application, ensuring that all components align with the established design language. When in doubt about styling choices, refer back to the style preset to guide your decisions and keep the user interface consistent and visually appealing.
- On forms or sections that should be filled by users, if there are any fields that are required, make sure to add an asterisk (*) next to the field label and implement validation to prevent form submission until those fields are filled. This helps improve user experience by clearly indicating which fields are mandatory and ensuring that necessary information is collected before processing the form. Additionally, consider providing helpful error messages or visual cues to guide users in completing the required fields correctly. Also if the required fields are not filled, show a toast notification or an alert to inform the user about the missing information directly like "please fill this/these field/fields: before submitting"
- Try to add fluent animations for users to feel page is more responsive and smooth, for example when opening the compare panel, or when hovering over a player card, or when toggling edit mode. Use CSS transitions or keyframe animations to enhance the user experience without overwhelming it. Keep animations subtle and consistent with the overall design language of the application, ensuring they enhance usability rather than distract from it. When implementing animations, consider the performance implications and test them across different devices to ensure they run smoothly without causing lag or jank in the user interface.

## Backend architecture
- The API server boots from `server/index.ts`, enables JSON parsing, and mounts only one router: `/api/players` from `server/routes/players.ts`.
- The backend assumes MongoDB is available through `server/.env` with `MONGO_URI`. Default API port is `5001`; CORS is hard-coded to `http://localhost:5173`.
- `server/routes/players.ts` is intentionally thin CRUD over the Mongoose model. Validation mostly comes from `PlayerSchema`; frontend validation is stronger than backend validation today.
- On both frontend and backend, make sure files are not bloated with another feature, for example if we are on a view file, and there are too many component checks and conditions, we can extract some logic to a helper file or a custom hook. Avoid putting unrelated features in the same file to keep things modular and maintainable. Readability and structure are more important than saving a few lines of code by merging features into the same file. If you find yourself adding a new feature that doesn't fit the existing file's purpose, consider creating a new file for it and importing it where needed. This keeps the codebase organized and easier to navigate for future developers.
## Project-specific coding patterns
- Use the service barrel in `openteur/src/services/index.ts` when importing `playerApi`, `Player`, or auth helpers.
- `apiRequest()` in `openteur/src/services/api/apiClient.ts` always sends JSON and throws on non-2xx responses. Keep new API helpers consistent with that pattern.
- Form feedback is commonly shown with `ToastNotification` or browser dialogs (`window.confirm`, `alert`) rather than a centralized error system.
- `AdminRoute.tsx` exists but is not wired into `App.tsx`; do not assume role-based routing is active unless you add the route usage too.

## Dev workflows
- Frontend local dev: run `npm install` then `npm run dev` in `openteur/`.
- Backend local dev: run `npm install` then `npm run dev` in `server/`.
- Frontend production build/lint: `npm run build` and `npm run lint` in `openteur/`.
- Backend compile/run-dist: `npm run build` and `npm run start:dist` in `server/`.
- Playwright has no package scripts in `e2e/package.json`; run tests from `e2e/` with `npx playwright test`.
- Playwright config does not start the app for you (`webServer` is commented out), so start frontend and backend manually before running E2E.

## Testing and integration notes
- `e2e/global-setup.ts` logs in with hard-coded credentials (`admin@example.com` / `admin123`) and stores browser state in `e2e/auth-state.json`. Most browser tests assume that saved localStorage session exists.
- Login behavior is intentionally fake and local-only in `openteur/src/pages/LoginPage.tsx`; if you replace it with real auth, update route guards and Playwright setup together.
- Some Playwright tests contain stale assumptions (for example `e2e/tests/frontend-tests/players-page.spec.ts` uses `http://localhost:3000` and `/edit` while the app routes are `/manage` and port `5173`). Verify routes and ports against current source before extending those tests.
- When changing player fields or page selectors, update both API tests and frontend tests because they interact with concrete form IDs like `#name`, `#preferredPosition`, and `#speed`.
- On tests follow edge cases and error handling paths as well, for example if there is a new required field in the player form, add tests that try to submit without filling that field and check for the expected error message. This ensures that your changes are robust and that the application behaves correctly even when users make mistakes or encounter unexpected situations. Testing edge cases and error handling is crucial for maintaining a high-quality user experience and preventing bugs from reaching production