import mongoose, { Document, Schema } from 'mongoose';

export interface ICrew extends Document {
  ownerUid: string;
  name: string;
  playerIds: string[];
  memberUids: string[];
  editorUids: string[];
  createdAt: Date;
}

const CrewSchema = new Schema<ICrew>({
  ownerUid: { type: String, required: true, index: true },
  name: { type: String, required: true },
  playerIds: { type: [String], default: [] },
  memberUids: { type: [String], default: [] },
  editorUids: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<ICrew>('Crew', CrewSchema);
