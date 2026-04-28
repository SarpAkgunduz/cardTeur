import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

if (!admin.apps.length) {
  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error('serviceAccountKey.json not found. Download it from Firebase Console → Project Settings → Service Accounts.');
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default admin;
