import mongoose, { Schema, Document } from 'mongoose';

export type ReferralStatus = 'unused' | 'redeemed';

export interface IReferral extends Document {
  referrerUid: string;
  code: string;
  status: ReferralStatus;
  referredUid?: string;
  rewardGranted: boolean;
  createdAt: Date;
}

const ReferralSchema = new Schema<IReferral>({
  referrerUid: { type: String, required: true, index: true },
  code: { type: String, required: true, unique: true },
  status: { type: String, enum: ['unused', 'redeemed'], default: 'unused' },
  referredUid: { type: String },
  rewardGranted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IReferral>('Referral', ReferralSchema);
