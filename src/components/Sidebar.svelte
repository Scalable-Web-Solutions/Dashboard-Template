<script lang="ts">
  import { BarChart3, Users, TrendingUp, Search, Settings as SettingsIcon, FileSpreadsheet, ArrowLeft, ChartBar, Users as UsersIcon, ArrowUpRightFromCircle } from 'lucide-svelte';

  type NavItem = { name: string; icon: any; href: string };
  const navigation: NavItem[] = [
    { name: 'Overview', icon: BarChart3, href: '/' },
    { name: 'Users', icon: Users, href: '/users' },
    { name: 'CRM', icon: TrendingUp, href: '/crm' },
  ];
  let current = 'Overview';

  const navigate = (href: string) => {
    current = href;
    window.location.href = href;
  };



</script>

<!-- Fixed sidebar: stays put while page scrolls -->
<aside class="fixed inset-y-0 left-0 w-64 bg-[#421a9b] text-white">
  <nav class="h-full flex flex-col px-4 py-6">
    <!-- top quick actions -->
    <div class="flex items-center justify-between px-2 pt-4">
      <Search class="h-5 w-5 opacity-90" />
      <SettingsIcon class="h-5 w-5 opacity-90" />
      <FileSpreadsheet class="h-5 w-5 opacity-90" />
    </div>

    <!-- main nav -->
    <ul class="h-full flex flex-col justify-center gap-10">
      {#each navigation as item}
        <li on:click={() => navigate(item.href)}>


          <a
            href={item.href}
            class="relative group flex items-center gap-3 rounded-xl px-3 py-2 outline-none transition
                   hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-white/60"
            aria-current={current === item.name ? 'page' : undefined}
            on:click|preventDefault={() => (current = item.name)}
          >
            <!-- active bar -->
            <span class={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r ${current === item.name ? 'bg-white' : 'bg-transparent'}`} />
            <svelte:component this={item.icon} class={`h-5 w-5 ${current === item.name ? 'text-white' : 'text-white/70 group-hover:text-white'}`} />
            <span class={`${current === item.name ? 'text-white' : 'text-white/80 group-hover:text-white'} text-sm font-medium`}>{item.name}</span>
          </a>
        </li>
      {/each}
      <button class="w-full bg-[#37188B] hover:opacity-70 flex items-center justify-center gap-2 rounded-xl px-3 py-4 outline-none transition focus-visible:ring-2 focus-visible:ring-white/60">
        <ArrowUpRightFromCircle class="h-5 w-5 opacity-90" />
        <span class="text-sm font-medium">Live Site</span>
      </button>
    </ul>

    <!-- push footer to bottom -->
    <div class="mt-auto" />

    <!-- bottom actions -->
    <div class="flex items-center justify-between px-2 pt-4">
      <ArrowLeft class="h-5 w-5 opacity-90" />
      <ChartBar class="h-5 w-5 opacity-90" />
      <UsersIcon class="h-5 w-5 opacity-90" />
    </div>
  </nav>
</aside>
