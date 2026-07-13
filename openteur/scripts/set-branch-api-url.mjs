// Cloudflare Workers Builds injects WORKERS_CI_BRANCH with the branch being built.
// On `main` (production), point at the production Railway backend. On any other
// branch (dev preview builds), point at the Railway `development` backend instead.
// Writes .env.production.local, which Vite loads automatically during `vite build`
// (production mode) with higher priority than .env — no effect on `vite dev`.
import { writeFileSync } from 'fs';

const branch = process.env.WORKERS_CI_BRANCH;
const isMain = !branch || branch === 'main';

const apiUrl = isMain
  ? 'https://cardteur-production.up.railway.app/api'
  : 'https://cardteur-development.up.railway.app/api';

writeFileSync('.env.production.local', `VITE_API_BASE_URL=${apiUrl}\n`);

console.log(`[set-branch-api-url] branch=${branch ?? '(none — defaulting to production)'} -> VITE_API_BASE_URL=${apiUrl}`);
