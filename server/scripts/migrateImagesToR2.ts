/**
 * One-time migration: finds all User documents whose photoURL is a base64
 * data URL, uploads each to Cloudflare R2, and replaces the field with the
 * public R2 URL.
 *
 * Run once after R2 env vars are configured:
 *   cd server && npx ts-node scripts/migrateImagesToR2.ts
 *
 * Safe to re-run — documents already migrated (photoURL starts with http)
 * are skipped automatically.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/User';
import Player from '../models/Player';
import { uploadImageToR2, isDataUrl } from '../services/r2Service';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function migrateUsers(): Promise<void> {
  const cursor = User.find({ photoURL: /^data:/ }).cursor();
  let count = 0;

  for await (const user of cursor) {
    try {
      const url = await uploadImageToR2(user.photoURL!, `users/${user.uid}`);
      await User.updateOne({ _id: user._id }, { photoURL: url });
      count++;
      console.log(`[user] ${user.uid} → ${url}`);
    } catch (err) {
      console.error(`[user] ${user.uid} FAILED:`, err);
    }
  }

  console.log(`Users migrated: ${count}`);
}

async function migratePlayers(): Promise<void> {
  const cursor = Player.find({ cardImage: /^data:/ }).cursor();
  let count = 0;

  for await (const player of cursor) {
    try {
      const url = await uploadImageToR2(player.cardImage!, `players/${player.ownerUid}`);
      await Player.updateOne({ _id: player._id }, { cardImage: url });
      count++;
      console.log(`[player] ${player._id} → ${url}`);
    } catch (err) {
      console.error(`[player] ${player._id} FAILED:`, err);
    }
  }

  console.log(`Players migrated: ${count}`);
}

async function main(): Promise<void> {
  await mongoose.connect(process.env.MONGO_URI as string);
  console.log('Connected to MongoDB');

  await migrateUsers();
  await migratePlayers();

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
