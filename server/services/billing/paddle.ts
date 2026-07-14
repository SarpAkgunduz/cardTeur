import crypto from 'crypto';
import { Plan } from '../../config/plans';
import { BillingAdapter, CheckoutParams, CheckoutResult, ParsedSubscriptionEvent, PaidTier, BillingInterval, ChangePlanParams } from './types';

const PADDLE_API = () =>
  process.env.PADDLE_ENV === 'production'
    ? 'https://api.paddle.com'
    : 'https://sandbox-api.paddle.com';

function priceIdFor(tier: PaidTier, interval: BillingInterval): string | undefined {
  const key =
    tier === 'premium'
      ? interval === 'annual' ? 'PADDLE_PRICE_PREMIUM_ANNUAL' : 'PADDLE_PRICE_PREMIUM_MONTHLY'
      : interval === 'annual' ? 'PADDLE_PRICE_PREMIUM_PLUS_ANNUAL' : 'PADDLE_PRICE_PREMIUM_PLUS_MONTHLY';
  return process.env[key];
}

// Two separate Paddle Discounts: 50% off first month (restricted to the monthly
// prices), 30% off first year (restricted to the annual prices). A percentage
// discount applies proportionally to whatever currency/price the customer is
// actually charged, so this is correct across USD/GBP/EUR/AUD without extra work —
// the important part is picking the discount scoped to the right interval.
function discountIdFor(interval: BillingInterval): string | undefined {
  return interval === 'annual'
    ? process.env.PADDLE_DISCOUNT_REFERRAL_ANNUAL
    : process.env.PADDLE_DISCOUNT_REFERRAL_MONTHLY;
}

function planForPriceId(priceId?: string): Plan | undefined {
  if (!priceId) return undefined;
  if (priceId === process.env.PADDLE_PRICE_PREMIUM_MONTHLY || priceId === process.env.PADDLE_PRICE_PREMIUM_ANNUAL) return 'premium';
  if (priceId === process.env.PADDLE_PRICE_PREMIUM_PLUS_MONTHLY || priceId === process.env.PADDLE_PRICE_PREMIUM_PLUS_ANNUAL) return 'premium_plus';
  return undefined;
}

export const paddleAdapter: BillingAdapter = {
  provider: 'paddle',

  async createCheckout(params: CheckoutParams): Promise<CheckoutResult> {
    const apiKey = process.env.PADDLE_API_KEY;
    const priceId = priceIdFor(params.tier, params.interval);
    if (!apiKey || !priceId) {
      throw new Error('Paddle is not configured (missing PADDLE_API_KEY or price id)');
    }

    const discountId = params.referralCode ? discountIdFor(params.interval) : undefined;

    const res = await fetch(`${PADDLE_API()}/transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{ price_id: priceId, quantity: 1 }],
        ...(discountId ? { discount_id: discountId } : {}),
        custom_data: { uid: params.uid, tier: params.tier, referralCode: params.referralCode ?? '' },
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Paddle checkout failed: ${res.status} ${detail}`);
    }

    const body = await res.json() as any;
    return {
      provider: 'paddle',
      token: body?.data?.id,
      url: body?.data?.checkout?.url,
    };
  },

  // Upgrade/downgrade: swaps the price on the customer's existing subscription
  // instead of starting a new one, so they never end up paying for two plans at
  // once. proration_billing_mode: 'prorated_immediately' charges/credits the
  // difference for the remainder of the current billing period right away,
  // matching common SaaS upgrade behavior.
  async changePlan(params: ChangePlanParams): Promise<void> {
    const apiKey = process.env.PADDLE_API_KEY;
    const priceId = priceIdFor(params.tier, params.interval);
    if (!apiKey || !priceId) {
      throw new Error('Paddle is not configured (missing PADDLE_API_KEY or price id)');
    }

    const res = await fetch(`${PADDLE_API()}/subscriptions/${params.subscriptionId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{ price_id: priceId, quantity: 1 }],
        proration_billing_mode: 'prorated_immediately',
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Paddle change plan failed: ${res.status} ${detail}`);
    }
  },

  verifyAndParse(rawBody: Buffer, headers): ParsedSubscriptionEvent | null {
    const secret = process.env.PADDLE_WEBHOOK_SECRET;
    if (!secret) return null;

    const signatureHeader = String(headers['paddle-signature'] ?? '');
    const parts = Object.fromEntries(
      signatureHeader.split(';').map(kv => kv.split('=') as [string, string])
    );
    const ts = parts['ts'];
    const h1 = parts['h1'];
    if (!ts || !h1) return null;

    const signed = `${ts}:${rawBody.toString('utf8')}`;
    const expected = crypto.createHmac('sha256', secret).update(signed).digest('hex');
    if (expected !== h1) return null;

    const event = JSON.parse(rawBody.toString('utf8'));
    const type: string = event?.event_type ?? '';
    const data = event?.data ?? {};
    const custom = data?.custom_data ?? {};

    let mapped: ParsedSubscriptionEvent['type'];
    if (type === 'subscription.activated' || type === 'subscription.created') mapped = 'activated';
    else if (type === 'subscription.updated') mapped = 'updated';
    else if (type === 'subscription.canceled') mapped = 'canceled';
    else return null;

    const priceId = data?.items?.[0]?.price?.id;

    return {
      type: mapped,
      uid: custom?.uid,
      plan: mapped === 'canceled' ? 'free' : (planForPriceId(priceId) ?? (custom?.tier as Plan | undefined)),
      customerId: data?.customer_id,
      subscriptionId: data?.id,
      renewsAt: data?.next_billed_at ? new Date(data.next_billed_at) : undefined,
      referralCode: custom?.referralCode || undefined,
    };
  },
};
