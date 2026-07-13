// Cloudflare Workers Builds injects WORKERS_CI_BRANCH with the branch being built.
// On `main` (production), point at the production Railway backend. On any other
// branch (dev preview builds), point at the Railway `development` backend instead.
// Writes .env.production.local, which Vite loads automatically during `vite build`
// (production mode) with higher priority than .env — no effect on `vite dev`.
//
// vite.config.ts sets envDir: '../' (Vite looks for .env files one directory up
// from openteur/, i.e. the repo root) — this script must write there too, not into
// openteur/ itself, or Vite silently never sees it.
import { writeFileSync } from 'fs';
import path from 'path';

const branch = process.env.WORKERS_CI_BRANCH;
const isMain = !branch || branch === 'main';

const apiUrl = isMain
  ? 'https://cardteur-production.up.railway.app/api'
  : 'https://cardteur-development.up.railway.app/api';

const targetPath = path.resolve(process.cwd(), '..', '.env.production.local');
writeFileSync(targetPath, `VITE_API_BASE_URL=${apiUrl}\n`);

console.log(`[set-branch-api-url] branch=${branch ?? '(none — defaulting to production)'} -> VITE_API_BASE_URL=${apiUrl}`);
console.log(`[set-branch-api-url] wrote ${targetPath}`);
