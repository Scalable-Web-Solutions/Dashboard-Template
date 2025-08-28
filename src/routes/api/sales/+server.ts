// src/routes/api/sales/+server.ts
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase-admin';

type SalesDoc = Record<string, number>; // e.g. { one: 3, two: 15, three: 12 }

export const GET: RequestHandler = async () => {
  const snap = await adminDb.collection('sales').get();

  // Array of docs: [{ id: 'scriptone', data: { one: 3, two: 15, three: 12 } }, ...]
  const rows = snap.docs.map(d => ({ id: d.id, data: d.data() as SalesDoc }));

  // Build a totals row by summing same keys across docs
  const totals: Record<string, number> = {};
  for (const r of rows) {
    for (const [k, v] of Object.entries(r.data)) {
      totals[k] = (totals[k] ?? 0) + (typeof v === 'number' ? v : 0);
    }
  }

  return new Response(JSON.stringify({ rows, totals }), {
    headers: { 'content-type': 'application/json' }
  });
};
