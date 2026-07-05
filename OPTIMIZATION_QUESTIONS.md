# Optimization — items needing your decision

Date: 2026-07-03

These are optimizations I did **not** apply because each changes behavior, depends on
external config, or has a trade-off only you should decide. Pick the ones you want and
I'll implement them.

---

## 1. Wire the frontend to R2 uploads (the real cost win) ⭐ — ✅ DONE (2026-07-03)

`ProfilePage` already uploaded profile photos to R2. The remaining gap was the **player
`cardImage`** path, which still stored base64. Now wired in `usePlayerForm.handleSubmit`:
if `cardImage` is a `data:` URL it's POSTed to `/api/uploads/image` and the returned R2
URL is stored instead. Linked-user photos (already URLs) are skipped. No schema change.

⚠️ **Runtime prerequisite:** this depends on `R2_*` env vars being set in whatever
environment runs the API (same dependency `ProfilePage` already has). Local `server/.env`
currently has **no** `R2_*` vars — set them to test image upload locally. Confirm Railway
has them before relying on it in production.

**Still open (was part of this item):** run the one-time migration script
(`server/scripts/migrateImagesToR2.ts`) once to move *existing* base64 images out of Mongo.
Also the free-tier "downscale to standard res" cap (§6.4) is deferred with limit
enforcement — images are already compressed to 320px webp for everyone via
`imageCompression.ts`.

---

## 2. Turn on plan limit guards (monetization §4)

**Current:** I added the foundation — `server/config/plans.ts`, `User.plan` field
(default `free`), and `planService.getUserPlan/getUserLimits`. **Nothing enforces yet.**

**Proposed:** add count guards to the create routes:
- `routes/players.ts` `POST /` → block at `maxPlayers` (free 22) with `403 PLAN_LIMIT_PLAYERS`
- `routes/crews.ts` `POST /` → block at `maxCrews` (**free = 1**) with `403 PLAN_LIMIT_CREWS`
- users friend-add → block at `maxFriends` (free 25) with `403 PLAN_LIMIT_FRIENDS`

**Why it's a decision:**
- **Free = 1 crew** is aggressive — anyone (including the e2e test account) with >1 crew
  can't create more, and the crew/player e2e specs that create fixtures could start failing.
- It's a real user-facing behavior change and a DB-backed policy — your call on timing.

**Decision:** enable now, or wait until the pricing page + upgrade modal exist so users
have a path to unlock?

---

## 3. `.lean()` on read-only Player queries

**Current:** list/read endpoints return full Mongoose documents.

**Blocker:** `Player.cardTitle` is a **virtual** — `.lean()` drops virtuals, so responses
would silently lose `cardTitle`. Can't blindly add it.

**Options:** (a) add `.lean({ virtuals: true })` where supported, or (b) leave as-is.
Modest perf gain; risk of dropping `cardTitle` if done carelessly.

**Decision:** worth it, or skip?

---

## 4. Field projection (`.select(...)`) on list endpoints

Player documents carry many stat fields. List views (roster, preview, match picker) may
not need all of them, so responses could be trimmed with `.select()` to cut payload size.

**Why it's a decision:** I'd need to know which fields each frontend view actually reads —
trimming the wrong one breaks a card silently. Requires a per-view audit with you.

---

## 5. `GET /api/players/:id` — `findById` + `canEditPlayer` vs strict `ownerUid` scope

`routes/players.ts:34` does `Player.findById(id)` then gates with `canEditPlayer(id, uid)`
(403 if not allowed). CLAUDE.md says "never `findById` alone — always `ownerUid` guard."
It's **not** unguarded (the `canEdit` check protects it), but it intentionally allows
edit-permitted users (crew editors / linked users), which strict `ownerUid` scoping would
break.

**Decision:** is the broader `canEditPlayer` access intended here (leave as-is), or should
this endpoint be owner-only (tighten to `find({ _id, ownerUid })`)?

---

## 6. Drop `express.json({ limit: '10mb' })` after R2 wiring

The 10mb body limit exists because base64 images are POSTed inline. Once #1 (R2 upload)
lands, request bodies shrink dramatically and this limit can be lowered — smaller memory
footprint and attack surface. **Depends on #1.**

---

## 7. Route-level code splitting (frontend bundle)

`openteur/src/App.tsx` imports all pages eagerly. Converting routes to `React.lazy` +
`Suspense` would cut the initial JS bundle so first paint doesn't download Match/Preview/
Profile code up front.

**Why it's a decision:** adds loading states and needs a smoke test across routes; low risk
but touches every route. Want it?
