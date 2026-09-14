import mongoose, { Document, Schema } from 'mongoose';

export interface CrewVotingSettings {
  autoTriggerEnabled: boolean;
  windowHours: number;
}

export interface ICrew extends Document {
  ownerUid: string;
  name: string;
  playerIds: string[];
  memberUids: string[];
  editorUids: string[];
  votingSettings: CrewVotingSettings;
  createdAt: Date;
}

const CrewVotingSettingsSchema = new Schema<CrewVotingSettings>(
  {
    autoTriggerEnabled: { type: Boolean, default: false },
    windowHours: { type: Number, default: 48 },
  },
  { _id: false },
);

const CrewSchema = new Schema<ICrew>({
  ownerUid: { type: String, required: true, index: true },
  name: { type: String, required: true },
  playerIds: { type: [String], default: [] },
  memberUids: { type: [String], default: [], index: true },
  editorUids: { type: [String], default: [], index: true },
  votingSettings: { type: CrewVotingSettingsSchema, default: () => ({}) },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<ICrew>('Crew', CrewSchema);
