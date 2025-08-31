import type { RequestHandler } from './$types';
import { adminDb, AdminTimestamp } from '$lib/server/firebase-admin';

export const GET: RequestHandler = async ({ url }) => {
  const project = url.searchParams.get('projectId') ?? 'scalable-web-solutions';
  const days = Number(url.searchParams.get('days') ?? 7);
  const now = Date.now();
  const msDay = 86400000;

  const startCurr = AdminTimestamp.fromMillis(now - days * msDay);
  const startPrev = AdminTimestamp.fromMillis(now - 2 * days * msDay);

  const events = adminDb.collection(`clients/${project}/events`);

  // pull TWO periods to compute deltas; allow pageview/page_view
  const IN_TYPES = ['pageview', 'page_view'] as const;
  const snap = await events
    .where('timestamp', '>=', startPrev)
    .where('type', 'in', IN_TYPES)
    .orderBy('timestamp', 'asc')
    .get();

  const localDayKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const onlyPath = (raw: string | undefined) => {
    if (!raw) return '/';
    try { return new URL(raw, 'https://x').pathname || '/'; }
    catch { return String(raw).split(/[?#]/)[0] || '/'; }
  };

  // accumulators
  const usersInCurr = new Map<string, number>(); // firstSeenMs inside CURRENT window only
  const sessionsInCurr = new Set<string>();

  const perDayUsersPrev  = new Map<string, Set<string>>();
  const perDayUsersCurr  = new Map<string, Set<string>>();
  const perDaySessPrev   = new Map<string, Set<string>>();
  const perDaySessCurr   = new Map<string, Set<string>>();
  const topPagesCurr     = new Map<string, { users: Set<string>; sessions: Set<string> }>();

  const startCurrMs = startCurr.toMillis();
  snap.forEach((doc) => {
    const d: any = doc.data();
    const uid = String(d.anonUserId || '');
    const sid = String(d.sessionId || '');
    const ts: Date = d.timestamp?.toDate ? d.timestamp.toDate() : new Date(d.timestamp);
    const day = localDayKey(ts);
    const isCurr = ts.getTime() >= startCurrMs;

    // series bucket
    const usersMap  = isCurr ? perDayUsersCurr : perDayUsersPrev;
    const sessMap   = isCurr ? perDaySessCurr  : perDaySessPrev;
    if (!sessMap.has(day))  sessMap.set(day, new Set());
    if (sid)                sessMap.get(day)!.add(sid);
    if (uid) {
      if (!usersMap.has(day)) usersMap.set(day, new Set());
      usersMap.get(day)!.add(uid);
    }

    // totals / top pages for CURRENT window only
    if (isCurr) {
      if (sid) sessionsInCurr.add(sid);
      if (uid && !usersInCurr.has(uid)) usersInCurr.set(uid, ts.getTime());

      const p = onlyPath(d.url);
      if (!topPagesCurr.has(p)) topPagesCurr.set(p, { users: new Set(), sessions: new Set() });
      if (uid) topPagesCurr.get(p)!.users.add(uid);
      if (sid) topPagesCurr.get(p)!.sessions.add(sid);
    }
  });

  // build label lists (local days)
  const today = new Date(); today.setHours(0,0,0,0);
  const labelsCurr: string[] = [];
  const labelsPrev: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d1 = new Date(today); d1.setDate(today.getDate() - i);
    labelsCurr.push(localDayKey(d1));
    const d0 = new Date(today); d0.setDate(today.getDate() - i - days);
    labelsPrev.push(localDayKey(d0));
  }

  const arr = (labels: string[], map: Map<string, Set<string>>) =>
    labels.map((k) => map.get(k)?.size ?? 0);

  const uniqueUsersData      = arr(labelsCurr, perDayUsersCurr);
  const totalSessionsData    = arr(labelsCurr, perDaySessCurr);
  const prevUniqueUsersData  = arr(labelsPrev,  perDayUsersPrev);
  const prevTotalSessionsData= arr(labelsPrev,  perDaySessPrev);

  const sum = (a: number[]) => a.reduce((s, n) => s + n, 0);
  const pct = (curr: number, prev: number) => (prev ? ((curr - prev) / prev) * 100 : null);

  const totalUniqueUsers = usersInCurr.size;
  const totalSessions    = sessionsInCurr.size;

  // returning/new classification: did this uid exist BEFORE startCurr?
  const uids = [...usersInCurr.keys()];
  const chunk = <T,>(xs: T[], n: number) => Array.from({length: Math.ceil(xs.length/n)}, (_,i)=>xs.slice(i*n,i*n+n));
  const preWindowSeen = new Set<string>();
  await Promise.all(
    chunk(uids, 10).map(async (group) => {
      if (!group.length) return;
      const q = await events
        .where('type', 'in', IN_TYPES)
        .where('anonUserId', 'in', group)
        .where('timestamp', '<', startCurr)
        .select('anonUserId')
        .limit(1)
        .get();
      q.forEach((doc) => preWindowSeen.add(String(doc.get('anonUserId'))));
    })
  );
  const returningUsers = preWindowSeen.size;
  const newUsers = Math.max(0, totalUniqueUsers - returningUsers);

  const topPages = [...topPagesCurr.entries()]
    .map(([page, sets]) => ({ page, uniqueUsers: sets.users.size, totalSessions: sets.sessions.size }))
    .sort((a,b)=> b.uniqueUsers - a.uniqueUsers)
    .slice(0,20);

  const usersCurrSum    = sum(uniqueUsersData);
  const usersPrevSum    = sum(prevUniqueUsersData);
  const sessCurrSum     = sum(totalSessionsData);
  const sessPrevSum     = sum(prevTotalSessionsData);

  const body = {
    days,
    labels: labelsCurr,
    uniqueUsersData,
    totalSessionsData,
    prevUniqueUsersData,
    prevTotalSessionsData,
    deltas: {
      usersPct: pct(usersCurrSum, usersPrevSum),
      sessionsPct: pct(sessCurrSum, sessPrevSum)
    },
    // headline metrics
    totalUniqueUsers,
    totalSessions,
    newUsers,
    returningUsers,
    userSegments: [
      { segment: 'New', count: newUsers,       percentage: totalUniqueUsers ? Math.round((newUsers/totalUniqueUsers)*100) : 0, color: 'bg-indigo-500' },
      { segment: 'Returning', count: returningUsers, percentage: totalUniqueUsers ? Math.round((returningUsers/totalUniqueUsers)*100) : 0, color: 'bg-emerald-500' }
    ],
    topPages
  };

  return new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });
};