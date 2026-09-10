# Voting System — Design & Implementation Plan

## 1. What we're building

After a match, crew members nudge each other's individual card sub-stats up or down — e.g. +3 Dribbling, -2 Stamina — rather than rating broad categories. It mirrors editing a card in `AddPlayerForm`, just crowd-sourced. A crew leader controls whether voting opens automatically after a match, and can also start a voting session manually (e.g. if a match was never logged in the app).

Decisions locked in from planning discussion (2026-09-10; revised same day — see note below):
- **Who votes:** any crew member (`memberUids` or `editorUids` — not just the people who actually played that match).
- **What's voted on:** every individual sub-stat on the target's card — the same fields `AddPlayerForm` exposes (Dribbling, Shot Accuracy, Short Pass, Tackling, Stamina, etc. for outfield players; Diving, Handling, Kicking, Reflexes, GK Positioning, GK Speed for a `GK`) — **not** a single per-category score. There's no "+3 Offense"; a voter picks specific stats to nudge and can leave the rest untouched. *(Revised from the original "three category scores" decision per your 2026-09-10 follow-up.)*
- **Vote unit:** each touched stat gets a direct ±3 nudge from each voter, not a 1–10 rating that gets converted to a delta — this is the actual mental model the feature is built around.
- **Effect on stats:** bounded nudge, not a replacement. The averaged vote shifts the existing stat by a small clamped amount (±3 max), so one bad voting session can't tank a card.
- **Trigger:** crew-level setting, leader-controlled.
  - Auto-trigger toggle: when on, saving/announcing a match for that crew opens a voting session automatically.
  - Manual trigger: leader can start a custom voting session anytime, independent of a saved `Match` document (covers "forgot to log the match").
  - Voting window: leader sets how long a session stays open (hours/days) before it auto-closes and tallies.

## 2. The structural gap this exposes

`server/models/Match.ts`'s `MatchPlayerDoc` sub-schema is `{ _id: false }` and only stores `name`, `email?`, `preferredPosition?`, `role`, `x`, `y` — a denormalized snapshot with **no reference back to a real `Player._id` or `User.uid`**. Voting needs to know exactly which `Player` document (and, if linked, which `User`) is being rated, so this has to change first. This is a database schema change — per CLAUDE.md, needs your explicit go-ahead before it's written, not just before it's committed.

