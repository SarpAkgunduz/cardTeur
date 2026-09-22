import { Plan } from '../../config/plans';

export type ProviderName = 'paddle' | 'revenuecat';

export type BillingInterval = 'monthly' | 'annual';
export type PaidTier = 'premium' | 'premium_plus';

export interface CheckoutParams {
  uid: string;
  email?: string;
  tier: PaidTier;
  interval: BillingInterval;
  referralCode?: string;
}

export interface CheckoutResult {
  provider: ProviderName;
  url?: string;
  token?: string;
}

// 'noop' is for a webhook event that verified fine but requires no change on
// our side (e.g. RevenueCat's CANCELLATION — auto-renew was turned off but
// access continues until the period actually ends at EXPIRATION). Kept
// distinct from `null` (= failed verification / reject the request) so a
// legitimate event we intentionally ignore doesn't look like a bad webhook.
export type SubscriptionEventType = 'activated' | 'updated' | 'canceled' | 'noop';

export interface ParsedSubscriptionEvent {
  type: SubscriptionEventType;
  uid?: string;
  plan?: Plan;
  customerId?: string;
  subscriptionId?: string;
  renewsAt?: Date;
  referralCode?: string;
}

export interface ChangePlanParams {
  subscriptionId: string;
  tier: PaidTier;
  interval: BillingInterval;
}

export interface BillingAdapter {
  readonly provider: ProviderName;
  // Mobile (RevenueCat/StoreKit) purchases happen entirely on-device — there
  // is no server-initiated checkout, so that adapter throws if this is ever
  // called instead of silently returning something meaningless.
  createCheckout(params: CheckoutParams): Promise<CheckoutResult>;
  verifyAndParse(
    rawBody: Buffer,
    headers: Record<string, string | string[] | undefined>
  ): ParsedSubscriptionEvent | null | Promise<ParsedSubscriptionEvent | null>;
  // Changes an existing subscription's price in place (upgrade/downgrade) instead
  // of creating a second, parallel subscription.
  changePlan?(params: ChangePlanParams): Promise<void>;
}
