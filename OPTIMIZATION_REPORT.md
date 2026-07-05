# Optimization Report — applied changes

Date: 2026-07-03

These are the **obvious, safe, non-behavior-changing** optimizations I applied this session.
Anything that needed a product/design decision is in `OPTIMIZATION_QUESTIONS.md` instead.

---

## 1. Missing database indexes on filtered query fields

Three fields were used directly in MongoDB query filters but had no index, forcing a
full collection scan on every matching query. Added `index: true`:

| Field | Where it's queried | Change |
|---|---|---|
| `Crew.memberUids` | `routes/crews.ts:19` (list crews you're a member of), `routes/users.ts:65` (leave-crew `$pull`) | `models/Crew.ts` → `index: true` (multikey) |
| `Crew.editorUids` | `routes/users.ts:65` (`$or` with memberUids) | `models/Crew.ts` → `index: true` (multikey) |
| `Player.linkedUserId` | `routes/crews.ts:14` (`Player.find({ linkedUserId: uid })`) | `models/Player.ts` → `index: true` |

Why it's safe: indexes don't change document shape, validation, or responses — they only
speed up reads. Mongoose auto-builds them on startup. Existing `ownerUid` indexes
(Player/Crew/Match) and `User.uid`/`User.email` unique indexes were already in place.

Impact: crew-listing and linked-player lookups scale with matching docs instead of the
whole collection. Small now, prevents slowdown as data grows.

---

## 2. Build fix — dead code in MatchPage (unblocks `npm run build`)

`openteur/src/pages/MatchPage.tsx` had three unused declarations that failed
`tsc -b` (`noUnusedLocals`) and blocked the production build:

- `swapPending` / `setSwapPending` state (pre-existing dead code)
- `distributePlayers()` helper (became dead after the bench-only match refactor)

Removed all three. `npx tsc -b` now passes clean. Not strictly a perf optimization, but
a real blocker to shipping — grouped here since it was found during the same pass.

---

## Already-good (verified, no change needed)

- **Query scoping:** player/crew/match reads are already scoped by `ownerUid` and indexed.
- **User search:** exact-match on indexed `uid`/`email` (no regex/fuzzy), as intended.
- **R2 image storage** (see monetization plan §6): backend is fully implemented
  (`r2Service.ts`, `routes/uploads.ts`, migration script) — the single biggest cost win
  (binary blobs out of Mongo). It just needs the `R2_*` env vars set and the frontend
  wired to it (that wiring is a decision item — see `OPTIMIZATION_QUESTIONS.md`).
