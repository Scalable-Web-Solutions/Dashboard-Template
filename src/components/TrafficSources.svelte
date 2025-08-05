<script lang="ts">
  const trafficData = [
    { source: 'Direct', visitors: 15420, percentage: 45, color: 'bg-blue-500' },
    { source: 'Organic Search', visitors: 8940, percentage: 26, color: 'bg-green-500' },
    { source: 'Social Media', visitors: 5130, percentage: 15, color: 'bg-purple-500' },
    { source: 'Referrals', visitors: 3080, percentage: 9, color: 'bg-orange-500' },
    { source: 'Email', visitors: 1710, percentage: 5, color: 'bg-red-500' },
  ];
</script>

<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
  <h3 class="text-lg font-semibold text-gray-900 mb-4">Traffic Sources</h3>
  <div class="space-y-4">
    {#each trafficData as item}
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class={`w-3 h-3 rounded-full ${item.color}`}></div>
          <span class="text-sm font-medium text-gray-700">{item.source}</span>
        </div>
        <div class="flex items-center space-x-3">
          <span class="text-sm text-gray-500">{item.visitors.toLocaleString()}</span>
          <span class="text-sm font-medium text-gray-900">{item.percentage}%</span>
        </div>
      </div>
    {/each}
  </div>
</div>
