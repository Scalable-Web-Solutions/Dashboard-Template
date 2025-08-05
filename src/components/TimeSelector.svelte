<script lang="ts">
  import { Calendar } from 'lucide-svelte';

  const timeRanges = [
    { label: 'Last 7 days', value: '7d' },
    { label: 'Last 30 days', value: '30d' },
    { label: 'Last 3 months', value: '3m' },
    { label: 'Last year', value: '1y' },
  ];

  // Optional: For controlled select value
  let selected = timeRanges[0].value;
</script>

<div class="flex items-center space-x-4">
  <div class="flex items-center space-x-2">
    <Calendar class="w-4 h-4 text-gray-500" />
    <span class="text-sm font-medium text-gray-700">Time Range:</span>
  </div>
  <select
    bind:value={selected}
    class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  >
    {#each timeRanges as range}
      <option value={range.value}>{range.label}</option>
    {/each}
  </select>
</div>
