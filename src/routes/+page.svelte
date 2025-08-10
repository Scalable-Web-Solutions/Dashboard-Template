<script lang="ts">
  import MetricCard from '../components/MetricCard.svelte';
  import Chart from '../components/Chart.svelte';
  import TimeSelector from '../components/TimeSelector.svelte';
  import TrafficSources from '../components/TrafficSources.svelte';
  import RecentActivity from '../components/RecentActivity.svelte';
  import { Users, Eye, MousePointer, TrendingUp } from 'lucide-svelte';
  import { authReady, user } from '$lib/stores/auth';

  let loading = true;
  let project = 'scalable-web-solutions';
  let days = 7;

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
    const res = await fetch(`/api?projectId=${encodeURIComponent(project)}&days=${days}`, { cache: 'no-store' });
    const data = await res.json();

    totalUsers = data.totalUsers;
    totalPageViews = data.totalPageViews;
    totalCtaClicks = data.totalCtaClicks;
    conversionRate = data.conversionRate;

    pageViewsLabels = data.pageViews.labels;
    pageViewsChart  = data.pageViews.data;
    sessionsLabels  = data.sessions.labels;
    sessionsChart   = data.sessions.data;

    loading = false;
  }

  $: if ($authReady && $user && loading) {
    loadData().catch(console.error);
  }
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
