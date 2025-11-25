export interface Player {
  _id: string;
  name: string;
  cardImage: string;
  jerseyNumber: number;
  marketValue: string;
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
  finishing: number;
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
}

export type CreatePlayerDto = Omit<Player, '_id'>;
export type UpdatePlayerDto = Partial<Omit<Player, '_id'>>;
