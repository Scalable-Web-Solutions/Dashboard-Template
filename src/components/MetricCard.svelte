<script lang="ts">
  // Icon must be a Svelte component, not a React component
  export let title: string;
  export let value: string;
  export let change: string;
  export let changeType: 'positive' | 'negative' | 'neutral';
  export let icon: any;

  $: changeColor = 
    changeType === 'positive'
      ? 'text-green-600'
      : changeType === 'negative'
        ? 'text-red-600'
        : 'text-gray-600';

  $: changeSymbol = changeType === 'positive' ? '+' : '';
</script>

<div class="bg-white rounded-lg p-8 hover:shadow-xs transition-shadow">
  <div class="flex items-center justify-between">
    <div>
      <p class="text-sm font-medium text-gray-600">{title}</p>
      <p class="text-3xl font-bold text-gray-900 mt-2 roboto">{value}</p>
    </div>
    <div class="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">

      <svelte:component this={icon} class="w-6 h-6 text-blue-600" />
    </div>
  </div>
  <div class="mt-4">
    <span class={`text-sm font-medium ${changeColor}`}>
      {changeSymbol}{change}
    </span>
    <span class="text-sm text-gray-500 ml-1">vs last month</span>
  </div>
</div>
