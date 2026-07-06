import User from '../../models/User';
import { redeemReferral, grantReferrerReward } from '../referralService';
import { paddleAdapter } from './paddle';
import { iyzicoAdapter } from './iyzico';
import { BillingAdapter, CheckoutParams, CheckoutResult, ParsedSubscriptionEvent } from './types';

export type ProviderName = 'paddle' | 'iyzico';

export function getAdapter(provider: ProviderName): BillingAdapter {
  return provider === 'iyzico' ? iyzicoAdapter : paddleAdapter;
}

export function providerForRegion(countryCode?: string): ProviderName {
  return (countryCode ?? '').toUpperCase() === 'TR' ? 'iyzico' : 'paddle';
}

export async function startCheckout(provider: ProviderName, params: CheckoutParams): Promise<CheckoutResult> {
  return getAdapter(provider).createCheckout(params);
}

export async function applySubscriptionEvent(
  provider: ProviderName,
  event: ParsedSubscriptionEvent
): Promise<void> {
  if (!event.uid) return;

  const update: Record<string, unknown> = {
    plan: event.plan ?? 'free',
    billingProvider: provider,
  };
  if (event.customerId) update.billingCustomerId = event.customerId;
  if (event.subscriptionId) update.billingSubscriptionId = event.subscriptionId;
  if (event.renewsAt) update.planRenewsAt = event.renewsAt;

  await User.updateOne({ uid: event.uid }, { $set: update });

  if (event.type === 'activated') {
    if (event.referralCode) {
      await redeemReferral(event.referralCode, event.uid);
    }
    await grantReferrerReward(event.uid);
  }
}
