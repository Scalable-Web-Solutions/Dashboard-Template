// src/routes/api/overview/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { adminDb, AdminTimestamp } from '$lib/server/firebase-admin';

export const GET: RequestHandler = async ({ url }) => {
  const project = url.searchParams.get('projectId') ?? 'scalable-web-solutions';
  const days = Number(url.searchParams.get('days') ?? 7);
  const now = Date.now();
  const start = AdminTimestamp.fromMillis(now - days * 864e5);

  const events = adminDb.collection(`clients/${project}/events`);

  // Cheap totals via aggregations (no doc scans)
  const [pvAggSnap, ctaAggSnap] = await Promise.all([
    events.where('timestamp', '>=', start).where('type', '==', 'pageview').count().get(),
    events.where('timestamp', '>=', start).where('type', '==', 'cta_click').count().get(),
  ]);

  const totalPageViews = pvAggSnap.data().count || 0;
  const totalCtaClicks = ctaAggSnap.data().count || 0;

  // --- OPTION A: still one scan, but only pageviews, and only the fields you need
  // This avoids reading CTA docs entirely and trims bandwidth with .select(...)
  const snap = await events
    .where('timestamp', '>=', start)
    .where('type', '==', 'pageview')
    .orderBy('timestamp', 'asc')
    .select('timestamp', 'sessionId', 'anonUserId', 'type') // field mask
    .get();

  const users = new Set<string>();
  const perDayPV: Record<string, number> = {};
  const perDaySessions: Record<string, Set<string>> = {};

  snap.forEach(d => {
    const data = d.data() as any;
    if (data.anonUserId) users.add(String(data.anonUserId));
    const ts: Date = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
    const day = ts.toISOString().slice(0, 10);

    perDayPV[day] = (perDayPV[day] || 0) + 1;
    perDaySessions[day] ??= new Set<string>();
    if (data.sessionId) perDaySessions[day]!.add(String(data.sessionId));
  });

  const labels: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    labels.push(new Date(now - i * 864e5).toISOString().slice(0, 10));
  }

  const body = {
    totalUsers: users.size,
    totalPageViews,
    totalCtaClicks,
    conversionRate: users.size ? (totalCtaClicks / users.size) * 100 : 0,
    pageViews: { labels, data: labels.map(d => perDayPV[d] || 0) },
    sessions:  { labels, data: labels.map(d => perDaySessions[d]?.size || 0) },
  };

  return new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });
};
