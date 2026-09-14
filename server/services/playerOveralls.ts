import { IPlayer } from '../models/Player';

// Mirrors openteur/src/utils/playerRating.ts's calculateAverage exactly.
// server/ and openteur/ are separate TypeScript subprojects (see CLAUDE.md),
// so this can't be a literal shared import — if you change the rounding or
// zero-handling here, change it there too, and vice versa.
export const calculateAverage = (stats: number[]): number =>
  stats.length ? Math.round(stats.reduce((a, b) => a + b, 0) / stats.length) : 0;

export interface RecomputedOveralls {
  offensiveOverall: number;
  defensiveOverall: number;
  athleticismOverall: number;
  gkOverall: number;
}

// Recomputes all four overalls from a Player's current sub-stats, using the
// exact same field groupings usePlayerForm.ts uses client-side on every
// manual card edit, so voting-driven changes and manual edits can never
// drift apart (VOTING_SYSTEM_PLAN.md section 4, step 4).
export function recomputeOveralls(player: Pick<IPlayer,
  'dribbling' | 'shotAccuracy' | 'shotSpeed' | 'headers' | 'ballControl' | 'vision' | 'positioning' | 'longPass' | 'shortPass' |
  'tackling' | 'interceptions' | 'marking' |
  'speed' | 'strength' | 'stamina' |
  'diving' | 'handling' | 'kicking' | 'reflexes' | 'gkPositioning' | 'gkSpeed'
>): RecomputedOveralls {
  const n = (v?: number) => v ?? 0;
  return {
    offensiveOverall: calculateAverage([
      n(player.dribbling), n(player.shotAccuracy), n(player.shotSpeed), n(player.headers),
      n(player.ballControl), n(player.vision), n(player.positioning), n(player.longPass), n(player.shortPass),
    ]),
    defensiveOverall: calculateAverage([n(player.tackling), n(player.interceptions), n(player.marking)]),
    athleticismOverall: calculateAverage([n(player.speed), n(player.strength), n(player.stamina)]),
    gkOverall: calculateAverage([
      n(player.diving), n(player.handling), n(player.kicking),
      n(player.reflexes), n(player.gkPositioning), n(player.gkSpeed),
    ]),
  };
}
