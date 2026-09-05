import { Plan } from '../../config/plans';

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
  provider: 'paddle';
  url?: string;
  token?: string;
}

export type SubscriptionEventType = 'activated' | 'updated' | 'canceled';

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
  readonly provider: 'paddle';
  createCheckout(params: CheckoutParams): Promise<CheckoutResult>;
  verifyAndParse(
    rawBody: Buffer,
    headers: Record<string, string | string[] | undefined>
  ): ParsedSubscriptionEvent | null | Promise<ParsedSubscriptionEvent | null>;
  // Changes an existing subscription's price in place (upgrade/downgrade) instead
  // of creating a second, parallel subscription.
  changePlan?(params: ChangePlanParams): Promise<void>;
}
