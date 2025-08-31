import type { RequestHandler } from '@sveltejs/kit';
import { adminDb, AdminTimestamp } from '$lib/server/firebase-admin';

export const GET: RequestHandler = async ({ url }) => {
  const project = url.searchParams.get('projectId') ?? 'scalable-web-solutions';
  const days = Number(url.searchParams.get('days') ?? 7);
  const now = Date.now();
  const msDay = 86400000;

  const startCurr = AdminTimestamp.fromMillis(now - days * msDay);
  const startPrev = AdminTimestamp.fromMillis(now - 2 * days * msDay);

  const events = adminDb.collection(`clients/${project}/events`);
  const IN_TYPES = ['pageview', 'page_view'] as const;

  // --- Aggregation counts for current period ---
  const [pvAggSnap, ctaAggSnap] = await Promise.all([
    events.where('timestamp', '>=', startCurr).where('type', 'in', IN_TYPES).count().get(),
    events.where('timestamp', '>=', startCurr).where('type', '==', 'cta_click').count().get()
  ]);

  const totalPageViews = pvAggSnap.data().count || 0;
  const totalCtaClicks = ctaAggSnap.data().count || 0;

  // (optional) Active experiments
  let activeExperiments = 0;
  try {
    const expCol = adminDb.collection(`clients/${project}/experiments`);
    const [a, b] = await Promise.all([
      expCol.where('active', '==', true).count().get(),
      expCol.where('status', '==', 'active').count().get()
    ]);
    activeExperiments = Math.max(a.data().count ?? 0, b.data().count ?? 0);
  } catch {
    activeExperiments = 0;
  }

  // --- Pull TWO periods of pageviews for series & unique users/sessions ---
  const snap = await events
    .where('timestamp', '>=', startPrev)
    .where('type', 'in', IN_TYPES)
    .orderBy('timestamp', 'asc')
    .select('timestamp', 'sessionId', 'anonUserId', 'url', 'type')
    .get();

  const localDayKey = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // series buckets
  const perDayPVPrev: Record<string, number> = {};
  const perDayPVCurr: Record<string, number> = {};
  const perDaySessPrev = new Map<string, Set<string>>();
  const perDaySessCurr = new Map<string, Set<string>>();

  // totals (current window)
  const usersInCurr = new Set<string>();
  const sessionsInCurr = new Set<string>();

  const startCurrMs = startCurr.toMillis();

  snap.forEach((d) => {
    const data: any = d.data();
    const ts: Date = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
    const day = localDayKey(ts);
    const isCurr = ts.getTime() >= startCurrMs;
    const sessId = data.sessionId ? String(data.sessionId) : '';
    const uid = data.anonUserId ? String(data.anonUserId) : '';

    // page views
    if (isCurr) perDayPVCurr[day] = (perDayPVCurr[day] || 0) + 1;
    else perDayPVPrev[day] = (perDayPVPrev[day] || 0) + 1;

    // sessions
    const sessMap = isCurr ? perDaySessCurr : perDaySessPrev;
    if (!sessMap.has(day)) sessMap.set(day, new Set());
    if (sessId) sessMap.get(day)!.add(sessId);

    // current totals
    if (isCurr) {
      if (sessId) sessionsInCurr.add(sessId);
      if (uid) usersInCurr.add(uid);
    }
  });

  // labels for both windows (ending today)
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const labelsCurr: string[] = [];
  const labelsPrev: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d1 = new Date(today); d1.setDate(today.getDate() - i);
    labelsCurr.push(localDayKey(d1));
    const d0 = new Date(today); d0.setDate(today.getDate() - i - days);
    labelsPrev.push(localDayKey(d0));
  }

  const arrPV = (labels: string[], rec: Record<string, number>) => labels.map((k) => rec[k] || 0);
  const arrSess = (labels: string[], map: Map<string, Set<string>>) =>
    labels.map((k) => map.get(k)?.size ?? 0);

  const pageViewsCurr = arrPV(labelsCurr, perDayPVCurr);
  const pageViewsPrev = arrPV(labelsPrev, perDayPVPrev);
  const sessionsCurr  = arrSess(labelsCurr, perDaySessCurr);
  const sessionsPrev  = arrSess(labelsPrev, perDaySessPrev);

  const sum = (xs: number[]) => xs.reduce((s, n) => s + n, 0);
  const pct = (curr: number, prev: number) => (prev ? ((curr - prev) / prev) * 100 : null);

  const pvDeltaPct   = pct(sum(pageViewsCurr), sum(pageViewsPrev));
  const sessDeltaPct = pct(sum(sessionsCurr),   sum(sessionsPrev));

  const totalUsers = usersInCurr.size;         // unique users (current window)
  const totalSessions = sessionsInCurr.size;   // unique sessions (current window)

  // Conversion rate — more stable as clicks / sessions (also return /users if you want)
  const conversionRateSessions = totalSessions ? (totalCtaClicks / totalSessions) * 100 : 0;
  const conversionRateUsers    = totalUsers ? (totalCtaClicks / totalUsers) * 100 : 0;

  const body = {
    days,
    totals: {
      totalUsers,
      totalPageViews,
      totalCtaClicks,
      totalSessions,
      activeExperiments,
      conversionRateSessions,
      conversionRateUsers
    },
    charts: {
      pageViews: {
        labels: labelsCurr,
        data: pageViewsCurr,
        prev: pageViewsPrev,
        deltaPct: pvDeltaPct
      },
      sessions: {
        labels: labelsCurr,
        data: sessionsCurr,
        prev: sessionsPrev,
        deltaPct: sessDeltaPct
      }
    }
  };

  return new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });
};
