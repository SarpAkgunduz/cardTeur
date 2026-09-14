import mongoose, { Schema, Document } from 'mongoose';

export interface VoteDoc extends Document {
  sessionId: mongoose.Types.ObjectId;
  voterUid: string;
  targetPlayerId: mongoose.Types.ObjectId;
  // Keys are Player sub-stat field names (e.g. 'dribbling', 'stamina');
  // values are the voter's ±3 nudge. Only stats the voter actually touched
  // are present — a stat nobody voted on is skipped entirely at tally time.
  statDeltas: Map<string, number>;
  createdAt: Date;
}

const VoteSchema = new Schema<VoteDoc>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: 'VotingSession', required: true, index: true },
    voterUid: { type: String, required: true },
    targetPlayerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
    statDeltas: { type: Map, of: Number, default: {} },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } },
);

// One vote per voter per target per session — upsert to allow changing a
// vote while the session is still open.
VoteSchema.index({ sessionId: 1, voterUid: 1, targetPlayerId: 1 }, { unique: true });

export default mongoose.model<VoteDoc>('Vote', VoteSchema);
