<script lang="ts">
  import { onMount } from "svelte";
  import Header from '../components/Header.svelte';
  import Sidebar from '../components/Sidebar.svelte';
  import MetricCard from '../components/MetricCard.svelte';
  import Chart from '../components/Chart.svelte';
  import TimeSelector from '../components/TimeSelector.svelte';
  import TrafficSources from '../components/TrafficSources.svelte';
  import RecentActivity from '../components/RecentActivity.svelte';
  import { Users, Eye, MousePointer, TrendingUp } from 'lucide-svelte';

  // State
  let loading = true;
  let project = "scalable-web-solutions"; // Or pull from analytics config

  let totalUsers = 0;
  let totalPageViews = 0;
  let totalCtaClicks = 0;
  let conversionRate = 0;
  let revenueGrowth = 45678; // Replace with your actual logic if available

  let pageViewsChart: number[] = [];
  let pageViewsLabels: string[] = [];
  let sessionsChart: number[] = [];
  let sessionsLabels: string[] = [];

  function waitForFirebase() {
    return new Promise<void>((resolve) => {
      if (typeof window !== "undefined" && window.firebase && window.firebase.firestore) {
        resolve();
      } else {
        setTimeout(() => resolve(waitForFirebase()), 50);
      }
    });
  }

  onMount(async () => {
    await waitForFirebase();

    const db = window.firebase.firestore();

    // Last 7 days for overview
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const eventsRef = db.collection("clients").doc(project).collection("events");
    const snap = await eventsRef.where("timestamp", ">", weekAgo).get();

    // For unique users and session
    let usersSet = new Set();
    let sessionsSet = new Set();

    // For calculating charts and metrics
    let perDayPageViews = {};
    let perDaySessions = {};

    let ctaClicks = 0;
    let pageviews = 0;

    snap.forEach(doc => {
      const data = doc.data();

      // Unique users
      if (data.anonUserId) usersSet.add(data.anonUserId);
      // Unique sessions
      if (data.sessionId) sessionsSet.add(data.sessionId);

      // Events
      if (data.type === "pageview") {
        pageviews += 1;

        // Chart by day
        const day = new Date(data.timestamp).toLocaleDateString(undefined, { weekday: "short" });
        perDayPageViews[day] = (perDayPageViews[day] || 0) + 1;
        perDaySessions[day] = perDaySessions[day] || new Set();
        if (data.sessionId) perDaySessions[day].add(data.sessionId);
      }

      if (data.type === "cta_click") {
        ctaClicks += 1;
      }

      // ...extend for other events...
    });

    // Aggregate metrics
    totalUsers = usersSet.size;
    totalPageViews = pageviews;
    totalCtaClicks = ctaClicks;
    conversionRate = totalUsers ? ((ctaClicks / totalUsers) * 100) : 0;

    // Chart data
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
      return d.toLocaleDateString(undefined, { weekday: "short" });
    });

    pageViewsLabels = days;
    pageViewsChart = days.map(day => perDayPageViews[day] || 0);
    sessionsLabels = days;
    sessionsChart = days.map(day => perDaySessions[day] ? perDaySessions[day].size : 0);

    // If you want to fill in TrafficSources and RecentActivity,
    // add similar queries here (or pass snap/docs down as props)

    loading = false;
  });
</script>

<main class="flex-1 p-6">
  {#if loading}
    <div class="flex items-center justify-center py-12">Loading dashboard...</div>
  {:else}
    <!-- Time Selector -->
    <div class="mb-6">
      <TimeSelector />
    </div>

    <!-- Metrics Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <MetricCard
        title="Total Users"
        value={totalUsers.toLocaleString()}
        change="N/A"
        changeType="neutral"
        icon={Users}
      />
      <MetricCard
        title="Page Views"
        value={totalPageViews.toLocaleString()}
        change="N/A"
        changeType="neutral"
        icon={Eye}
      />
      <MetricCard
        title="Conversion Rate"
        value={conversionRate.toFixed(2) + "%"}
        change="N/A"
        changeType="neutral"
        icon={MousePointer}
      />
      <MetricCard
        title="Revenue Growth"
        value={"$" + revenueGrowth.toLocaleString()}
        change="N/A"
        changeType="neutral"
        icon={TrendingUp}
      />
    </div>

    <!-- Charts Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <Chart
        title="Page Views This Week"
        data={pageViewsChart}
        labels={pageViewsLabels}
        type="bar"
      />
      <Chart
        title="Sessions This Week"
        data={sessionsChart}
        labels={sessionsLabels}
        type="line"
      />
    </div>

    <!-- Bottom Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <TrafficSources />
      <RecentActivity />
    </div>
  {/if}
</main>
