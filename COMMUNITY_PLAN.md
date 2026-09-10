# CardTeur Community — Design Plan

Status: **plan only, nothing built yet.** All decisions below were made by Sarp on 2026-09-08.
Follows the conventions in `CLAUDE.md`: thin routes, logic in `server/services/`, `ownerUid` from
the verified token only, `en.ts` as the i18n source of truth, dark theme + BEM-ish CSS.

---

## 1. Decisions

| # | Question | Decision |
|---|---|---|
| 1 | Core unit | Listing board **and** browsable directory |
| 2 | Chat transport | Firebase (Firestore), on the existing Firebase Auth identity |
| 3 | Discoverability | **Listing-based only** — user profiles stay unsearchable |
| 4 | Location | Province → district, fixed list (81 / 973) |
| 5 | Logged-out access | Board is **public**: summary + first ~80 chars of the note. Poster identity, full note, card and the apply button require login |
| 6 | Expired listings | Hidden, not deleted. One-click repost |
| 7 | Poster's card | Shown on the listing (gated layer) |
| 8 | Who may post | `crew_seeking` = **paid only**. `player_seeking` = free (limited). Applying is **free and unlimited** for any registered user |
| 9 | SEO | Cloudflare Worker meta injection + sitemap + robots, **in phase 1** |

### How decisions 1 and 3 fit together

"Listings + directory" normally implies browsable *profiles*, which decision 3 forbids. Both hold
because **the directory is a view over active listings, not over users**:

- **Players tab** — every open `player_seeking` listing.
- **Crews tab** — every open `crew_seeking` listing.

Nobody appears anywhere until they post, and they disappear when the listing closes or expires.
`GET /api/users/search` stays exactly as it is today — exact uid/email match, per `CLAUDE.md`.
**No change to user search.**

---

## 2. The two-layer response — the core mechanic of this feature

Decision 5 means the same endpoint serves two different shapes. **The projection is built on the
server. Never send the full document and hide fields in the UI.**

**Public (no token)**
```ts
{ _id, type, city, district, positions, days, timeStart, timeEnd,
  level, notePreview,        // first 80 chars, word-boundary trimmed, + '…'
  createdAt, hasCard }       // hasCard drives the locked card placeholder
```

**Authenticated** — the above, plus:
```ts
{ ownerUid, displayName, photoURL, note,   // full text
  card,                                     // Player linked to ownerUid, or null
  crew: { name, memberCount },              // crew_seeking only
  myRequestStatus }                         // null | 'pending' | 'accepted' | 'rejected'
```

This needs a new **`optionalAuth`** middleware next to `requireAuth` in `server/middleware/auth.ts`:
verify the bearer token if one is present, attach `uid`, but never 401 when it is missing. The
listing read routes use it; every write route keeps `requireAuth`.

---

## 3. Data model

Three new models in `server/models/`. No breaking change to existing documents.

### `Listing.ts`

```ts
type ListingType   = 'player_seeking' | 'crew_seeking';
type SkillLevel    = 'beginner' | 'intermediate' | 'advanced';
type ListingStatus = 'open' | 'filled' | 'closed' | 'expired';

{
  ownerUid: string;        // required, from token — never from body
  type: ListingType;
  crewId?: ObjectId;       // required when type === 'crew_seeking'
  country: string;         // 'TR'
  city: string;
  district: string;
  positions: string[];     // same enum as Player.preferredPosition
  days: number[];          // 0-6, Sun-Sat
  timeStart?: string;      // '20:00'
  timeEnd?: string;
  level: SkillLevel;
  note: string;            // maxlength 500, enforced in the schema
  status: ListingStatus;
  expiresAt: Date;         // default now + 30 days
  createdAt, updatedAt
}
```

Indexes:
- `{ country: 1, city: 1, district: 1, status: 1 }` — the board query
- `{ type: 1, status: 1, createdAt: -1 }` — tab listing and sitemap
- `{ ownerUid: 1 }` — "my listings" and the active-count limit check
- `{ expiresAt: 1 }` — expiry sweep

