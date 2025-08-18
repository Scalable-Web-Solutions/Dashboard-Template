import type { RequestHandler } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase-admin';

// Small helper to add optional range filters
function withRange<T extends FirebaseFirestore.Query>(q: any, range?: any) {
  if (!range) return q;
  // Choose ONE strategy your events actually have:
  // (a) day string ("YYYY-MM-DD")
  if (range.day) q = q.where('day', '==', String(range.day));
  // (b) numeric millis
  if (typeof range.startMs === 'number') q = q.where('ts_ms', '>=', range.startMs);
  if (typeof range.endMs === 'number')   q = q.where('ts_ms', '<',  range.endMs);
  // (c) Firestore Timestamp (example)
  // if (range.startTs) q = q.where('timestamp', '>=', range.startTs);
  // if (range.endTs)   q = q.where('timestamp', '<',  range.endTs);
  return q;
}

// Admin SDK aggregate count (fast, doesn’t stream docs)
async function countAgg(q: FirebaseFirestore.Query) {
  // @google-cloud/firestore >= v6 supports .count().get()
  const snap = await q.count().get();
  return snap.data().count;
}

export const POST: RequestHandler = async ({ request, locals }) => {
  // (optional) gate access to dashboard users only
  // if (!locals.user || !locals.user.isDashboardUser) return new Response('Unauthorized', { status: 401 });

  try {
    const body = await request.json();
    const {
      projectId,
      experiments, // [{ id: string, variants: string[] }]
      buttonId,    // string
      goal,        // string
      range        // { day?: string, startMs?: number, endMs?: number }
    } = body || {};

    if (!projectId || !Array.isArray(experiments)) {
      return new Response(JSON.stringify({ error: 'Bad request' }), { status: 400 });
    }

    const baseCol = adminDb.collection(`clients/${projectId}/events`);

    const results: Array<{
      expId: string;
      rows: Array<{ variant: string; exposures: number; clicks: number; conversions: number; ctr: number; cvr: number }>;
      totals: { exposures: number; clicks: number; conversions: number };
    }> = [];

    for (const exp of experiments) {
      const rows = [];
      let tExp = 0, tClk = 0, tConv = 0;

      for (const v of exp.variants) {
        // exposures
        let qE = baseCol
          .where('type', '==', 'exp_exposure')
          .where('expId', '==', exp.id)
          .where('variant', '==', v);
        qE = withRange(qE, range);
        const E = await countAgg(qE);

        // clicks
        let qC = baseCol
          .where('type', '==', 'cta_click')
          .where('expId', '==', exp.id)
          .where('variant', '==', v);
        if (buttonId) qC = qC.where('button_id', '==', buttonId);
        qC = withRange(qC, range);
        const C = await countAgg(qC);

        // conversions
        let qV = baseCol
          .where('type', '==', 'conversion')
          .where('expId', '==', exp.id)
          .where('variant', '==', v);
        if (goal) qV = qV.where('meta.goal', '==', goal);
        qV = withRange(qV, range);
        const V = await countAgg(qV);

        const ctr = E ? C / E : 0;
        const cvr = E ? V / E : 0;
        rows.push({ variant: v, exposures: E, clicks: C, conversions: V, ctr, cvr });
        tExp += E; tClk += C; tConv += V;
      }

      results.push({ expId: exp.id, rows, totals: { exposures: tExp, clicks: tClk, conversions: tConv } });
    }

    return new Response(JSON.stringify({ results }), { headers: { 'content-type': 'application/json' } });
  } catch (e: any) {
    console.error('experiments API error', e);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};
