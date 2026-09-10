export type CardTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface RatingSource {
  offensiveOverall?: number | string;
  defensiveOverall?: number | string;
  athleticismOverall?: number | string;
  offensive?: number | string;
  defensive?: number | string;
  athleticism?: number | string;
  gkOverall?: number | string;
  stamina?: number | string;
  preferredPosition?: string;
}

export interface TierInput {
  offensiveOverall: number;
  defensiveOverall: number;
  athleticismOverall: number;
  gkOverall?: number;
  isGK?: boolean;
}

export const toNum = (v: unknown): number => {
  if (v === null || v === undefined || v === '') return 0;
  const n = parseFloat(typeof v === 'string' ? v.replace(/[^\d.-]/g, '') : String(v));
  return Number.isFinite(n) ? n : 0;
};

export const calculateAverage = (stats: number[]): number =>
  stats.length ? Math.round(stats.reduce((a, b) => a + b, 0) / stats.length) : 0;

export const isGoalkeeper = (p: RatingSource, role?: string): boolean =>
  String(role ?? p.preferredPosition ?? '').toUpperCase().includes('GK');

export const computeOverall = (p: RatingSource, role?: string): number => {
  const gkOverall = toNum(p.gkOverall);
  if (isGoalkeeper(p, role) && gkOverall > 0) return gkOverall;

  const v1 = toNum(p.offensiveOverall ?? p.offensive);
  const v2 = toNum(p.defensiveOverall ?? p.defensive);
  const v3 = toNum(p.athleticismOverall ?? p.athleticism);
  const parts = [v1, v2, v3].filter(x => x > 0);
  return (v1 + v2 + v3) / (parts.length || 3);
};

// Outfield tiers are driven by the stronger of the two role scores, so a pure
// defender and a pure attacker can both reach gold without being averaged down
// by the side of the pitch they never play.
export const computeCardTitle = ({
  offensiveOverall,
  defensiveOverall,
  athleticismOverall,
  gkOverall = 0,
  isGK = false,
}: TierInput): CardTier => {
  if (isGK) {
    if (gkOverall >= 90) return 'platinum';
    if (gkOverall >= 85) return 'gold';
    if (gkOverall >= 60) return 'silver';
    return 'bronze';
  }

  const defScore = (defensiveOverall + athleticismOverall) / 2;
  const offScore = (offensiveOverall + athleticismOverall) / 2;
  if (defScore >= 90 || offScore >= 90) return 'platinum';
  if (defScore >= 85 || offScore >= 85) return 'gold';
  if (defScore >= 60 || offScore >= 60) return 'silver';
  return 'bronze';
};
