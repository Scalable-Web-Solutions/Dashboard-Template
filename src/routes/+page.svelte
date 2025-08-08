<script lang="ts">
  import { onMount } from "svelte";
  import MetricCard from '../components/MetricCard.svelte';
  import Chart from '../components/Chart.svelte';
  import TimeSelector from '../components/TimeSelector.svelte';
  import TrafficSources from '../components/TrafficSources.svelte';
  import RecentActivity from '../components/RecentActivity.svelte';
  import { Users, Eye, MousePointer, TrendingUp } from 'lucide-svelte';

  import { authReady, user } from '$lib/stores/auth';
  import { db } from "$lib/firebase";
  import {
    collection,
    query,
    where,
    getDocs,
    Timestamp,
    orderBy,
    limit
  } from "firebase/firestore";

  let loading = true;
  let project = "scalable-web-solutions"; // MUST match /clients/{projectId}

  let totalUsers = 0;
  let totalPageViews = 0;
  let totalCtaClicks = 0;
  let conversionRate = 0;
  let revenueGrowth = 0;

  let pageViewsChart: number[] = [];
  let pageViewsLabels: string[] = [];
  let sessionsChart: number[] = [];
  let sessionsLabels: string[] = [];

  async function loadData() {
    if (!db) throw new Error("Firestore not initialized");

    // last 7 days
    const weekAgoTs = Timestamp.fromMillis(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const eventsCol = collection(db, "clients", project, "events");
    // orderBy is optional but nice for consistency; Firestore may ask for an index once
    const qEvents = query(
      eventsCol,
      where("timestamp", ">=", weekAgoTs),
      orderBy("timestamp", "asc")
      // , limit(500) // uncomment to cap reads
    );

    const snap = await getDocs(qEvents);

    const usersSet = new Set<string>();
    const sessionsSet = new Set<string>();

    const perDayPageViews: Record<string, number> = {};
    const perDaySessions: Record<string, Set<string>> = {};

    let ctaClicks = 0;
    let pageviews = 0;

    snap.forEach((d) => {
      const data = d.data() as any;

      if (data.anonUserId) usersSet.add(String(data.anonUserId));
      if (data.sessionId) sessionsSet.add(String(data.sessionId));

      const ts: Date = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
      const day = ts.toISOString().slice(0, 10); // YYYY-MM-DD

      if (data.type === "pageview") {
        pageviews += 1;
        perDayPageViews[day] = (perDayPageViews[day] || 0) + 1;
        perDaySessions[day] = perDaySessions[day] || new Set<string>();
        if (data.sessionId) perDaySessions[day].add(String(data.sessionId));
      }

      if (data.type === "cta_click") {
        ctaClicks += 1;
      }
    });

    totalUsers = usersSet.size;
    totalPageViews = pageviews;
    totalCtaClicks = ctaClicks;
    conversionRate = totalUsers ? (ctaClicks / totalUsers) * 100 : 0;

    // Build last-7-days axis in order (today-6 … today)
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      days.push(d.toISOString().slice(0, 10));
    }

    pageViewsLabels = days;                 // keep as YYYY-MM-DD or map to weekday later
    pageViewsChart = days.map((day) => perDayPageViews[day] || 0);
    sessionsLabels = days;
    sessionsChart = days.map((day) => (perDaySessions[day] ? perDaySessions[day].size : 0));

    loading = false;
  }

  // Only load after auth is ready AND user is present
  $: if ($authReady && $user && loading) {
    loadData().catch(console.error);
  }

  onMount(() => {
    // reactive block above will run when auth becomes ready
  });
</script>

<main class="flex-1 p-6">
  {#if loading}
    <div class="flex items-center justify-center py-12">Loading dashboard...</div>
  {:else}
    <div class="mb-6">
      <TimeSelector />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <MetricCard title="Total Users" value={totalUsers.toLocaleString()} change="N/A" changeType="neutral" icon={Users} />
      <MetricCard title="Page Views" value={totalPageViews.toLocaleString()} change="N/A" changeType="neutral" icon={Eye} />
      <MetricCard title="Conversion Rate" value={conversionRate.toFixed(2) + "%"} change="N/A" changeType="neutral" icon={MousePointer} />
      <MetricCard title="Revenue Growth" value={"$" + revenueGrowth.toLocaleString()} change="N/A" changeType="neutral" icon={TrendingUp} />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <Chart title="Page Views This Week" data={pageViewsChart} labels={pageViewsLabels} type="bar" />
      <Chart title="Sessions This Week" data={sessionsChart} labels={sessionsLabels} type="line" />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <TrafficSources />
      <RecentActivity />
    </div>
  {/if}
</main>
