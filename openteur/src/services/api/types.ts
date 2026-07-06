export interface Player {
  _id: string;
  ownerUid: string;
  linkedUserId?: string;
  linkedUserPhotoURL?: string;
  name: string;
  email?: string;
  cardImage: string;
  jerseyNumber: number;
  marketValue?: number;
  preferredPosition: string;
  cardTitle: 'gold' | 'silver' | 'bronze' | 'platinum';
  offensiveOverall: number;
  defensiveOverall: number;
  athleticismOverall: number;
  // Offensive stats
  dribbling: number;
  shotAccuracy: number;
  shotSpeed: number;
  headers: number;
  longPass: number;
  shortPass: number;
  ballControl: number;
  positioning: number;
  vision: number;
  // Defensive stats
  tackling: number;
  interceptions: number;
  marking: number;
  defensiveIQ: number;
  // Athleticism stats
  speed: number;
  strength: number;
  stamina: number;
  // GK Overall
  gkOverall: number;
  // GK stats
  diving: number;
  handling: number;
  kicking: number;
  reflexes: number;
  gkPositioning: number;
  gkSpeed: number;
}

// cardTitle is computed by the backend — never sent in create/update requests
export type CreatePlayerDto = Omit<Player, '_id' | 'cardTitle' | 'ownerUid' | 'linkedUserPhotoURL'>;
export type UpdatePlayerDto = Partial<Omit<Player, '_id' | 'cardTitle' | 'ownerUid' | 'linkedUserPhotoURL'>>;

export type Plan = 'free' | 'premium' | 'premium_plus';

export interface PlanLimits {
  maxPlayers: number;
  maxCrews: number;
  maxFriends: number;
  matchHistoryMonths: number;
  fullResImages: boolean;
  analytics: boolean;
  referralSlots: number;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: { maxPlayers: 22, maxCrews: 1, maxFriends: 25, matchHistoryMonths: 3, fullResImages: false, analytics: false, referralSlots: 0 },
  premium: { maxPlayers: 44, maxCrews: 5, maxFriends: Infinity, matchHistoryMonths: 12, fullResImages: true, analytics: false, referralSlots: 1 },
  premium_plus: { maxPlayers: Infinity, maxCrews: Infinity, maxFriends: Infinity, matchHistoryMonths: 60, fullResImages: true, analytics: true, referralSlots: 6 },
};

export const PLAN_LABELS: Record<Plan, string> = {
  free: 'Free',
  premium: 'Premium',
  premium_plus: 'Premium+',
};

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  plan: Plan;
  planRenewsAt?: string;
}

export type PaidTier = 'premium' | 'premium_plus';
export type BillingInterval = 'monthly' | 'annual';

export interface Referral {
  _id: string;
  referrerUid: string;
  code: string;
  status: 'unused' | 'redeemed';
  referredUid?: string;
  rewardGranted: boolean;
  createdAt: string;
}

export interface ReferralOverview {
  slots: number;
  used: number;
  available: number;
  referrals: Referral[];
}

export interface CheckoutResult {
  provider: 'paddle' | 'iyzico';
  url?: string;
  token?: string;
}
