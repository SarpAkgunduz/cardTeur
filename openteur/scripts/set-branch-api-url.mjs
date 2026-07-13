// Cloudflare Workers Builds injects WORKERS_CI_BRANCH with the branch being built.
// On `main` (production), point at the production Railway backend. On any other
// branch (dev preview builds), point at the Railway `development` backend instead.
// Writes .env.production.local, which Vite loads automatically during `vite build`
// (production mode) with higher priority than .env — no effect on `vite dev`.
//
// vite.config.ts sets envDir: '../' (Vite looks for .env files one directory up
// from openteur/, i.e. the repo root) — this script must write there too, not into
// openteur/ itself, or Vite silently never sees it.
//
// Also writes VITE_PADDLE_CLIENT_TOKEN/VITE_PADDLE_ENV here rather than relying on
// a Cloudflare dashboard build variable — Cloudflare Workers Builds env vars aren't
// addable in this account currently, and Paddle client-side tokens are designed to
// be public in browser code (like a Stripe publishable key), so hardcoding the
// sandbox one is safe. Swap in a real production client token once Paddle prod is live.
import { writeFileSync } from 'fs';
import path from 'path';

const branch = process.env.WORKERS_CI_BRANCH;
const isMain = !branch || branch === 'main';

const apiUrl = isMain
  ? 'https://cardteur-production.up.railway.app/api'
  : 'https://cardteur-development.up.railway.app/api';

// TODO: replace with a real production client-side token once Paddle production is set up.
const PADDLE_SANDBOX_CLIENT_TOKEN = 'test_aa2429491cbc014b23bf36de842';

const lines = [`VITE_API_BASE_URL=${apiUrl}`];
if (!isMain) {
  lines.push(`VITE_PADDLE_CLIENT_TOKEN=${PADDLE_SANDBOX_CLIENT_TOKEN}`);
  lines.push('VITE_PADDLE_ENV=sandbox');
}

const targetPath = path.resolve(process.cwd(), '..', '.env.production.local');
writeFileSync(targetPath, lines.join('\n') + '\n');

console.log(`[set-branch-api-url] branch=${branch ?? '(none — defaulting to production)'} -> VITE_API_BASE_URL=${apiUrl}`);
console.log(`[set-branch-api-url] wrote ${targetPath}`);
