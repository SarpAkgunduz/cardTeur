# CardTeur Monetization — Build Status & Your To-Do List

This tracks what's built in code vs. what only **you** can do (accounts, keys, dashboards).

---

## ✅ Built and compiling (backend + frontend `tsc` clean)

**Backend**
- `User` model: `plan`, `planRenewsAt`, `billingProvider`, `billingCustomerId`, `billingSubscriptionId`, `referralRewardMonths`.
- `config/plans.ts` + `services/planService.ts` — tier limits + resolver.
- Limit enforcement on create routes: players (`PLAN_LIMIT_PLAYERS`), crews (`PLAN_LIMIT_CREWS`), friends (`PLAN_LIMIT_FRIENDS`); match history read-window filter on `GET /api/matches`.
- `models/Referral.ts` + `services/referralService.ts` + `routes/referrals.ts` (`GET/POST /api/referrals`).
- Billing layer `services/billing/` (Paddle implemented via REST; iyzico structured stub) + `routes/billing.ts` (`POST /api/billing/checkout`, `POST /api/billing/webhook/paddle`, `.../iyzico`), mounted with raw-body parsing for webhooks.
- R2 image upload already wired (`routes/uploads.ts` + `services/r2Service.ts`) and a migration script (`scripts/migrateImagesToR2.ts`).

**Frontend**
- `plan` loaded into `AuthContext` (`plan`, `limits`, `profile`, `refreshProfile`).
- `ApiError` + `isPlanLimitError()` so limit errors show an upgrade prompt.
- `UpgradeModal`, `PlanUsageMeter` components; wired into `PlayersPage` (usage meter + upgrade modal on limit).
- `PricingPage` (`/pricing`) with monthly/annual toggle; `ReferralsPage` (`/referrals`).
- `billingApi`, `referralApi`, and plan/referral types.

---

## 🔧 Must be done by you

### 1. Cloudflare R2 (image storage — do first, cuts cost now)
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

### 2. Paddle (international payments)
- ✅ **Sandbox catalog created** (2026-07-13) — 2 products, 4 prices (Premium $3/mo & $30/yr, Premium+ $5/mo & $50/yr, each with GB/IE/AU currency overrides), 2 referral discounts (50% off first month, 30% off first year, `restrict_to` locked to the correct interval's prices), 7-day card-required trial on every price. All IDs are already in `server/.env`. `paddle.ts` already picks the right discount by `interval` — no code change needed there anymore.
- ⏳ **Still sandbox only** — this is Test Mode, no real money moves, only Paddle test cards work. Nothing here is live yet.
- Still needed before this actually works end-to-end:
  - Create a webhook in the **sandbox** dashboard pointing to `https://<your-local-or-tunnel-url>/api/billing/webhook/paddle`; copy its signing secret into `PADDLE_WEBHOOK_SECRET` in `server/.env`. Without this, checkout works but a subscription activating never updates the user's `plan` in Mongo.
  - Test an actual checkout end-to-end with a [Paddle test card](https://developer.paddle.com/concepts/payment-methods/test-cards) before trusting the flow.
- When ready to go live: sign up / complete seller verification on the **live** side (`vendors.paddle.com`, not sandbox), repeat product/price/discount creation there (sandbox and live are fully separate — no data carries over), set `PADDLE_ENV=production`, and swap in the live key + IDs (in `server/.env` and Railway).
- Env vars (`server/.env` — ✅ already set for sandbox; repeat for Railway when deploying, and again for live later):
  ```
  PADDLE_API_KEY=...            # ✅ set (sandbox)
  PADDLE_WEBHOOK_SECRET=...     # ⏳ still needed
  PADDLE_ENV=sandbox            # then 'production' when going live
  PADDLE_PRICE_PREMIUM_MONTHLY=pri_...          # ✅ set
  PADDLE_PRICE_PREMIUM_ANNUAL=pri_...           # ✅ set
  PADDLE_PRICE_PREMIUM_PLUS_MONTHLY=pri_...     # ✅ set
  PADDLE_PRICE_PREMIUM_PLUS_ANNUAL=pri_...      # ✅ set
  PADDLE_DISCOUNT_REFERRAL_MONTHLY=dsc_...      # ✅ set
  PADDLE_DISCOUNT_REFERRAL_ANNUAL=dsc_...       # ✅ set
  ```

### 3. iyzico (Turkey payments) — needs the most work
- Sign up at iyzico; enable the **Abonelik (Subscription)** product.
- Decide the **TRY prices** for each tier (clean local numbers, not raw FX of $3/$5) and create the plans.
- Install the SDK: `cd server && npm install iyzipay`.
- Finish `services/billing/iyzico.ts` — the `createCheckout` and `verifyAndParse` methods are stubbed and currently throw / return null. Wire the iyzipay subscription-initialize call and the notification signature check.
- Env vars:
  ```
  IYZICO_API_KEY=...
  IYZICO_SECRET_KEY=...
  IYZICO_BASE_URL=https://sandbox-api.iyzipay.com   # then https://api.iyzipay.com
  IYZICO_PLAN_PREMIUM_MONTHLY=...
  IYZICO_PLAN_PREMIUM_ANNUAL=...
  IYZICO_PLAN_PREMIUM_PLUS_MONTHLY=...
  IYZICO_PLAN_PREMIUM_PLUS_ANNUAL=...
  ```
- Note: iyzico subscription management costs ~199 TRY/mo after a 3-month free period, and you handle Turkish e-fatura/tax (confirm with an accountant).

### 4. Mobile app (`~/Desktop/reactnativeapps/cardteurmobile`)
- Not touched (outside this repo). It needs the same `plan` reading + `PLAN_LIMIT_*` handling, and **Apple/Google in-app billing** (RevenueCat recommended) rather than Paddle/iyzico. Grant me access to a folder containing both apps and I can sync it.

### 5. Referral reward consumption
- `referralRewardMonths` is incremented when a referred friend converts. Deciding **how** to spend it (extend the referrer's next Paddle/iyzico period, or account credit) depends on your provider setup — wire it once billing is live.

---

## Notes
- No database migration needed for existing users — `plan` defaults to `free`, `referralRewardMonths` to `0`.
- Nothing here charges anyone until the provider keys above are set; without them, `POST /api/billing/checkout` returns a clear "not configured" error.
- The full design rationale lives in `MONETIZATION_PLAN.md`.
