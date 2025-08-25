<script lang="ts">
  import MetricCard from '../../components/MetricCard.svelte';

  import Chart from '../../components/Chart.svelte';
  import TimeSelector from '../../components/TimeSelector.svelte';
  import { Users, Activity, UserPlus, UserCheck } from 'lucide-svelte';
  import { authReady, user } from '$lib/stores/auth';

  let loading = true;
  let project = 'scalable-web-solutions';
  let days = 7;

  async function loadData() {
    try {
      console.log('loadData(users)');

    } catch (e) {
      console.error('loadData(users) failed', e);
      // keep defaults
    } finally {
      loading = false;
    }
  }

  let salesScripts = [
    {
      name: 'Sales Script 1',
      id: 1,
      clicks: 1234,
      conversions: 123,
      revenue: 12345,
    },
    {
      name: 'Sales Script 2',
      id: 2,
      clicks: 1234,
      conversions: 123,
      revenue: 12345,
    },
    {
      name: 'Sales Script 3',
      id: 3,
      clicks: 1234,
      conversions: 123,
      revenue: 12345,
    },
  ];


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

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 w-full">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Select Sales Script to Track</h3>
          <div class="space-y-4">
            {#each salesScripts as script}
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-500">{script.name}</span>
                <span class="text-sm font-medium text-gray-500">{script.clicks}</span>
                <button class="text-sm font-medium text-blue-600">Select</button>
              </div>
            {/each}
          </div>
        </div>
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 w-full">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Select Sales Script to Compare</h3>
          <div class="space-y-4">
            {#each salesScripts as script}
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-500">{script.name}</span>
                <span class="text-sm font-medium text-gray-500">{script.clicks}</span>
                <button class="text-sm font-medium text-blue-600">Select</button>
              </div>
            {/each}

          </div>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div>
        <h1>Showing Performance for Sales Script 1</h1>
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 w-full">
          <Chart title="Clicks" data={[1234, 1010, 1500, 2852, 1002, 900, 2000]} labels={['1', '2', '3', '4', '5', '6', '7']} />
        </div>

      </div>
      <div>
        <h1>Showing Performance for Sales Script 2</h1>
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 w-full">
          <Chart title="Clicks" data={[1992, 5923, 3382, 2852, 2052, 921, 4209]} labels={['1', '2', '3', '4', '5', '6', '7']} />
        </div>
      </div>
    </div>


    <div class="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-8">
      <div>
        <h1>Update Data</h1>
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 w-full">
          <form>
            <div class="mb-4">
              <label for="salesScript" class="block text-sm font-medium text-gray-700">Sales Script</label>
              <select id="salesScript" name="salesScript" class="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                <option value="1">Sales Script 1</option>
                <option value="2">Sales Script 2</option>
                <option value="3">Sales Script 3</option>
              </select>
            </div>
            <div class="mb-4">
              <label for="date" class="block text-sm font-medium text-gray-700">Date</label>
              <input type="date" id="date" name="date" class="mt-1 block w-full p-2 border border-gray-300 rounded-md">
            </div>
            <div class="mb-4">
              <label for="time" class="block text-sm font-medium text-gray-700">Time</label>
              <input type="time" id="time" name="time" class="mt-1 block w-full p-2 border border-gray-300 rounded-md">
            </div>
            <div class="mb-4">
              <label for="leads" class="block text-sm font-medium text-gray-700">Furthest Phase</label>

              <select id="salesScript" name="salesScript" class="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                <option value="1">Opening</option>
                <option value="2">Scheduled Call</option>
                <option value="3">Closed Deal</option>
              </select>
            </div>
            <input type="submit" value="Update" class="bg-blue-500 text-white px-4 py-2 rounded-md">
            <input type="reset" value="Reset" class="bg-gray-300 text-gray-700 px-4 py-2 rounded-md">

        </form>
        </div>
      </div>
    </div>
  </div>
{/if}
