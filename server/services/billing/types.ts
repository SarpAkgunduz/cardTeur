import { Plan } from '../../config/plans';

export type BillingInterval = 'monthly' | 'annual';
export type PaidTier = 'premium' | 'premium_plus';

// iyzico's subscription checkout form requires a real identity number (TC Kimlik No)
// and name/surname for every customer — Paddle collects this on its own hosted page,
// but iyzico needs it passed in up front. The frontend does not collect this yet.
export interface IyzicoCustomerDetails {
  name: string;
  surname: string;
  identityNumber: string;
  gsmNumber?: string;
}

export interface CheckoutParams {
  uid: string;
  email?: string;
  tier: PaidTier;
  interval: BillingInterval;
  referralCode?: string;
  iyzico?: IyzicoCustomerDetails;
}

export interface CheckoutResult {
  provider: 'paddle' | 'iyzico';
  url?: string;
  token?: string;
  // iyzico's subscription checkout form returns an embeddable HTML/JS snippet
  // instead of a redirect URL — the frontend must render this (e.g. in an iframe
  // or container div), it cannot just `window.location = result.url` like Paddle.
  formHtml?: string;
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
  // Paddle verifies synchronously (HMAC over the raw body). iyzico has no
  // equivalent webhook signing secret exposed, so its adapter instead looks up
  // the authoritative subscription status via an API call before trusting the
  // event — hence the return type also allows a Promise.
  verifyAndParse(
    rawBody: Buffer,
    headers: Record<string, string | string[] | undefined>
  ): ParsedSubscriptionEvent | null | Promise<ParsedSubscriptionEvent | null>;
}
