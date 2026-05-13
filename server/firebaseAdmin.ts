import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

if (!admin.apps.length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Production: loaded from env var (Railway, etc.)
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } else {
    // Local dev: serviceAccountKey.json file
    const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error('serviceAccountKey.json not found and FIREBASE_SERVICE_ACCOUNT env var not set.');
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }
}

export default admin;
