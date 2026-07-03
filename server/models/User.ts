import mongoose, { Schema, Document } from 'mongoose';
import { Plan } from '../config/plans';

export interface IUser extends Document {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  friends: string[];
  friendRequests: string[];
  plan: Plan;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  photoURL: { type: String },
  friends: { type: [String], default: [] },
  friendRequests: { type: [String], default: [] },
  plan: { type: String, enum: ['free', 'premium', 'premium_plus'], default: 'free' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IUser>('User', UserSchema);
