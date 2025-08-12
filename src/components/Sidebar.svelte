<script lang="ts">
  import { BarChart3, Users, TrendingUp, Target, Globe, Settings } from 'lucide-svelte';

  const navigation = [
    { name: 'Overview', icon: BarChart3, current: false },
    { name: 'Users', icon: Users, current: false },
    { name: 'CRM', icon: TrendingUp, current: false },
  ];

</script>

<div class="bg-[#421a9b] w-64 min-h-screen text-white">
  <nav class="mt-8 px-4 flex flex-col">
    <div class="flex items-center justify-between">
      <a href="/" class="flex items-center">
        <img src="/logo.svg" alt="logo" class="h-8 mr-2" />
        <span class="text-2xl font-bold">Dashboard</span>
      </a>
    </div>

    <ul class="space-y-2">
      {#each navigation as item}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <li on:click={() => {
          for (let i of navigation) i.current = false;
          item.current = true;
        }}>



          <a
            href={item.name.toLocaleLowerCase() === 'overview' ? '/' : item.name.toLocaleLowerCase()}

            class={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
              ${item.current
                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                : 'text-white'
              }`}
          >
            <svelte:component
              this={item.icon}
              class={`mr-3 h-5 w-5 ${
                item.current
                  ? 'text-blue-500'
                  : 'text-gray-400 group-hover:text-gray-500'
              }`}
            />
            {item.name}
          </a>
        </li>
      {/each}
    </ul>
  </nav>
</div>
