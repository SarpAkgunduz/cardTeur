import mongoose, { Schema, Document } from 'mongoose';
import { Plan } from '../config/plans';

export type BillingProvider = 'paddle';

export interface IUser extends Document {
  uid: string;
  // Absent for a guest (anonymous Firebase) account that hasn't claimed a
  // real identity yet — see isAnonymous below.
  email?: string;
  displayName: string;
  photoURL?: string;
  // True for a Firebase Anonymous Auth session ("Uygulamayı Keşfet"). Same
  // uid carries through account claiming (signup/Google link), so this just
  // flips to false in place rather than the doc being recreated.
  isAnonymous?: boolean;
  friends: string[];
  friendRequests: string[];
  plan: Plan;
  planRenewsAt?: Date;
  billingProvider?: BillingProvider;
  billingCustomerId?: string;
  billingSubscriptionId?: string;
  referralRewardMonths: number;
  createdAt: Date;
  // Manually granted, permanent plan override — set only via a direct
  // database write, never through any API route. When present, this wins
  // over `plan` everywhere plan/limits are resolved, and billing webhooks
  // skip this user entirely so a Paddle event can never downgrade them.
  lifetimePlan?: Plan;
}

const UserSchema = new Schema<IUser>({
  uid: { type: String, required: true, unique: true },
  // sparse: many guest accounts can share "no email" without tripping the
  // unique index — it only applies once a document actually has one.
  email: { type: String, unique: true, sparse: true },
  displayName: { type: String, required: true },
  photoURL: { type: String },
  isAnonymous: { type: Boolean, default: false },
  friends: { type: [String], default: [] },
  friendRequests: { type: [String], default: [], index: true },
  plan: { type: String, enum: ['free', 'premium', 'premium_plus'], default: 'free' },
  planRenewsAt: { type: Date },
  billingProvider: { type: String, enum: ['paddle'] },
  billingCustomerId: { type: String },
  billingSubscriptionId: { type: String },
  referralRewardMonths: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  lifetimePlan: { type: String, enum: ['free', 'premium', 'premium_plus'] },
});

export default mongoose.model<IUser>('User', UserSchema);
