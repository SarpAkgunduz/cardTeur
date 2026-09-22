import { Plan } from '../../config/plans';
import { BillingAdapter, CheckoutParams, CheckoutResult, ParsedSubscriptionEvent } from './types';

// Maps an App Store / Play Store product id (configured in RevenueCat, which
// mirrors what you set up in App Store Connect) to our internal plan. Same
// pattern as paddle.ts's priceIdFor/planForPriceId — one env var per SKU so
// the actual product identifiers are never hardcoded here.
function planForProductId(productId?: string): Plan | undefined {
  if (!productId) return undefined;
  if (
    productId === process.env.REVENUECAT_PRODUCT_PREMIUM_MONTHLY ||
    productId === process.env.REVENUECAT_PRODUCT_PREMIUM_ANNUAL
  ) return 'premium';
  if (
    productId === process.env.REVENUECAT_PRODUCT_PREMIUM_PLUS_MONTHLY ||
    productId === process.env.REVENUECAT_PRODUCT_PREMIUM_PLUS_ANNUAL
  ) return 'premium_plus';
  return undefined;
}

// RevenueCat event types we care about. Full list also includes
// PRODUCT_CHANGE, SUBSCRIBER_ALIAS, TRANSFER, TEST, NON_RENEWING_PURCHASE —
// anything not listed here falls through to 'noop' (acknowledged, ignored).
type RevenueCatEventType =
  | 'INITIAL_PURCHASE'
  | 'RENEWAL'
  | 'UNCANCELLATION'
  | 'PRODUCT_CHANGE'
  | 'CANCELLATION'
  | 'EXPIRATION'
  | 'BILLING_ISSUE';

interface RevenueCatEvent {
  type: RevenueCatEventType | string;
  app_user_id: string;
  product_id?: string;
  original_transaction_id?: string;
  transaction_id?: string;
  expiration_at_ms?: number | null;
  environment?: 'SANDBOX' | 'PRODUCTION';
}

export const revenuecatAdapter: BillingAdapter = {
  provider: 'revenuecat',

  async createCheckout(_params: CheckoutParams): Promise<CheckoutResult> {
    // There is no server-initiated checkout for mobile — the purchase happens
    // on-device via StoreKit through the RevenueCat SDK. If this is ever hit,
    // something on the client is routing a mobile user through the web
    // checkout flow by mistake.
    throw new Error('RevenueCat purchases happen on-device — there is no server checkout for this provider');
  },

  // RevenueCat signs webhooks with a fixed shared secret you set once in the
  // RevenueCat dashboard (Project Settings → Webhooks → "Authorization
  // header"), sent back verbatim as the Authorization header on every
  // request — not a per-request HMAC like Paddle's. Comparing it in constant
  // time isn't critical here (it's not a signature over the body, just a
  // shared bearer secret) but costs nothing.
  verifyAndParse(rawBody: Buffer, headers): ParsedSubscriptionEvent | null {
    const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
    if (!secret) return null;

    const auth = String(headers['authorization'] ?? '');
    const expected = `Bearer ${secret}`;
    if (auth !== expected) return null;

    let body: { event?: RevenueCatEvent };
    try {
      body = JSON.parse(rawBody.toString('utf8'));
    } catch {
      return null;
    }
    const event = body?.event;
    if (!event?.app_user_id) return null;

    // The RevenueCat SDK must be initialized with our Firebase uid as the
    // app_user_id (Purchases.logIn(uid) right after Firebase sign-in) — see
    // FRONTEND_TODO_IAP_APPLE_PAY.md. If that wiring is missing, app_user_id
    // will be RevenueCat's own anonymous id instead of our uid, and this
    // event silently can't be matched to a user.
    const uid = event.app_user_id;
    const renewsAt = event.expiration_at_ms ? new Date(event.expiration_at_ms) : undefined;

    switch (event.type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'UNCANCELLATION':
      case 'PRODUCT_CHANGE': {
        const plan = planForProductId(event.product_id);
        if (!plan) return null; // unrecognized product id — don't silently grant a plan
        return {
          type: event.type === 'INITIAL_PURCHASE' ? 'activated' : 'updated',
          uid,
          plan,
          subscriptionId: event.original_transaction_id,
          renewsAt,
        };
      }
      case 'EXPIRATION':
        // The paid period actually ended — this is the one event that
        // downgrades the user, not CANCELLATION (see below).
        return { type: 'canceled', uid, plan: 'free' };
      case 'CANCELLATION':
        // Auto-renew was turned off, but access continues until expiration.
        // Nothing to change yet — EXPIRATION will fire when it actually ends.
        return { type: 'noop', uid };
      case 'BILLING_ISSUE':
        // A renewal charge failed. Apple/Google keep retrying and access
        // continues in the meantime — same story, wait for EXPIRATION.
        return { type: 'noop', uid };
      default:
        return { type: 'noop', uid };
    }
  },
};
