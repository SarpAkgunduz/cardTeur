import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPlayer extends Document {
  name?: string;
  jerseyNumber?: number;
  preferredPosition?: 'GK' | 'CB' | 'RB' | 'LB' | 'CDM' | 'CM' | 'CAM' | 'RW' | 'LW' | 'ST' | 'LM' | 'RM';
  marketValue?: number;
  cardImage?: string;
  cardTitle?: 'gold' | 'silver' | 'bronze' | 'platinum';

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
  jerseyNumber: Number,
  preferredPosition: {
    type: String,
    enum: ['GK', 'CB', 'RB', 'LB', 'CDM', 'CM', 'CAM', 'RW', 'LW', 'ST', 'LM', 'RM'],
  },
  marketValue: Number,
  cardImage: String,
  cardTitle: {
    type: String,
    enum: ['gold', 'silver', 'bronze', 'platinum'],
  },

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
});

const Player: Model<IPlayer> = mongoose.model<IPlayer>('Player', PlayerSchema);

export default Player;
