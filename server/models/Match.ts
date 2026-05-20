import mongoose, { Schema, Document } from 'mongoose';

export interface MatchPlayerDoc {
  name: string;
  email?: string;
  preferredPosition?: string;
  role: string;
  x: number;
  y: number;
}

export interface MatchTeamDoc {
  players: MatchPlayerDoc[];
  formation: string;
  ovr: number;
  staminaOvr: number;
}

export interface MatchDoc extends Document {
  ownerUid: string;
  location: string;
  date: string;
  time: string;
  teamA: MatchTeamDoc;
  teamB: MatchTeamDoc;
  announced: boolean;
  createdAt: Date;
}

const MatchPlayerSchema = new Schema<MatchPlayerDoc>(
  {
    name: { type: String, required: true },
    email: { type: String },
    preferredPosition: { type: String },
    role: { type: String, required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  { _id: false },
);

const MatchTeamSchema = new Schema<MatchTeamDoc>(
  {
    players: [MatchPlayerSchema],
    formation: { type: String, default: '' },
    ovr: { type: Number, default: 0 },
    staminaOvr: { type: Number, default: 0 },
  },
  { _id: false },
);

const MatchSchema = new Schema<MatchDoc>(
  {
    ownerUid: { type: String, required: true, index: true },
    location: { type: String, default: '' },
    date: { type: String, default: '' },
    time: { type: String, default: '' },
    teamA: { type: MatchTeamSchema, required: true },
    teamB: { type: MatchTeamSchema, required: true },
    announced: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } },
);

export default mongoose.model<MatchDoc>('Match', MatchSchema);
