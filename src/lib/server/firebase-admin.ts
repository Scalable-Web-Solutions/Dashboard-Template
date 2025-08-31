// src/lib/server/firebase-admin.ts
import admin from 'firebase-admin';
import { PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY } from '$env/static/private';


if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.PROJECT_ID,
      clientEmail: process.env.CLIENT_EMAIL,
      privateKey: (process.env.PRIVATE_KEY || '').replace(/\\n/g, '\n'),

    }),
  });
}

export const adminDb = admin.firestore();
export const AdminTimestamp = admin.firestore.Timestamp;
