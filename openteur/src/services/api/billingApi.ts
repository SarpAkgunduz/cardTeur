import { apiRequest } from './apiClient';
import { BillingInterval, CheckoutResult, PaidTier } from './types';

export interface CheckoutArgs {
  tier: PaidTier;
  interval: BillingInterval;
  referralCode?: string;
  countryCode?: string;
}

export interface ChangePlanArgs {
  tier: PaidTier;
  interval: BillingInterval;
}

export const billingApi = {
  checkout: (args: CheckoutArgs) =>
    apiRequest<CheckoutResult>('/billing/checkout', {
      method: 'POST',
      body: JSON.stringify(args),
    }),
  changePlan: (args: ChangePlanArgs) =>
    apiRequest<{ ok: boolean }>('/billing/change-plan', {
      method: 'POST',
      body: JSON.stringify(args),
    }),
};
