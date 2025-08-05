<script lang="ts">
  import { Activity, Users, MousePointer, Eye } from 'lucide-svelte';

  const activities = [
    {
      icon: Users,
      title: 'New user registration spike',
      description: '234 new users in the last hour',
      time: '5 minutes ago',
      color: 'text-blue-600 bg-blue-50',
    },
    {
      icon: MousePointer,
      title: 'High conversion rate detected',
      description: 'Checkout page showing 8.4% conversion',
      time: '15 minutes ago',
      color: 'text-green-600 bg-green-50',
    },
    {
      icon: Eye,
      title: 'Page view milestone reached',
      description: '1M page views this month',
      time: '1 hour ago',
      color: 'text-purple-600 bg-purple-50',
    },
    {
      icon: Activity,
      title: 'Traffic surge from social media',
      description: '45% increase from Twitter referrals',
      time: '2 hours ago',
      color: 'text-orange-600 bg-orange-50',
    },
  ];
</script>

<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
  <h3 class="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
  <div class="space-y-4">
    {#each activities as activity}
      <div class="flex items-start space-x-3">
        <div class={`w-8 h-8 rounded-full flex items-center justify-center ${activity.color}`}>
          <svelte:component this={activity.icon} class="w-4 h-4" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900">{activity.title}</p>
          <p class="text-sm text-gray-500">{activity.description}</p>
          <p class="text-xs text-gray-400 mt-1">{activity.time}</p>
        </div>
      </div>
    {/each}
  </div>
</div>
