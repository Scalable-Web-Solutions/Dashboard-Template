<script lang="ts" module>
	declare global {
		interface Window {
			analytics: {
				init: (config?: any) => void;
				trackPageview?: () => void;
				trackEvent?: (type: string, fields?: object) => void;
			};
			firebase: any;
		}
	}
</script>

<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
    import { onMount } from 'svelte';
    import Header from '../components/Header.svelte';
    import Sidebar from '../components/Sidebar.svelte';
    import { authReady, user, waitForAuth } from '$lib/stores/auth';
    import Login from '../components/Login.svelte';
	import bg from "$lib/assets/dashboardbg.png"

	let { children } = $props();

	onMount(async () => {
		await waitForAuth();
		function initTracking()
		{
			if(window.analytics){
				window.analytics.init({project: 'scalable-web-solutions-dasboard'});
			}
			else{
				console.log('Analytics not initialized');
			}
		}
		initTracking();
	})
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<!-- Page shell -->
<div class="min-h-screen inter">
  <img src={bg} alt="" class="fixed top-0 left-0 h-full w-full object-cover -z-10">

  <!-- Fixed sidebar lives outside the scrolling flow -->
  <Sidebar />

  <!-- Content: offset by the sidebar width (64 = 16rem) -->
  <main class="ml-64 min-h-screen overflow-y-auto">
    {#if !$authReady}
      <div>Loading auth…</div>
    {:else if $user}
      {@render children?.()}
    {:else}
      <!-- If Login should also be centered etc., wrap as you like -->
      <div class="max-w-xl mx-auto">
        <Login />
      </div>
    {/if}
  </main>
</div>	