import mongoose, { Schema, Document } from 'mongoose';

export interface MvpAwardDoc extends Document {
  crewId: mongoose.Types.ObjectId;
  playerId: mongoose.Types.ObjectId;
  linkedUserId: string;
  awardedByUid: string;
  claimed: boolean;
  chosenStat?: string;
  createdAt: Date;
  claimedAt?: Date;
}

const MvpAwardSchema = new Schema<MvpAwardDoc>(
  {
    crewId: { type: Schema.Types.ObjectId, ref: 'Crew', required: true, index: true },
    playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
    // Whoever's account the awarded player card is linked to — this is who
    // may claim the award and pick which stat gets the +1.
    linkedUserId: { type: String, required: true, index: true },
    awardedByUid: { type: String, required: true },
    claimed: { type: Boolean, default: false },
    chosenStat: { type: String },
    claimedAt: { type: Date },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } },
);

export default mongoose.model<MvpAwardDoc>('MvpAward', MvpAwardSchema);
