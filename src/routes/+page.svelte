<script lang="ts">
  import MetricCard from '../components/MetricCard.svelte';
  import Chart from '../components/Chart.svelte';
  import TrafficSources from '../components/TrafficSources.svelte';
  import RecentActivity from '../components/RecentActivity.svelte';
  import { Users, Eye, MousePointer, FlaskConical } from 'lucide-svelte';
  import { authReady, user } from '$lib/stores/auth';

  // --- state ---
  let loading = true;
  let errorMsg = '';
  let project = 'scalable-web-solutions';
  let days = 7;

  // --- headline totals ---
  let totalUsers = 0;
  let totalPageViews = 0;
  let totalCtaClicks = 0;
  let totalSessions = 0;
  let activeExperiments = 0;
  let conversionRate = 0; // sessions-based CTR (%)

  // --- charts ---
  let pvLabels: string[] = [];
  let pvData: number[] = [];
  let pvDeltaPct: number | null = null;

  let sessLabels: string[] = [];
  let sessData: number[] = [];
  let sessDeltaPct: number | null = null;

  async function loadOverview() {
    loading = true;
    errorMsg = '';
    try {
      const res = await fetch(`/api/overview?projectId=${encodeURIComponent(project)}&days=${days}`, { cache: 'no-store' });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        errorMsg = `Overview API ${res.status}${txt ? `: ${txt}` : ''}`;
        throw new Error(errorMsg);
      }
      const json = await res.json();

      // totals
      totalUsers         = json.totals?.totalUsers ?? 0;
      totalPageViews     = json.totals?.totalPageViews ?? 0;
      totalCtaClicks     = json.totals?.totalCtaClicks ?? 0;
      totalSessions      = json.totals?.totalSessions ?? 0;
      activeExperiments  = json.totals?.activeExperiments ?? 0;
      conversionRate     = json.totals?.conversionRateSessions ?? 0; // clicks / sessions * 100

      // charts
      pvLabels    = json.charts?.pageViews?.labels ?? [];
      pvData      = json.charts?.pageViews?.data ?? [];
      pvDeltaPct  = json.charts?.pageViews?.deltaPct ?? null;

      sessLabels  = json.charts?.sessions?.labels ?? [];
      sessData    = json.charts?.sessions?.data ?? [];
      sessDeltaPct= json.charts?.sessions?.deltaPct ?? null;
    } catch (e) {
      console.error('loadOverview failed:', e);
      // keep previous values so UI doesn't jump to zero
    } finally {
      loading = false;
    }
  }

  // initial load when auth is ready
  $: if ($authReady && $user && loading) loadOverview();

  // global time-range change (from select or charts’ mini menus)
  function onDaysChange(n: number) {
    if (n !== days) {
      days = n;
      loadOverview();
    }
  }

  // tiny helper for the top select label (optional)
  const labelFor = (n: number) =>
    n === 1 ? 'Last 24 hours' : n === 7 ? 'Last 7 days' : n === 30 ? 'Last 30 days' : n === 90 ? 'Last 90 days' : `Last ${n} days`;
</script>

<main class="flex-1 p-6 bg-[#F4F7FD]">
  {#if loading}
    <div class="flex items-center justify-center py-12">Loading dashboard...</div>
  {:else}
    {#if errorMsg}
      <div class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {errorMsg}
      </div>
    {/if}

    <!-- Global Time Range -->
    <div class="mb-6 flex items-center gap-2">
      <span class="text-sm text-gray-600">Time Range:</span>
      <select class="rounded-md border px-3 py-2 text-sm bg-white"
              bind:value={days}
              on:change={() => onDaysChange(Number(days))}>
        <option value="1">Last 24 hours</option>
        <option value="7">Last 7 days</option>
        <option value="30">Last 30 days</option>
        <option value="90">Last 90 days</option>
      </select>
      <span class="text-xs text-gray-400 ml-2">({labelFor(days)})</span>
    </div>

    <!-- Top metrics -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <MetricCard title="Total Users" value={totalUsers.toLocaleString()} change="N/A" changeType="neutral" icon={Users} />
      <MetricCard title="Page Views" value={totalPageViews.toLocaleString()} change="N/A" changeType="neutral" icon={Eye} />
      <MetricCard title="Conversion Rate" value={`${conversionRate.toFixed(2)}%`} change="N/A" changeType="neutral" icon={MousePointer} />
      <MetricCard title="Active Experiments" value={activeExperiments.toLocaleString()} change="N/A" changeType="neutral" icon={FlaskConical} />
    </div>

    <!-- Charts (Page Views & Sessions) -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <Chart
        title="Page Views"
        data={pvData}
        labels={pvLabels}
        type="area"
        deltaPct={pvDeltaPct}
        currentDays={days}
        on:range={(e) => onDaysChange(e.detail)}
      />
      <Chart
        title="Sessions"
        data={sessData}
        labels={sessLabels}
        type="bar"
        deltaPct={sessDeltaPct}
        currentDays={days}
        on:range={(e) => onDaysChange(e.detail)}
      />
    </div>

    <!-- Optional sections -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <TrafficSources />
      <RecentActivity />
    </div>
  {/if}
</main>
