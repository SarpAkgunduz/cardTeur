export interface Player {
  _id: string;
  ownerUid: string;
  name: string;
  email?: string;
  cardImage: string;
  jerseyNumber: number;
  marketValue: number;
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
export type CreatePlayerDto = Omit<Player, '_id' | 'cardTitle'>;
export type UpdatePlayerDto = Partial<Omit<Player, '_id' | 'cardTitle'>>;
