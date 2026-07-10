import { apiRequest } from './apiClient';
import { Referral, ReferralOverview } from './types';

export const referralApi = {
  getOverview: () => apiRequest<ReferralOverview>('/referrals'),
  generate: () =>
    apiRequest<Referral>('/referrals', {
      method: 'POST',
    }),
  validate: (code: string) =>
    apiRequest<{ valid: boolean }>(`/referrals/validate/${encodeURIComponent(code)}`),
};