Display data (`displayName`, `photoURL`, crew name, member count, card) is **not denormalised**.
It is batch-joined at read time from `User` / `Crew` / `Player`, the same way
`GET /api/users/friends` already does, so an edited profile or card stays correct everywhere.

**Expiry (decision 6):** a listing past `expiresAt` flips to `status: 'expired'` and drops out of
every board query, but the document stays. `POST /listings/:id/repost` sets `status: 'open'` and
pushes `expiresAt` out 30 days. No TTL index — TTL deletes, and we want to keep them.

### `ListingRequest.ts`

One model for both directions, so the inbox is a single query.

```ts
{
  listingId: ObjectId;
  fromUid: string;
  toUid: string;                     // listing owner, denormalised for inbox queries
  crewId?: ObjectId;                 // set when the outcome is crew membership
  direction: 'apply' | 'invite';
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  message?: string;                  // maxlength 300
  chatId?: string;                   // Firestore chat id, set on accept
  createdAt
}
```

Unique compound index `{ listingId: 1, fromUid: 1 }` — one request per person per listing. This is
the cheapest anti-spam measure available and matters more now that applying is free and unlimited.

### `Report.ts`

```ts
{
  targetType: 'listing' | 'message' | 'user';
  targetId: string;
  reporterUid: string;
  reason: 'spam' | 'abuse' | 'fake' | 'other';
  detail?: string;
  status: 'open' | 'reviewed' | 'actioned';
  createdAt
}
```

### Changes to existing models

- `User`: add `blockedUids: string[]` (default `[]`, indexed). Blocked users' listings are filtered
  out of the board; their requests are rejected server-side.
- `Crew`: no schema change. `memberUids` already exists and is indexed.
- `Player`: no schema change. The card on a listing is resolved with
  `Player.findOne({ linkedUserId: ownerUid })`.

---

## 4. The card on a listing (decision 7)

The poster's own card is the strongest visual the product has and the natural bridge between the
community and the core app. It sits in the **gated layer** — it carries a name and a photo, so it
must not be public.

Resolution: `Player.findOne({ linkedUserId: listing.ownerUid })`.

Three cases to handle in the UI:
- **Has a linked card** → render it with the existing `Card` component.
- **No linked card** → show a prompt on the listing form: "link a card to yourself so crews can see
  how you play". This is a genuine funnel into `AddPlayerForm`'s `linkedUserId` flow.
- **Logged out** → locked placeholder in the card's shape, with the sign-up call to action.

---

## 5. Chat — Firestore

`server/firebaseAdmin.ts` is already initialised, so the backend writes Firestore with
`admin.firestore()` and no new credentials. **Firestore must be enabled in the Firebase console —
the project currently uses Auth only.** This is a phase-3 prerequisite.

```
chats/{chatId}
  { participants: [uidA, uidB], listingId, crewId?, createdAt, lastMessage, lastMessageAt }

chats/{chatId}/messages/{messageId}
  { senderUid, text, createdAt }
```

### The split that makes this safe

**The backend creates chat documents; the client only reads and writes messages.** A client can
never invent a chat or add itself to one, because `participants` is written only by the server,
after it has verified an accepted `ListingRequest`.

```
match /chats/{chatId} {
  allow read: if request.auth.uid in resource.data.participants;
  allow write: if false;                       // server only

  match /messages/{messageId} {
    allow read:   if request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
    allow create: if request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants
                  && request.resource.data.senderUid == request.auth.uid
                  && request.resource.data.text is string
                  && request.resource.data.text.size() <= 1000;
    allow update, delete: if false;
  }
}
```

`lastMessage` / `lastMessageAt` are cosmetic; let the client write them rather than adding Cloud
Functions. **Recommendation: no Cloud Functions at this stage.** Cost sits well inside the
Firestore free tier at current scale.

---

