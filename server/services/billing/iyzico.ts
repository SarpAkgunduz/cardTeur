import { BillingAdapter, CheckoutParams, CheckoutResult, ParsedSubscriptionEvent } from './types';

function planKeyFor(params: CheckoutParams): string {
  const tier = params.tier === 'premium' ? 'PREMIUM' : 'PREMIUM_PLUS';
  const interval = params.interval === 'annual' ? 'ANNUAL' : 'MONTHLY';
  return `IYZICO_PLAN_${tier}_${interval}`;
}

export const iyzicoAdapter: BillingAdapter = {
  provider: 'iyzico',

  async createCheckout(params: CheckoutParams): Promise<CheckoutResult> {
    const apiKey = process.env.IYZICO_API_KEY;
    const secret = process.env.IYZICO_SECRET_KEY;
    const planCode = process.env[planKeyFor(params)];
    if (!apiKey || !secret || !planCode) {
      throw new Error('iyzico is not configured (missing IYZICO_API_KEY / IYZICO_SECRET_KEY / plan code)');
    }
    throw new Error('iyzico checkout not yet implemented — install iyzipay SDK and wire subscription initialize');
  },

  verifyAndParse(): ParsedSubscriptionEvent | null {
    return null;
  },
};