Proposed fix: add `playerId?: ObjectId` (ref `Player`) and `linkedUserId?: string` to `MatchPlayerDoc`, populated at save time from the roster already in memory on `MatchPage.tsx` (the frontend already has full `Player` objects when it builds `teamA`/`teamB` — it's just not sending the id today). Existing historical matches won't have this field; voting sessions against old matches would have nothing to key off, so manual/custom sessions (which pick players directly from the crew roster, not from a `Match` document) become the practical fallback for anything logged before this ships.

## 3. New data models

### `Crew` — add voting settings (embedded, not a new collection)
```ts
votingSettings: {
  autoTriggerEnabled: boolean,   // default false
  windowHours: number,           // default e.g. 48
}
```
Editable only by `ownerUid` / `editorUids`.

### `VotingSession` (new collection)
```ts
crewId: ObjectId (ref Crew)
matchId?: ObjectId (ref Match)      // null for manual/custom sessions
participants: [{ playerId: ObjectId, linkedUserId?: string, name: string }]
status: 'open' | 'closed'
opensAt: Date
closesAt: Date
createdByUid: string
statsApplied: boolean               // guards against double-tallying on close
createdAt: Date
```

### `Vote` (new collection)
```ts
sessionId: ObjectId (ref VotingSession)
voterUid: string
targetPlayerId: ObjectId
statDeltas: Record<string, number>   // e.g. { dribbling: 3, stamina: -2 } — keys are Player sub-stat field names, values in [-3, 3]; only stats the voter actually touched are present
createdAt: Date
```
Unique index on `(sessionId, voterUid, targetPlayerId)` — one vote per voter per target per session, upsert to allow changing a vote while the session is still open.

Which stats are offered on the voting screen depends on the target's `preferredPosition`: the 16 outfield sub-stats (`dribbling` … `stamina`, per `server/models/Player.ts`) for anyone but a `GK`, or the 6 GK sub-stats (`diving` … `gkSpeed`) for a `GK`.

Self-votes: exclude the voter from their own participant list on the voting screen (a player shouldn't rate themselves).

## 4. Backend

New `server/routes/voting.ts`, business logic in `server/services/votingService.ts` (routes stay thin, per existing convention).

Endpoints (all behind `requireAuth`):
- `GET /api/crews/:crewId/voting-settings` / `PUT /api/crews/:crewId/voting-settings` — leader-only (`ownerUid`/`editorUids` check).
- `POST /api/crews/:crewId/voting-sessions` — manual/custom session. Body: participant player IDs, optional window override. Leader-only.
- `GET /api/crews/:crewId/voting-sessions/active` — the open session for this crew, if any (drives the "voting screen is available" prompt on the frontend).
- `POST /api/voting-sessions/:id/votes` — submit/update this voter's scores for one target player. Rejects if session isn't `open` or has passed `closesAt`.
- `POST /api/voting-sessions/:id/close` — manual early close (leader) — also the same code path a scheduled job or lazy on-read check uses when `closesAt` has passed.

Auto-trigger hook: in the existing `POST /api/matches/:id/announce` handler, after marking `announced = true`, check the match's crew's `votingSettings.autoTriggerEnabled`; if on, create a `VotingSession` from that match's roster (this is why `playerId` needs to exist on `MatchPlayerDoc` — this hook needs real player ids to build `participants`).

### Tally logic (on session close)
For each participant, for each sub-stat that received at least one vote:
1. Average the submitted deltas for that stat across only the voters who touched it (a stat nobody voted on is skipped entirely — no votes, no change).
2. Round to the nearest integer and clamp to `[-3, +3]` — same anti-volatility bound as before, just applied per sub-stat instead of per category.
3. `Player[statKey] = clamp(current + delta, 1, 99)`.
4. After all sub-stat deltas for a participant are applied, recompute `offensiveOverall` / `defensiveOverall` / `athleticismOverall` (or `gkOverall` for a `GK`) using the **exact same averaging formula `usePlayerForm.ts` already uses client-side** on every manual card edit, so voting-driven changes and manual edits can never drift apart:
   - `offensiveOverall = avg(dribbling, shotAccuracy, shotSpeed, headers, ballControl, vision, positioning, longPass, shortPass)`
   - `defensiveOverall = avg(tackling, interceptions, marking)` *(note: `defensiveIQ` exists as a field but isn't part of this average today — matches current `usePlayerForm.ts` behavior, not something this feature changes)*
   - `athleticismOverall = avg(speed, strength, stamina)`
   - `gkOverall = avg(diving, handling, kicking, reflexes, gkPositioning, gkSpeed)`
   Worth extracting this formula into one shared function both `usePlayerForm.ts` and `votingService.ts` call, so they can't silently diverge later — an implementation detail for build time, not a design change.
5. Set `statsApplied = true` on the session so a retry/duplicate close never double-applies.

## 5. Frontend

- **Crew settings**: extend `CrewPage` (or a new settings sub-view within it, since `CrewPage` already owns crew-level concerns per the page-responsibility table) with a "Voting" section: auto-trigger toggle, window-hours input, "Start voting now" button (opens a player-picker over the crew roster, then POSTs a manual session). Leader-only — hide entirely for non-owner/editor members.
- **New `VotingPage`** (`/voting/:sessionId`): lists teammates (excluding self); for each teammate, sub-stats grouped by category (Offensive / Defensive / Athleticism, or the GK set for a goalkeeper) with a `+`/`-` stepper per stat clamped to ±3 and 0 as the untouched/no-opinion default, submit. This is a bigger form than three sliders — see open question below on collapsing categories by default.
- **Post-match prompt**: after a successful `announce` call in `MatchPage.tsx`, if the response indicates a voting session was auto-created, show a prompt/toast with a link into `VotingPage` — don't force-navigate away from the match screen.
- **i18n**: new `voting` key section, added to `en.ts` first then mirrored into all 9 locale files (required — `tsc -b` fails otherwise per the typed-locale pattern).

## 6. Open questions to resolve before coding starts

- Exact vote scale (1-5? 1-10?) and exact delta formula for step 4.3 above.
- What a participant with `linkedUserId: null` (a card that isn't linked to a real app user) means for voting — can other people vote on them, does anyone get notified, etc. Likely: yes they can be rated, there's just no in-app notification for that particular player.
- Whether closing an expired session happens via a scheduled job, or lazily (checked whenever anyone hits `GET .../active` and the date has passed) — lazy close is simpler and needs no new infra, recommend starting there.
- Legacy matches with no `playerId` on their roster snapshot — confirmed above that manual/custom sessions are the fallback; worth a one-line UI note so it's not a surprise later.
- With up to 16 outfield sub-stats per teammate, whether `VotingPage` shows every stat expanded by default or collapses categories (Offensive/Defensive/Athleticism) until the voter opens them — collapsed-by-default is the likely answer to avoid an overwhelming wall of steppers, but worth confirming once the page is actually being built.

## 7. Suggested build order

1. Schema: `MatchPlayerDoc.playerId`/`linkedUserId`, `Crew.votingSettings`, new `VotingSession`/`Vote` models. **(needs your go-ahead — schema change)**
2. Backend routes + `votingService.ts` tally logic, unit-testable in isolation from the frontend.
3. Crew settings UI (leader controls).
4. `VotingPage` + post-announce prompt wiring.
5. i18n pass across all 9 locales.
6. E2E test coverage under `e2e/tests/api-tests/` and `e2e/tests/frontend-tests/`, per existing test conventions.