## 6. API surface

Mounted as `/api/community` in `server/index.ts`. Routes stay thin; filtering, limit checks, crew
side-effects and projection building live in `server/services/communityService.ts`.

```
optionalAuth:
GET    /api/community/listings          ?type&city&district&day&position&level&cursor
GET    /api/community/listings/:id

requireAuth:
POST   /api/community/listings          (plan limit checked, see §8)
PUT    /api/community/listings/:id      (owner only)
PATCH  /api/community/listings/:id/status
POST   /api/community/listings/:id/repost
DELETE /api/community/listings/:id      (owner only)

GET    /api/community/requests          ?box=incoming|outgoing
POST   /api/community/listings/:id/apply
POST   /api/community/listings/:id/invite/:uid
POST   /api/community/requests/:id/accept     → joins crew if crewId, opens chat, returns chatId
POST   /api/community/requests/:id/reject
DELETE /api/community/requests/:id            (withdraw)

POST   /api/community/reports
POST   /api/community/block/:uid
DELETE /api/community/block/:uid
```

Pagination is cursor-based on `createdAt`; offset paging degrades badly once the board fills.

---

## 7. Crew join and invite

**Apply** (player → crew listing): applicant sends `apply` → crew owner sees it in the incoming box
→ on accept the server pushes `fromUid` into `crew.memberUids`, opens the chat, sets
`request.chatId`.

**Invite** (crew → player listing): crew owner sends `invite` on a `player_seeking` listing → the
player accepts → same join plus chat.

Two guards worth writing down now, because both are easy to miss:

1. **Plan limits belong to the crew owner, not the joiner.** Adding a member must not push a free
   crew past the owner's `maxPlayers`. Check `getUserLimits(crew.ownerUid)` on accept, return a
   `PLAN_LIMIT_PLAYERS`-style 403, and surface it to the owner as an upgrade prompt.
2. **Joining a crew is not friendship.** `crew.memberUids` and `User.friends` stay separate. A crew
   member must not silently gain a friend edge — that would be a privacy surprise. Offer "add as
   friend" as a separate explicit action.

---

## 8. Plan limits (decision 8)

Add to `PlanLimits` in `server/config/plans.ts`:

```ts
crewListings:   free 0, premium 3, premium_plus 10   // 'oyuncu arıyoruz'
playerListings: free 1, premium 3, premium_plus 5    // 'kadro arıyorum'
```

Applying is free and unlimited for every registered user — rate-limited only (see §9), never
plan-limited. This is deliberate: the crew organiser is the natural payer because they already use
the app for their squad, while the player looking for a team is the least likely person to hold a
subscription. Charging the demand side would leave paid crew listings with nobody to answer them.

The free `player_seeking` tier is therefore **the spam surface**. It is contained by: one active
listing per free user, the per-day rate limit, report + block, and 30-day expiry.

---

## 9. Safety and moderation — required before this goes public

The app today has **no rate limiting, no helmet, no reporting and no blocking**. All four become
load-bearing the moment strangers can post text on a page Google indexes. Minimum for phase 1:

- `express-rate-limit`: listing create 5/day, request create 20/day, report create 10/day
- `helmet` on the app
- `note` (500) and `message` (300) caps enforced in the schema, not only in the form
- Report and block endpoints live from day one; blocked users filtered out of board queries
- A minimal admin view over open reports — `UsersPage.tsx` is the precedent for an internal screen
- **Legal:** the board and chat are user-generated content, and with decision 5 part of it is
  publicly readable. `TermsPage` and `PrivacyPage` both need a UGC section, and the KVKK notice
  must state plainly what a listing publishes to non-users.

---

## 10. SEO (decision 9, phase 1)

Today: pure client-side render, `<title>` is `CardTeur` on every route, no meta description, no
Open Graph, no `robots.txt`, no `sitemap.xml`. A public board is worth little in that state.

The site is already on Cloudflare Workers Assets, so the fix is a Worker in front of the assets
binding:

