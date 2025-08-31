<script lang="ts">
  import type { ApexOptions } from "apexcharts";
  import { Chart as FlowbiteChart } from "@flowbite-svelte-plugins/chart";
  import { Button, Dropdown, DropdownItem } from "flowbite-svelte";
  import { ChevronDown, ChevronRight } from "lucide-svelte";
    import { browser } from "$app/environment";
    import { createEventDispatcher } from "svelte";

  export let title: string;
  export let data: number[];
  export let labels: string[];
  export let type: 'line' | 'bar' | 'area' | 'pie' = 'area';
  export let legend: boolean = true;
  export let colors: string[] = [];

  $: options = {
    chart: {
      height: "260px",
      type,
      fontFamily: "Inter, sans-serif",
      dropShadow: { enabled: false },
      toolbar: { show: false },
      sparkline: { enabled: true }
    },
    tooltip: { enabled: true },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.25,
        opacityTo: 0,
        shade: "#2563eb",
        gradientToColors: ["#2563eb"]
      }
    },
    dataLabels: { enabled: false },
    stroke: { width: 3, curve: "smooth", colors: ["#2563eb"] },
    grid: { show: false },
    series: [
      {
        name: title,
        data,
        color: "#2563eb"
      }
    ],
    xaxis: { show: false, categories: labels },
    yaxis: { show: false }
  };

  export let currentDays: number = 7;
  export let deltaPct: number | null = null;

  const dispatch = createEventDispatcher<{ range: number }>();
  let open = false;

  function labelFor(n: number) {
    if (n === 1) return "Last 24 hours";
    if (n === 7) return "Last 7 days";
    if (n === 30) return "Last 30 days";
    if (n === 90) return "Last 90 days";
    return `Last ${n} days`;
  }

  function selectDays(n: number) {
    open = false;
    dispatch("range", n); // parent listens: on:range={(e)=>onDaysChange(e.detail)}
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === "Escape") open = false;
  }
</script>

<div class="rounded-xl bg-white px-6 pt-4 pb-2">
  <div class="flex items-center justify-between">
    <span class="text-sm text-gray-400 font-medium">{title}</span>
    <div class="flex items-center gap-2">
      <button
    type="button"
    class="p-0 text-xs text-gray-400 hover:text-gray-700 focus:ring-0 inline-flex items-center"
    on:click={() => (open = !open)}
    aria-haspopup="listbox"
    aria-expanded={open}
  >
    {labelFor(currentDays)}
    <ChevronDown class="inline ml-1 w-4 h-4" />
  </button>
      {#if open}
    <div
      class="absolute right-0 z-30 mt-2 w-44 rounded-md border border-gray-200 bg-white shadow-md overflow-hidden"
      role="listbox"
      tabindex="-1"
    >
      <button class="w-full px-3 py-2 text-left text-sm hover:bg-gray-50" on:click={() => selectDays(1)}>
        Last 24 hours
      </button>
      <button class="w-full px-3 py-2 text-left text-sm hover:bg-gray-50" on:click={() => selectDays(7)}>
        Last 7 days
      </button>
      <button class="w-full px-3 py-2 text-left text-sm hover:bg-gray-50" on:click={() => selectDays(30)}>
        Last 30 days
      </button>
      <button class="w-full px-3 py-2 text-left text-sm hover:bg-gray-50" on:click={() => selectDays(90)}>
        Last 90 days
      </button>
    </div>
    <!-- click-away close -->
    <div class="fixed inset-0 z-20" on:click={() => (open = false)} />
  {/if}
      <a href="/" class="uppercase ml-2 font-semibold text-xs text-gray-800 hover:text-blue-700 flex items-center gap-1">
        Users Report <ChevronRight class="w-4 h-4" />
      </a>
    </div>
  </div>
  <div class="flex items-center gap-2 mt-4">
  {#if deltaPct !== null}
    {#if deltaPct >= 0}
      <span class="text-green-600 font-bold text-base">
        {deltaPct.toFixed(0)}% <ChevronRight class="inline w-4 h-4" />
      </span>
    {:else}
      <span class="text-red-600 font-bold text-base">
        {Math.abs(deltaPct).toFixed(0)}% <ChevronRight class="inline w-4 h-4 rotate-180" />
      </span>
    {/if}
  {:else}
    <span class="text-gray-400 text-sm">—</span>
  {/if}
</div>

  <div class="w-full mt-1 mb-2">
    {#if browser}
        <FlowbiteChart options={{...options, stroke: {...options.stroke, curve: 'smooth' as const}}} />
    {/if}
  </div>
</div>
