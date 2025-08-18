<script lang="ts">
  import MetricCard from '../components/MetricCard.svelte';
  import Chart from '../components/Chart.svelte';
  import TimeSelector from '../components/TimeSelector.svelte';
  import { Users, Activity, UserPlus, UserCheck } from 'lucide-svelte';
  import { authReady, user } from '$lib/stores/auth';

  // state
  let loading = true;
  let project = 'scalable-web-solutions';
  let days = 7;

  // metrics
  let totalUniqueUsers = 0;
  let totalSessions = 0;
  let newUsers = 0;
  let returningUsers = 0;

  // series
  let labels: string[] = [];
  let uniqueUsersData: number[] = [];
  let totalSessionsData: number[] = [];

  // segments + top pages
  let userSegments: Array<{ segment: string; count: number; percentage: number; color: string }> = [];
  let topPages: Array<{ page: string; uniqueUsers: number; totalSessions: number }> = [];

  async function loadData() {
    try {
      const res = await fetch(
        `/api/users?projectId=${encodeURIComponent(project)}&days=${days}`,
        { cache: 'no-store' }
      );
      if (!res.ok) {
        const txt = await res.text();
        console.error('Users API error', res.status, txt);
        throw new Error(`Users API ${res.status}`);
      }
      const data = await res.json();

      totalUniqueUsers = Number(data.totalUniqueUsers || 0);
      totalSessions    = Number(data.totalSessions || 0);
      newUsers         = Number(data.newUsers || 0);
      returningUsers   = Number(data.returningUsers || 0);

      labels            = data.labels ?? [];
      uniqueUsersData   = data.uniqueUsersData ?? [];
      totalSessionsData = data.totalSessionsData ?? [];

      userSegments = Array.isArray(data.userSegments) ? data.userSegments : [];
      topPages     = Array.isArray(data.topPages) ? data.topPages : [];
    } catch (e) {
      console.error('loadData(users) failed', e);
      // keep defaults
    } finally {
      loading = false;
    }
  }

  // re-run when auth ready
  $: if ($authReady && $user && loading) loadData().catch(console.error);
</script>

{#if loading}
  <div class="flex items-center justify-center py-12">Loading...</div>
{:else}
  <div class="p-6 w-full">
    <div class="mb-6">
      <TimeSelector />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <MetricCard title="Unique Users"    value={totalUniqueUsers.toLocaleString()} change="N/A" changeType="neutral" icon={Users} />
      <MetricCard title="Total Sessions"  value={totalSessions.toLocaleString()}   change="N/A" changeType="neutral" icon={Activity} />
      <MetricCard title="New Users"       value={newUsers.toLocaleString()}        change="N/A" changeType="neutral" icon={UserPlus} />
      <MetricCard title="Returning Users" value={returningUsers.toLocaleString()}  change="N/A" changeType="neutral" icon={UserCheck} />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <Chart title="Unique Users This Period" data={uniqueUsersData} labels={labels} type="area" />
      <Chart title="Sessions This Period"     data={totalSessionsData} labels={labels} type="bar" />
    </div>

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
