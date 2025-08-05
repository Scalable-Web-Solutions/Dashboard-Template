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

	let { children } = $props();

	onMount(() => {
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


<div class="min-h-screen bg-gray-50">
  <Header />
  <div class="flex">
    <Sidebar />
    {@render children?.()}
  </div>
</div>