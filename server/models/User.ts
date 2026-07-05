import mongoose, { Schema, Document } from 'mongoose';
import { Plan } from '../config/plans';

export type BillingProvider = 'paddle' | 'iyzico';

export interface IUser extends Document {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  friends: string[];
  friendRequests: string[];
  plan: Plan;
  planRenewsAt?: Date;
  billingProvider?: BillingProvider;
  billingCustomerId?: string;
  billingSubscriptionId?: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  photoURL: { type: String },
  friends: { type: [String], default: [] },
  friendRequests: { type: [String], default: [], index: true },
  plan: { type: String, enum: ['free', 'premium', 'premium_plus'], default: 'free' },
  planRenewsAt: { type: Date },
  billingProvider: { type: String, enum: ['paddle', 'iyzico'] },
  billingCustomerId: { type: String },
  billingSubscriptionId: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IUser>('User', UserSchema);
