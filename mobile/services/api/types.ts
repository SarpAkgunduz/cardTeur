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
  dribbling: number;
  shotAccuracy: number;
  shotSpeed: number;
  headers: number;
  longPass: number;
  shortPass: number;
  ballControl: number;
  positioning: number;
  vision: number;
  tackling: number;
  interceptions: number;
  marking: number;
  defensiveIQ: number;
  speed: number;
  strength: number;
  stamina: number;
  gkOverall: number;
  diving: number;
  handling: number;
  kicking: number;
  reflexes: number;
  gkPositioning: number;
  gkSpeed: number;
}

export type CreatePlayerDto = Omit<Player, '_id' | 'cardTitle' | 'ownerUid' | 'linkedUserPhotoURL'>;
export type UpdatePlayerDto = Partial<Omit<Player, '_id' | 'cardTitle' | 'ownerUid' | 'linkedUserPhotoURL'>>;

export interface CrewMember {
  _id: string;
  name: string;
  email?: string;
  linkedUserId?: string;
}

export interface Crew {
  _id: string;
  name: string;
  ownerUid: string;
  memberUids: string[];
  players: CrewMember[];
}

export interface AppUser {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  friends: string[];
}
