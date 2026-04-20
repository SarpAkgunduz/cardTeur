import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPlayer extends Document {
  name?: string;
  email?: string;
  jerseyNumber?: number;
  preferredPosition?: 'GK' | 'CB' | 'RB' | 'LB' | 'CDM' | 'CM' | 'CAM' | 'RW' | 'LW' | 'ST' | 'LM' | 'RM';
  marketValue?: number;
  cardImage?: string;
  // cardTitle is a virtual field — computed from stats, not stored in DB

  //!!!!!TO DO: Check the fields if it matches the database

  // Overalls
  offensiveOverall?: number;
  defensiveOverall?: number;
  athleticismOverall?: number;

  // Sub-stats (Offensive)
  dribbling?: number;
  shotAccuracy?: number;
  shotSpeed?: number;
  headers?: number;
  shortPass?: number;
  longPass?: number;
  ballControl?: number;
  positioning?: number;
  vision?: number;
  // Sub-stats (Defensive)
  tackling?: number;
  interceptions?: number;
  marking?: number;
  defensiveIQ?: number;
  // Sub-stats (Athleticism)
  speed?: number;
  strength?: number;
  stamina?: number;

  // GK Overall
  gkOverall?: number;

  // Sub-stats (Goalkeeper)
  diving?: number;
  handling?: number;
  kicking?: number;
  reflexes?: number;
  gkPositioning?: number;
  gkSpeed?: number;
}

const PlayerSchema: Schema<IPlayer> = new Schema({
  name: String,
  email: { type: String, default: undefined },
  jerseyNumber: Number,
  preferredPosition: {
    type: String,
    enum: ['GK', 'CB', 'RB', 'LB', 'CDM', 'CM', 'CAM', 'RW', 'LW', 'ST', 'LM', 'RM'],
  },
  marketValue: Number,
  cardImage: String,

  // Overalls
  offensiveOverall: Number,
  defensiveOverall: Number,
  athleticismOverall: Number,

  // Sub-stats (Offensive)
  dribbling: Number,
  shotAccuracy: Number,
  shotSpeed: Number,
  headers: Number,
  shortPass: Number,
  longPass: Number,
  ballControl: Number,
  positioning: Number,
  vision: Number,
  // Sub-stats (Defensive)
  tackling: Number,
  interceptions: Number,
  marking: Number,
  defensiveIQ: Number,
  // Sub-stats (Athleticism)
  speed: Number,
  strength: Number,
  stamina: Number,

  // GK Overall
  gkOverall: Number,

  // Sub-stats (Goalkeeper)
  diving: Number,
  handling: Number,
  kicking: Number,
  reflexes: Number,
  gkPositioning: Number,
  gkSpeed: Number,
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

// cardTitle is derived from stats — never stored in DB
PlayerSchema.virtual('cardTitle').get(function (this: IPlayer) {
  const isGK = this.preferredPosition === 'GK';
  if (isGK) {
    const gkOvr = this.gkOverall ?? 0;
    if (gkOvr >= 90) return 'platinum';
    if (gkOvr >= 85) return 'gold';
    if (gkOvr >= 60) return 'silver';
    return 'bronze';
  }
  const off = this.offensiveOverall ?? 0;
  const def = this.defensiveOverall ?? 0;
  const ath = this.athleticismOverall ?? 0;
  const offScore = (off + ath) / 2;
  const defScore = (def + ath) / 2;
  if (offScore >= 90 || defScore >= 90) return 'platinum';
  if (offScore >= 85 || defScore >= 85) return 'gold';
  if (offScore >= 60 || defScore >= 60) return 'silver';
  return 'bronze';
});

const Player: Model<IPlayer> = mongoose.model<IPlayer>('Player', PlayerSchema);

export default Player;