- `wrangler.jsonc` gains a `main` entry alongside the existing `assets` binding.
- On `GET /community/:id`, the Worker fetches the **public** listing projection from the Railway
  API, injects `<title>`, `<meta name="description">` and Open Graph tags into `index.html`, then
  serves it. Every other path falls through to assets unchanged.
- `GET /sitemap.xml` — generated from open listings, cached.
- `GET /robots.txt` — allow the board, disallow `/manage`, `/match`, `/profile`, `/crew`, `/friends`.

**Cache the API call** in `caches.default` with a short TTL. Without it every crawl hits Railway.

Title and description come from the public fields only, e.g.
`Çankaya, Ankara · Kaleci aranıyor · Salı 21:00 — CardTeur`.

---

## 11. Location data (decision 4)

Extracted from the `turkey-location-data` npm package: **81 provinces, 973 districts, 13 KB raw /
5 KB gzipped.** No runtime dependency needed — the data ships as a generated file at
`openteur/src/data/locations.ts`, matching the `data/formations.ts` convention.

```ts
export interface Province { name: string; districts: string[] }
export const TR_PROVINCES: Province[] = [...]
```

Province and district names are proper nouns and must **not** go through i18n.

---

## 12. Frontend

New routes in `openteur/src/App.tsx`. The board routes are **public**; everything else is behind
`PrivateRoute`.

| Route | Page | Auth | Owns |
|---|---|---|---|
| `/community` | `CommunityPage` | public | Board, tabs: Players / Crews / My Listings |
| `/community/:id` | `ListingDetailPage` | public | Detail; apply button and identity gated |
| `/community/new` | `ListingForm` | private | Create and edit |
| `/requests` | `RequestsPage` | private | Incoming and outgoing requests |
| `/messages` | `MessagesPage` | private | Chat list and thread (phase 3) |

Per the page-responsibility rule in `CLAUDE.md` these are separate pages — the board does not get
bolted onto `FriendsPage`. Filtering is **server-side**, unlike `FriendsPage`'s client-side filter,
because the board is unbounded.

The logged-out state needs real design attention: the locked card placeholder and the "sign up to
see who posted this" call to action are the conversion moment for the whole ad funnel.

i18n: a `community.*` section of roughly 70–90 keys, in all nine locale files or `tsc -b` fails.

---

## 13. Mobile parity

`mobile/` has its own independent i18n and a five-tab layout. Community would be a sixth tab plus
three or four screens, and Firestore chat needs React Native Firebase wired separately.

**Recommendation: web first, mobile only once the board proves demand.** Building both while the
design is still moving doubles the cost of every change.

---

## 14. Phasing

| Phase | Scope |
|---|---|
| **1** | `Listing` model, `optionalAuth`, public board + filters, listing CRUD, plan limits, `locations.ts`, rate limiting, helmet, report + block, legal text, **SEO Worker + sitemap + robots** |
| **2** | `ListingRequest`, apply / invite, crew join on accept, requests inbox, card on listing |
| **3** | Firestore enabled, chat, messages page, unread badge |
| **4** | Notifications, admin moderation queue, mobile parity |

Phase 1 deliberately ships **without chat and without the request flow**. It answers the only
question that matters first: does anyone post, and does Google send anyone? If the board stays
empty, phases 2 and 3 are work saved rather than wasted.

---

## 15. Risks

1. **Liquidity.** Paid-only crew listings plus free player listings is the right split, but the
   board still needs a seed. Consider posting real listings from a few existing crews before
   opening it, rather than launching to an empty page.
2. **The free player tier is the spam surface.** Contained, not eliminated — watch the report queue
   in the first weeks.
3. **SEO latency.** The Worker adds a Railway round-trip to crawls of `/community/:id`. Caching is
   not optional.
4. **Public content is permanent in practice.** Once Google indexes a listing, closing it does not
   remove it from search results immediately. The KVKK notice must say so.
