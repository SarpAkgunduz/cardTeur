# Image Storage — Cloudflare R2 Migration

Moved out of `MONETIZATION_PLAN.md` / `MONETIZATION_HANDOFF.md` — this is a cost/infrastructure change, not a monetization decision. The only place it touches monetization is the `fullResImages` flag in `server/config/plans.ts` (`MONETIZATION_PLAN.md` Section 3), which decides whether an upload gets downscaled before it lands here.

---

## What R2 / S3 are

**Object storage** — services purpose-built to hold files (images, etc.) cheaply, instead of inside your database. **S3** is Amazon's original; **R2** is Cloudflare's S3-compatible equivalent with **no egress (download) fees**. Your app stores a short **URL** in Mongo; the file bytes live in the bucket.

## Why migrate

Today images live in MongoDB (`Player.cardImage`, `User.photoURL`). Binary blobs in Mongo are the most expensive bytes you have — they bloat every query and backup. Moving them to R2 keeps Mongo small and fast and slashes storage cost. **Use R2, not S3:** you're already on Cloudflare (Workers + `cardteur.com`), so it integrates cleanly and avoids egress charges.

## How it works with your stack

Your API runs on **Railway (Node/Express)**, not on Workers, so talk to R2 via its **S3-compatible API** using `@aws-sdk/client-s3` pointed at the R2 endpoint.

1. Create an R2 bucket (e.g. `cardteur-images`) + an API token in the Cloudflare dashboard.
2. New env vars:
   ```
   R2_ACCOUNT_ID=...
   R2_ACCESS_KEY_ID=...
   R2_SECRET_ACCESS_KEY=...
   R2_BUCKET=cardteur-images
   R2_PUBLIC_URL=https://images.cardteur.com   # public bucket / custom domain
   ```
3. **Upload flow:** `POST /api/uploads/image` — server receives the image, (for the tier-based res cap) optionally downscales free-tier images, uploads to R2, returns the public URL. Frontend then saves that URL into `cardImage` / `photoURL` as it already does — no schema change, the field already holds a string.
4. **Resolution cap ties into plans:** free tier → downscale to standard res before upload (`fullResImages: false` in `MONETIZATION_PLAN.md` Section 3); paid → keep full res. This is the one point of contact with the monetization plan — everything else on this page is infra-only.
5. **One-time migration script** (`server/scripts/`): for any existing doc whose `cardImage`/`photoURL` is base64 or a data URL, decode → upload to R2 → replace the field with the R2 URL. Run once, non-destructive (write new field, verify, then it's done).

---

## Status

### Built and compiling
- R2 image upload wired: `routes/uploads.ts` + `services/r2Service.ts`.
- Migration script: `server/scripts/migrateImagesToR2.ts`.

### Must be done by you
- Create an R2 bucket (e.g. `cardteur-images`) and an API token in the Cloudflare dashboard.
- Add a public custom domain for the bucket (e.g. `images.cardteur.com`).
- Set env vars in `server/.env` **and** Railway:
  ```
  R2_ACCOUNT_ID=...
  R2_ACCESS_KEY_ID=...
  R2_SECRET_ACCESS_KEY=...
  R2_BUCKET=cardteur-images
  R2_PUBLIC_URL=https://images.cardteur.com
  ```
- Run the migration once: `cd server && npx ts-node scripts/migrateImagesToR2.ts`
