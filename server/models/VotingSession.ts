import mongoose, { Schema, Document } from 'mongoose';

export interface VotingParticipant {
  playerId: mongoose.Types.ObjectId;
  linkedUserId?: string;
  name: string;
}

export interface VotingSessionDoc extends Document {
  crewId: mongoose.Types.ObjectId;
  matchId?: mongoose.Types.ObjectId;
  participants: VotingParticipant[];
  status: 'open' | 'closed';
  opensAt: Date;
  closesAt: Date;
  createdByUid: string;
  statsApplied: boolean;
  createdAt: Date;
}

const VotingParticipantSchema = new Schema<VotingParticipant>(
  {
    playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
    linkedUserId: { type: String },
    name: { type: String, required: true },
  },
  { _id: false },
);

const VotingSessionSchema = new Schema<VotingSessionDoc>(
  {
    crewId: { type: Schema.Types.ObjectId, ref: 'Crew', required: true, index: true },
    matchId: { type: Schema.Types.ObjectId, ref: 'Match' },
    participants: { type: [VotingParticipantSchema], default: [] },
    status: { type: String, enum: ['open', 'closed'], default: 'open', index: true },
    opensAt: { type: Date, required: true },
    closesAt: { type: Date, required: true },
    createdByUid: { type: String, required: true },
    statsApplied: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } },
);

export default mongoose.model<VotingSessionDoc>('VotingSession', VotingSessionSchema);
