// Two-team formation/balancing logic, ported from web's
// src/data/formations.ts (roleCat/smartAssign) and src/pages/MatchPage.tsx
// (splitPoolIntoTeams' snake draft) so mobile produces the same kind of
// evenly-matched lineups web does, instead of a single unformed roster.
import type { Player } from '../services/api/types';

export type RoleCat = 'gk' | 'att' | 'def' | 'mid';

export function roleCat(role: string): RoleCat {
  const r = (role || '').toUpperCase();
  if (/GK/.test(r)) return 'gk';
  if (/ST|LS|RS|CF|LF|RF|LW|RW/.test(r)) return 'att';
  if (/LB|RB|CB|LCB|RCB|CDM|SW|LWB|RWB/.test(r)) return 'def';
  return 'mid';
}

const n = (v: unknown) => parseFloat(String(v ?? 0)) || 0;

// Single-number overall used for sorting/balancing and display — same
// formula already used in preview.tsx/development.tsx: GK uses gkOverall,
// everyone else averages off/def/ath.
export function computeOverall(p: Player): number {
  if (p.preferredPosition?.toUpperCase() === 'GK') return n(p.gkOverall);
  return Math.round((n(p.offensiveOverall) + n(p.defensiveOverall) + n(p.athleticismOverall)) / 3);
}

// Role-specific overall (used once a player is placed in a specific slot) —
// mirrors smartAssign's per-category scoring on web.
function roleScore(p: Player, cat: RoleCat): number {
  if (cat === 'gk') return n(p.gkOverall);
  if (cat === 'att') return n(p.offensiveOverall);
  if (cat === 'def') return n(p.defensiveOverall);
  return (n(p.offensiveOverall) + n(p.defensiveOverall)) / 2;
}

// Greedily fills each slot with the best remaining player for that slot's
// role category (GK slots first, then attack, defense, midfield) — same
// pass order as web's smartAssign, adapted to mobile's flat role-string
// slot lists instead of web's {x,y,role} objects.
export function smartAssignSlots(players: Player[], roles: string[]): (Player | null)[] {
  const remaining = players.slice();
  const assigned: (Player | null)[] = new Array(roles.length).fill(null);

  for (const cat of ['gk', 'att', 'def', 'mid'] as RoleCat[]) {
    const slotIndices = roles.map((_, i) => i).filter(i => roleCat(roles[i]) === cat && assigned[i] === null);
    for (const si of slotIndices) {
      if (remaining.length === 0) break;
      remaining.sort((a, b) => roleScore(b, cat) - roleScore(a, cat));
      assigned[si] = remaining.shift()!;
    }
  }

  let ri = 0;
  for (let i = 0; i < assigned.length; i++) {
    if (assigned[i] === null && ri < remaining.length) {
      assigned[i] = remaining[ri++];
    }
  }
  return assigned;
}

// Snake draft (strongest-to-weakest, A,B,B,A,...) split into two evenly
// matched squads of up to `perTeam` each — identical pattern to web's
// splitPoolIntoTeams/handleBalance. Anyone left over (pool bigger than
// 2 * perTeam) goes to the bench.
export function balanceIntoTeams(players: Player[], perTeam: number): { teamA: Player[]; teamB: Player[]; bench: Player[] } {
  const sorted = [...players].sort((a, b) => computeOverall(b) - computeOverall(a));
  const teamA: Player[] = [];
  const teamB: Player[] = [];
  const bench: Player[] = [];
  sorted.forEach((p, i) => {
    const pickA = i % 4 === 0 || i % 4 === 3;
    if (pickA && teamA.length < perTeam) teamA.push(p);
    else if (teamB.length < perTeam) teamB.push(p);
    else if (teamA.length < perTeam) teamA.push(p);
    else bench.push(p);
  });
  return { teamA, teamB, bench };
}

export function computeTeamOverall(players: Player[]): number {
  if (!players.length) return 0;
  return Math.round(players.reduce((s, p) => s + computeOverall(p), 0) / players.length);
}
