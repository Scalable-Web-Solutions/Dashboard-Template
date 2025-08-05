<script lang="ts">
  import type { ApexOptions } from "apexcharts";
  import { Chart as FlowbiteChart } from "@flowbite-svelte-plugins/chart";
  import { Button, Dropdown, DropdownItem } from "flowbite-svelte";
  import { ChevronDown, ChevronRight } from "lucide-svelte";
    import { browser } from "$app/environment";

  export let title: string;
  export let data: number[];
  export let labels: string[];
  export let type: 'line' | 'bar' | 'area' = 'area';

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
</script>

<div class="rounded-xl border border-gray-200 bg-white px-6 pt-4 pb-2 shadow-sm">
  <div class="flex items-center justify-between">
    <span class="text-sm text-gray-400 font-medium">{title}</span>
    <div class="flex items-center gap-2">
      <Button class="p-0 text-xs text-gray-400 hover:text-gray-700 focus:ring-0">
        Last 7 days <ChevronDown class="inline ml-1 w-4 h-4" />
      </Button>
      <Dropdown simple class="w-36" offset={-6}>
        <DropdownItem>Yesterday</DropdownItem>
        <DropdownItem>Today</DropdownItem>
        <DropdownItem>Last 7 days</DropdownItem>
        <DropdownItem>Last 30 days</DropdownItem>
        <DropdownItem>Last 90 days</DropdownItem>
      </Dropdown>
      <a href="/" class="uppercase ml-2 font-semibold text-xs text-gray-800 hover:text-blue-700 flex items-center gap-1">
        Users Report <ChevronRight class="w-4 h-4" />
      </a>
    </div>
  </div>
  <div class="flex items-center gap-2 mt-4">
    <span class="text-green-500 font-bold text-base">12% <ChevronRight class="inline w-4 h-4" /></span>
  </div>
  <div class="w-full mt-1 mb-2">
    {#if browser}
        <FlowbiteChart options={{...options, stroke: {...options.stroke, curve: 'smooth' as const}}} />
    {/if}
  </div>
</div>
