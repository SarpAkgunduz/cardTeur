import User from '../../models/User';
import { redeemReferral, grantReferrerReward } from '../referralService';
import { paddleAdapter } from './paddle';
import { revenuecatAdapter } from './revenuecat';
import { BillingAdapter, CheckoutParams, CheckoutResult, ParsedSubscriptionEvent, ProviderName } from './types';

export type { ProviderName } from './types';

export function getAdapter(provider: ProviderName = 'paddle'): BillingAdapter {
  return provider === 'revenuecat' ? revenuecatAdapter : paddleAdapter;
}

// Web checkout always goes through Paddle (TR used to route to iyzico; see
// services/billing/iyzico.ts). Mobile never calls this — it picks
// 'revenuecat' implicitly by going through the App Store on-device.
export function providerForRegion(_countryCode?: string): 'paddle' {
  return 'paddle';
}

export async function startCheckout(provider: ProviderName, params: CheckoutParams): Promise<CheckoutResult> {
  return getAdapter(provider).createCheckout(params);
}

export async function applySubscriptionEvent(
  provider: ProviderName,
  event: ParsedSubscriptionEvent
): Promise<void> {
  if (!event.uid) return;
  if (event.type === 'noop') return;

  // Accounts with a manually granted lifetimePlan are frozen against billing
  // webhooks entirely — a renewal/cancellation/update from any provider must
  // never be able to touch their plan or billing fields.
  const existing = await User.findOne({ uid: event.uid }, { lifetimePlan: 1 }).lean();
  if (existing?.lifetimePlan) return;

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
