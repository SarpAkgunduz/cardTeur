# TODO — Frontend/Mobile: IAP & Apple Pay wiring

Backend is done and type-checks clean (server/services/billing/revenuecat.ts,
server/services/payments/applePay.ts, server/routes/payments.ts, webhook route
at POST /api/billing/webhook/revenuecat). Nothing on the frontend/mobile side
has been touched yet. This is what's left, in order:

## 1. Mobile IAP (RevenueCat) — blocks Premium/Premium+ on iOS

- [ ] `npx expo install react-native-purchases` in `mobile/` (real network
      access needed — run it yourself, same as expo-apple-authentication).
- [ ] Create a RevenueCat account/project, connect it to the
      `com.cardteur.mobile` App Store Connect app.
- [ ] In App Store Connect, create the 4 subscription products (Premium
      monthly/annual, Premium+ monthly/annual) — requires the Paid
      Applications Agreement to be signed first (banking/tax info, your own
      action, not something I can do).
- [ ] Set these server env vars once the product ids exist:
      `REVENUECAT_PRODUCT_PREMIUM_MONTHLY`, `REVENUECAT_PRODUCT_PREMIUM_ANNUAL`,
      `REVENUECAT_PRODUCT_PREMIUM_PLUS_MONTHLY`, `REVENUECAT_PRODUCT_PREMIUM_PLUS_ANNUAL`,
      `REVENUECAT_WEBHOOK_SECRET` (you choose this value, then paste the same
      one into RevenueCat's dashboard webhook config).
- [ ] In RevenueCat dashboard: add a webhook pointing at
      `https://<your-api>/api/billing/webhook/revenuecat` with an
      `Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>` header.
- [ ] **Critical**: call `Purchases.configure(...)` then
      `Purchases.logIn(firebaseUid)` right after Firebase auth resolves (in
      `AuthContext.tsx`), so RevenueCat's `app_user_id` is our Firebase uid —
      the webhook can't match a purchase to a user otherwise.
- [ ] Build a paywall screen: fetch RevenueCat offerings, show the 4
      products, call `Purchases.purchasePackage(...)`, handle
      cancel/error/already-owned.
- [ ] Restore purchases button (App Store requirement) →
      `Purchases.restorePurchases()`.
- [ ] "Manage subscription" link → opens the OS subscription management
      screen (`Linking.openURL('itms-apps://apps.apple.com/account/subscriptions')`
      on iOS), since Apple subscriptions can't be cancelled through our own UI.

## 2. Apple Pay — NOT for Premium/Premium+ (Apple requires IAP for that)

Only relevant once there's an actual real-world paid feature (e.g. saha/pitch
booking). Backend has merchant validation ready
(`POST /api/payments/apple-pay/validate-merchant`) but payment processing
(`POST /api/payments/apple-pay/process`) intentionally throws "not
implemented" — no processor that decrypts Apple Pay tokens is wired up yet,
and there's no product to charge for.

- [ ] Register a Merchant ID in Apple Developer → Certificates, Identifiers &
      Profiles → Identifiers → Merchant IDs (e.g. `merchant.com.cardteur.mobile`).
- [ ] Create an "Apple Pay Merchant Identity Certificate" for it, export
      cert+key as PEM, set server env vars: `APPLE_PAY_MERCHANT_ID`,
      `APPLE_PAY_MERCHANT_CERT`, `APPLE_PAY_MERCHANT_KEY`, `APPLE_PAY_DOMAIN`,
      `APPLE_PAY_DISPLAY_NAME`.
- [ ] Decide the actual paid feature this is for, and pick a payment
      processor that supports Apple Pay tokens (Stripe/Adyen do; plain iyzico
      card endpoints likely don't — needs checking).
- [ ] Only then build the client-side `ApplePaySession` flow and finish
      `processApplePayPayment` in `server/services/payments/applePay.ts`.

## Status
Backend: done, type-checks clean.
Frontend/mobile: not started.
