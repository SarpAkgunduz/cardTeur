// One-time migration: syncs all Firebase Auth users into MongoDB
// Run from server/ directory: node migrateUsers.js

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const admin = require('firebase-admin');
const mongoose = require('mongoose');
const fs = require('fs');

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('serviceAccountKey.json not found.');
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(require(serviceAccountPath)) });

const UserSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
const User = mongoose.model('User', UserSchema);

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const listResult = await admin.auth().listUsers(1000);
  const firebaseUsers = listResult.users;
  console.log(`Found ${firebaseUsers.length} Firebase users`);

  let created = 0;
  let skipped = 0;

  for (const u of firebaseUsers) {
    const existing = await User.findOne({ uid: u.uid });
    if (existing) {
      skipped++;
      continue;
    }
    await User.create({
      uid: u.uid,
      email: u.email || '',
      displayName: u.displayName || u.email?.split('@')[0] || 'Unknown',
    });
    console.log(`  Created: ${u.email}`);
    created++;
  }

  console.log(`\nDone — ${created} created, ${skipped} already existed`);
  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
