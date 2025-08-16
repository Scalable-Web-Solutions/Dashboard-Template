<script lang="ts">
  import MetricCard from '../components/MetricCard.svelte';
  import Chart from '../components/Chart.svelte';
  import TimeSelector from '../components/TimeSelector.svelte';
  import TrafficSources from '../components/TrafficSources.svelte';
  import RecentActivity from '../components/RecentActivity.svelte';
  import { Users, Eye, MousePointer, FlaskConical } from 'lucide-svelte';
  import { authReady, user } from '$lib/stores/auth';

  let loading = true;
  let project = 'scalable-web-solutions';
  let days = 7;

  let totalUsers = 0;
  let totalPageViews = 0;
  let totalCtaClicks = 0;
  let conversionRate = 0;
  let activeExperiments = 0;

  let pageViewsChart: number[] = [];
  let pageViewsLabels: string[] = [];
  let sessionsChart: number[] = [];
  let sessionsLabels: string[] = [];
  let ctaChart: number[] = [];
  let ctaLabels: string[] = [];

  async function loadData() {
    try {
      const res = await fetch(`/api?projectId=${encodeURIComponent(project)}&days=${days}`, { cache: 'no-store' });

      if (!res.ok) {
        const text = await res.text();
        console.error('API error status', res.status, text);
        throw new Error(`API ${res.status}`);
      }

      const data = await res.json();

      totalUsers      = Number(data.totalUsers || 0);
      totalPageViews  = Number(data.totalPageViews || 0);
      totalCtaClicks  = Number(data.totalCtaClicks || 0);
      conversionRate  = Number(data.conversionRate || 0);
      activeExperiments = Number(data.activeExperiments || 0);

      pageViewsLabels = data.pageViews?.labels ?? [];
      pageViewsChart  = data.pageViews?.data   ?? [];
      sessionsLabels  = data.sessions?.labels  ?? [];
      sessionsChart   = data.sessions?.data    ?? [];
      ctaLabels       = data.cta?.labels       ?? [];
      ctaChart        = data.cta?.data         ?? [];

    } catch (e) {
      console.error('loadData failed:', e);
      // keep defaults so UI renders
    } finally {
      loading = false;
    }
  }

  $: if ($authReady && $user && loading) {
    loadData().catch(console.error);
  }
</script>

<main class="flex-1 p-6 bg-[#F4F7FD]">
  {#if loading}
    <div class="flex items-center justify-center py-12">Loading dashboard...</div>
  {:else}
    <div class="mb-6">
      <TimeSelector />
    </div>

    <!-- Top metrics -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <MetricCard title="Total Users" value={totalUsers.toLocaleString()} change="N/A" changeType="neutral" icon={Users} />
      <MetricCard title="Page Views" value={totalPageViews.toLocaleString()} change="N/A" changeType="neutral" icon={Eye} />
      <MetricCard title="Conversion Rate" value={conversionRate.toFixed(2) + "%"} change="N/A" changeType="neutral" icon={MousePointer} />
      <MetricCard title="Active Experiments" value={activeExperiments.toString()} change="N/A" changeType="neutral" icon={FlaskConical} />
    </div>

    <!-- Charts -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <Chart title="Page Views" data={pageViewsChart} labels={pageViewsLabels} type="area" />
      <Chart title="CTA Clicks" data={ctaChart} labels={ctaLabels} type="bar" />
    </div>

    <!-- Optional traffic + activity -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <TrafficSources />
      <RecentActivity />
    </div>
  {/if}
</main>
