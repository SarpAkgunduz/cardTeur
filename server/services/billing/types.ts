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
  provider: 'paddle' | 'iyzico';
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

export interface BillingAdapter {
  readonly provider: 'paddle' | 'iyzico';
  createCheckout(params: CheckoutParams): Promise<CheckoutResult>;
  verifyAndParse(rawBody: Buffer, headers: Record<string, string | string[] | undefined>): ParsedSubscriptionEvent | null;
}
