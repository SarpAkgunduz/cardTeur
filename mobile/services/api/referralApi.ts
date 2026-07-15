import { apiRequest } from './apiClient';
import type { Referral, ReferralOverview } from './types';

export const referralApi = {
  getOverview: () => apiRequest<ReferralOverview>('/referrals'),
  generate: () =>
    apiRequest<Referral>('/referrals', {
      method: 'POST',
    }),
};
