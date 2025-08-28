import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';

admin.initializeApp();
const db = admin.firestore();

export const updateLead = functions.https.onCall(async (data, ctx) => {
  if (!ctx.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign in');

  const { id, patch } = data as {
    id: string;
    patch: Partial<{
      accountManager: string; leadValue: number; priority: string; companySize: string;
      industry: string; contactMethod: string; subscriptionType: string;
      currentPhase: string; status: string; website: string; notes: string;
    }>;
  };
  if (!id || !patch || typeof id !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'id and patch are required');
  }

  // (Optional) role/allowlist check here

  await db.doc(`onboardingData/${id}`).set(
    {
      ...patch,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: ctx.auth.uid
    },
    { merge: true } // upsert missing fields
  );
  return { ok: true };
});

// Create a new lead (admin-side)
export const createLeadAdmin = functions.https.onCall(async (data, ctx) => {
  if (!ctx.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign in');
  const doc = {
    companyName: String(data.companyName ?? ''),
    contactName: String(data.contactName ?? ''),
    email: String(data.email ?? ''),
    phone: String(data.phone ?? ''),
    // admin-only fields:
    accountManager: String(data.accountManager ?? ''),
    priority: String(data.priority ?? 'First Class'),
    currentPhase: String(data.currentPhase ?? 'Opening'),
    status: 'Active',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: ctx.auth.uid
  };
  const ref = await db.collection('onboardingData').add(doc);
  return { ok: true, id: ref.id };
});

// Soft delete
export const softDeleteLead = functions.https.onCall(async (data, ctx) => {
  if (!ctx.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign in');
  const { id } = data as { id: string };
  await db.doc(`onboardingData/${id}`).set(
    { deletedAt: admin.firestore.FieldValue.serverTimestamp(), status: 'Deleted' },
    { merge: true }
  );
  return { ok: true };
});
