<script lang="ts">
  import { BarChart3, Users, TrendingUp, Target, Globe, Settings } from 'lucide-svelte';

  const navigation = [
    { name: 'Overview', icon: BarChart3, current: true },
    { name: 'Users', icon: Users, current: false },
    { name: 'CRM', icon: TrendingUp, current: false },

  ];
</script>

<div class="bg-gray-50 w-64 min-h-screen border-r border-gray-200">
  <nav class="mt-8 px-4">
    <ul class="space-y-2">
      {#each navigation as item}
        <li>
          <a
            href={item.name.toLocaleLowerCase() === 'overview' ? '/' : item.name.toLocaleLowerCase()}

            class={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
              ${item.current
                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
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
