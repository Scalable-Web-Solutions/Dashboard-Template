<script lang="ts">
  import MetricCard from '../components/MetricCard.svelte';
  import Chart from '../components/Chart.svelte';
  import TimeSelector from '../components/TimeSelector.svelte';
  import { Users, Activity, UserPlus, UserCheck } from 'lucide-svelte';
  import { authReady, user } from '$lib/stores/auth';

  // --- state ---
  let loading = true;
  let errorMsg = '';
  let project = 'scalable-web-solutions';
  let days = 7; // global range

  // --- headline metrics ---
  let totalUniqueUsers = 0;
  let totalSessions = 0;
  let newUsers = 0;
  let returningUsers = 0;

  // --- series ---
  let labels: string[] = [];
  let uniqueUsersData: number[] = [];
  let totalSessionsData: number[] = [];

  // --- deltas (period-over-period) ---
  let deltaUsersPct: number | null = null;
  let deltaSessionsPct: number | null = null;

  // --- segments & top pages ---
  let userSegments: Array<{ segment: string; count: number; percentage: number; color: string }> = [];
  let topPages: Array<{ page: string; uniqueUsers: number; totalSessions: number }> = [];

  async function loadData() {
    loading = true;
    errorMsg = '';
    try {
      const res = await fetch(
        `/api/users?projectId=${encodeURIComponent(project)}&days=${days}`,
        { cache: 'no-store' }
      );
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        errorMsg = `Users API ${res.status}${txt ? `: ${txt}` : ''}`;
        throw new Error(errorMsg);
      }
      const data = await res.json();

      // headline
      totalUniqueUsers = Number(data.totalUniqueUsers || 0);
      totalSessions    = Number(data.totalSessions || 0);
      newUsers         = Number(data.newUsers || 0);
      returningUsers   = Number(data.returningUsers || 0);

      // series
      labels            = Array.isArray(data.labels) ? data.labels : [];
      uniqueUsersData   = Array.isArray(data.uniqueUsersData) ? data.uniqueUsersData : [];
      totalSessionsData = Array.isArray(data.totalSessionsData) ? data.totalSessionsData : [];

      // deltas
      deltaUsersPct    = typeof data?.deltas?.usersPct === 'number' ? data.deltas.usersPct : null;
      deltaSessionsPct = typeof data?.deltas?.sessionsPct === 'number' ? data.deltas.sessionsPct : null;

      // details
      userSegments = Array.isArray(data.userSegments) ? data.userSegments : [];
      topPages     = Array.isArray(data.topPages) ? data.topPages : [];
    } catch (e) {
      console.error('loadData(users) failed', e);
      // keep prior values so UI doesn’t jump to zero
    } finally {
      loading = false;
    }
  }

  // initial load when auth resolves
  $: if ($authReady && $user && loading) {
    loadData();
  }

  // when the global range changes
  function onDaysChange(n: number) {
    if (n !== days) {
      days = n;
      loadData();
    }
  }

  // (optional) derive display-friendly delta strings for metric cards later if you add them
  const fmtPct = (p: number | null) =>
    p === null ? 'N/A' : `${(p >= 0 ? '+' : '−')}${Math.abs(p).toFixed(0)}%`;
</script>

{#if loading}
  <div class="flex items-center justify-center py-12">Loading...</div>
{:else}
  <div class="p-6 w-full">
    {#if errorMsg}
      <div class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {errorMsg}
      </div>
    {/if}

    <!-- Global time range selector (binds to `days`) -->
    <div class="mb-6">
      <!-- If your TimeSelector exposes bind:value, use it; otherwise swap for a native select -->
      <!-- Example native control: -->
      <label class="mr-2 text-sm text-gray-600">Time Range:</label>
      <select class="rounded-md border px-3 py-2 text-sm"
              bind:value={days}
              on:change={() => onDaysChange(Number(days))}>
        <option value="1">Last 24 hours</option>
        <option value="7">Last 7 days</option>
        <option value="30">Last 30 days</option>
        <option value="90">Last 90 days</option>
      </select>
    </div>

    <!-- Headline metrics -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <MetricCard title="Unique Users"    value={totalUniqueUsers.toLocaleString()} change="N/A" changeType="neutral" icon={Users} />
      <MetricCard title="Total Sessions"  value={totalSessions.toLocaleString()}   change="N/A" changeType="neutral" icon={Activity} />
      <MetricCard title="New Users"       value={newUsers.toLocaleString()}        change="N/A" changeType="neutral" icon={UserPlus} />
      <MetricCard title="Returning Users" value={returningUsers.toLocaleString()}  change="N/A" changeType="neutral" icon={UserCheck} />
    </div>

    <!-- Charts (each chart also exposes its own quick range menu; both stay in sync) -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <Chart
        title="Unique Users This Period"
        data={uniqueUsersData}
        labels={labels}
        type="area"
        deltaPct={deltaUsersPct}
        currentDays={days}
        on:range={(e) => onDaysChange(e.detail)}
      />
      <Chart
        title="Sessions This Period"
        data={totalSessionsData}
        labels={labels}
        type="bar"
        deltaPct={deltaSessionsPct}
        currentDays={days}
        on:range={(e) => onDaysChange(e.detail)}
      />
    </div>

    <!-- Segments & Top pages -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">User Segments</h3>
        <div class="space-y-4">
          {#each userSegments as segment (segment.segment)}
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class={`w-3 h-3 rounded-full ${segment.color}`}></div>
                <span class="text-sm font-medium text-gray-700">{segment.segment}</span>
              </div>
              <div class="flex items-center space-x-3">
                <span class="text-sm text-gray-500">{segment.count.toLocaleString()}</span>
                <span class="text-sm font-medium text-gray-900">{segment.percentage}%</span>
              </div>
            </div>
          {/each}
        </div>
        <div class="mt-6">
          <div class="flex rounded-lg overflow-hidden h-3">
            {#each userSegments as segment}
              <div class={segment.color} style="width: {segment.percentage}%"></div>
            {/each}
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Top Pages by Users</h3>
        <div class="space-y-4">
          <div class="flex items-center justify-between text-xs font-medium text-gray-500 uppercase tracking-wider">
            <span>Page</span>
            <div class="flex space-x-8">
              <span>Unique</span>
              <span>Total Sessions</span>
            </div>
          </div>
          {#each topPages as page (page.page)}
            <div class="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div class="flex-1">
                <span class="text-sm font-medium text-gray-900">{page.page}</span>
              </div>
              <div class="flex space-x-8 text-sm">
                <span class="text-blue-600 font-medium w-16 text-right">{page.uniqueUsers.toLocaleString()}</span>
                <span class="text-gray-600 w-24 text-right">{page.totalSessions.toLocaleString()}</span>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
{/if}
