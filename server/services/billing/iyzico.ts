// DISABLED: billing runs on Paddle only. The iyzico adapter was never verified
// against a live sandbox (unconfirmed webhook payload shape, no identity-number
// collection in the UI, formHtml checkout the frontend never rendered), so the
// whole implementation is parked here rather than deleted.
export {};

/*
import Iyzipay from 'iyzipay';
import { Plan } from '../../config/plans';
import { BillingAdapter, CheckoutParams, CheckoutResult, ParsedSubscriptionEvent } from './types';

function planKeyFor(params: CheckoutParams): string {
  const tier = params.tier === 'premium' ? 'PREMIUM' : 'PREMIUM_PLUS';
  const interval = params.interval === 'annual' ? 'ANNUAL' : 'MONTHLY';
  return `IYZICO_PLAN_${tier}_${interval}`;
}

function planForPricingPlanCode(code?: string): Plan | undefined {
  if (!code) return undefined;
  if (code === process.env.IYZICO_PLAN_PREMIUM_MONTHLY || code === process.env.IYZICO_PLAN_PREMIUM_ANNUAL) return 'premium';
  if (code === process.env.IYZICO_PLAN_PREMIUM_PLUS_MONTHLY || code === process.env.IYZICO_PLAN_PREMIUM_PLUS_ANNUAL) return 'premium_plus';
  return undefined;
}

// NOTE: iyzico's SubscriptionStatus values per @types/iyzipay: EXPIRED | UNPAID | CANCELED | ACTIVE | PENDING | UPGRADED.
// Mapped conservatively — verify against real sandbox behavior before going live.
function statusToEventType(status?: string): ParsedSubscriptionEvent['type'] | undefined {
  switch (status) {
    case 'ACTIVE':
      return 'activated';
    case 'UPGRADED':
      return 'updated';
    case 'CANCELED':
    case 'EXPIRED':
    case 'UNPAID':
      return 'canceled';
    default:
      return undefined;
  }
}

let cachedClient: Iyzipay | null = null;

function getClient(): Iyzipay {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.IYZICO_API_KEY;
  const secretKey = process.env.IYZICO_SECRET_KEY;
  if (!apiKey || !secretKey) {
    throw new Error('iyzico is not configured (missing IYZICO_API_KEY / IYZICO_SECRET_KEY)');
  }
  cachedClient = new Iyzipay({
    apiKey,
    secretKey,
    // Matches MONETIZATION_HANDOFF.md's documented env var: a full base URL,
    // not an env-name flag, so sandbox vs production is just which URL is set.
    uri: process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com',
  });
  return cachedClient;
}

export const iyzicoAdapter: BillingAdapter = {
  provider: 'iyzico',

  async createCheckout(params: CheckoutParams): Promise<CheckoutResult> {
    const planCode = process.env[planKeyFor(params)];
    if (!planCode) {
      throw new Error(`iyzico is not configured (missing ${planKeyFor(params)})`);
    }
    const callbackUrl = process.env.IYZICO_CALLBACK_URL;
    if (!callbackUrl) {
      throw new Error('iyzico is not configured (missing IYZICO_CALLBACK_URL)');
    }
    // identityNumber (TC Kimlik No) is required by iyzico's Subscription Customer
    // model and is NOT currently collected anywhere in the app (ProfilePage/AddPlayerForm
    // don't ask for it). The frontend must gather this before calling /billing/checkout
    // with provider=iyzico, or this will always fail with the error below.
    const customer = params.iyzico;
    if (!customer?.name || !customer?.surname || !customer?.identityNumber) {
      throw new Error('iyzico checkout requires customer name, surname and identityNumber (TC Kimlik No) — not yet collected by the frontend');
    }

    const iyzipay = getClient();
    const result = await new Promise<any>((resolve, reject) => {
      iyzipay.subscriptionCheckoutForm.initialize(
        {
          locale: Iyzipay.LOCALE.TR,
          conversationId: params.uid,
          callbackUrl,
          pricingPlanReferenceCode: planCode,
          // Conservative choice: PENDING until the customer actually completes
          // the hosted checkout form and iyzico confirms payment via webhook/callback.
          subscriptionInitialStatus: Iyzipay.SUBSCRIPTION_INITIAL_STATUS.PENDING,
          customer: {
            name: customer.name,
            surname: customer.surname,
            identityNumber: customer.identityNumber,
            email: params.email,
            gsmNumber: customer.gsmNumber,
          },
        },
        (err: Error, res: any) => (err ? reject(err) : resolve(res)),
      );
    });

    if (result?.status !== 'success') {
      throw new Error(`iyzico checkout failed: ${result?.errorMessage ?? 'unknown error'}`);
    }

    return {
      provider: 'iyzico',
      token: result.token,
      // No plain redirect URL — the frontend must render this HTML/JS snippet
      // (e.g. in an iframe) instead of navigating to a `url` like it does for Paddle.
      formHtml: result.checkoutFormContent,
    };
  },

  async verifyAndParse(rawBody: Buffer): Promise<ParsedSubscriptionEvent | null> {
    let payload: any;
    try {
      payload = JSON.parse(rawBody.toString('utf8'));
    } catch {
      return null;
    }

    // iyzico exposes no HMAC/webhook-signing secret comparable to Paddle's, and the
    // exact subscription-webhook payload shape isn't in the public SDK/types (only
    // confirmed against @types/iyzipay's REST resources, not the webhook contract).
    // Rather than trust fields on the raw webhook body, treat it only as a pointer to
    // *which* subscription changed, then fetch the authoritative state via the
    // Subscription retrieve API. Field names below are best-effort guesses at the
    // pointer — confirm against a real sandbox webhook payload before relying on this.
    const referenceCode: string | undefined =
      payload?.subscriptionReferenceCode || payload?.iyziReferenceCode || payload?.referenceCode;
    if (!referenceCode) return null;

    const iyzipay = getClient();
    const sub = await new Promise<any>((resolve, reject) => {
      iyzipay.subscription.retrieve(
        { subscriptionReferenceCode: referenceCode },
        (err: Error, res: any) => (err ? reject(err) : resolve(res)),
      );
    });

    if (sub?.status !== 'success') return null;

    const type = statusToEventType(sub.subscriptionStatus);
    if (!type) return null;

    return {
      type,
      // conversationId was set to our Firebase uid at checkout-initialize time
      // (mirrors Paddle's custom_data.uid) — verify iyzico actually echoes it back
      // on retrieve in your sandbox before trusting this in production.
      uid: sub.conversationId,
      plan: type === 'canceled' ? 'free' : planForPricingPlanCode(sub.pricingPlanReferenceCode),
      customerId: sub.customerReferenceCode,
      subscriptionId: sub.referenceCode,
    };
  },
};

*/
