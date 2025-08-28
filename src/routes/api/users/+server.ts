import type { RequestHandler } from './$types';
import { adminDb, AdminTimestamp } from '$lib/server/firebase-admin';

export const GET: RequestHandler = async ({ url }) => {
  const project = url.searchParams.get('projectId') ?? 'scalable-web-solutions';
  const days = Number(url.searchParams.get('days') ?? 7);
  const now = Date.now();
  const start = AdminTimestamp.fromMillis(now - days * 24 * 60 * 60 * 1000);

  const events = adminDb.collection(`clients/${project}/events`);

  // Pull just the window we care about (ordered for per-user firstSeen-in-window)
  // CHANGE 1: restrict to pageviews (you only use these for users/sessions/topPages)
  // CHANGE 2: field mask to trim payload
  const snap = await events
    .where('timestamp', '>=', start)
    .where('type', '==', 'pageview')
    .orderBy('timestamp', 'asc')
    .select('timestamp', 'anonUserId', 'sessionId', 'url', 'type')
    .get();

  // Accumulators
  const users = new Map<string, number>();              // anonUserId -> firstSeenMs (in-window)
  const sessions = new Set<string>();
  const perDayUsers = new Map<string, Set<string>>();   // YYYY-MM-DD -> set of anonUserId
  const perDaySessions = new Map<string, Set<string>>();// YYYY-MM-DD -> set of sessionId
  const topPages = new Map<string, { users: Set<string>; sessions: Set<string> }>();

  const dayKey = (d: Date) => d.toISOString().slice(0, 10);

  snap.forEach((doc) => {
    const data: any = doc.data();
    const uid = String(data.anonUserId || '');
    const sid = String(data.sessionId || '');
    const ts = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
    const day = dayKey(ts);
    const urlPath = String(data.url || '/');

    if (sid) sessions.add(sid);
    if (uid) {
      if (!users.has(uid)) users.set(uid, ts.getTime());
      if (!perDayUsers.has(day)) perDayUsers.set(day, new Set());
      perDayUsers.get(day)!.add(uid);
    }
    if (!perDaySessions.has(day)) perDaySessions.set(day, new Set());
    if (sid) perDaySessions.get(day)!.add(sid);

    // Top pages (count uniques & sessions touching each path)
    if (!topPages.has(urlPath)) topPages.set(urlPath, { users: new Set(), sessions: new Set() });
    if (uid) topPages.get(urlPath)!.users.add(uid);
    if (sid) topPages.get(urlPath)!.sessions.add(sid);
  });

  // Series labels for last N days
  const labels: string[] = [];
  for (let i = days - 1; i >= 0; i--) labels.push(dayKey(new Date(now - i * 86400000)));

  const uniqueUsersData = labels.map((d) => perDayUsers.get(d)?.size ?? 0);
  const totalSessionsData = labels.map((d) => perDaySessions.get(d)?.size ?? 0);

  const totalUniqueUsers = users.size;
  const totalSessions = sessions.size;

  // Approx new/returning (within window)
  const windowStartMs = now - days * 86400000;
  let newUsers = 0;
  users.forEach((firstSeenMs) => { if (firstSeenMs >= windowStartMs) newUsers++; });
  const returningUsers = Math.max(0, totalUniqueUsers - newUsers);

  const topPagesArr = [...topPages.entries()]
    .map(([page, sets]) => ({ page, uniqueUsers: sets.users.size, totalSessions: sets.sessions.size }))
    .sort((a, b) => b.uniqueUsers - a.uniqueUsers)
    .slice(0, 20);

  const userSegments = [
    { segment: 'New',       count: newUsers,       percentage: totalUniqueUsers ? Math.round((newUsers / totalUniqueUsers) * 100) : 0, color: 'bg-indigo-500' },
    { segment: 'Returning', count: returningUsers, percentage: totalUniqueUsers ? Math.round((returningUsers / totalUniqueUsers) * 100) : 0, color: 'bg-emerald-500' }
  ];

  const body = {
    totalUniqueUsers,
    totalSessions,
    newUsers,
    returningUsers,
    labels,
    uniqueUsersData,
    totalSessionsData,
    userSegments,
    topPages: topPagesArr
  };

  return new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });
};
