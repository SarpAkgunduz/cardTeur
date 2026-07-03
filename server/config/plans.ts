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
  free:         { maxPlayers: 22,       maxCrews: 1,        maxFriends: 25,       matchHistoryMonths: 3,  fullResImages: false, analytics: false, referralSlots: 0 },
  premium:      { maxPlayers: 44,       maxCrews: 5,        maxFriends: Infinity, matchHistoryMonths: 12, fullResImages: true,  analytics: false, referralSlots: 1 },
  premium_plus: { maxPlayers: Infinity, maxCrews: Infinity, maxFriends: Infinity, matchHistoryMonths: 60, fullResImages: true,  analytics: true,  referralSlots: 6 },
};

export function getLimits(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
}
