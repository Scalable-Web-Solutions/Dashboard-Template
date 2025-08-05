<script lang="ts">
  import { onMount } from "svelte";
  import MetricCard from "./MetricCard.svelte";
  import Chart from "./Chart.svelte";
  import TimeSelector from "./TimeSelector.svelte";
  import { Users, UserPlus, UserCheck, Activity } from "lucide-svelte";

  // These will be fetched from Firebase
  let userSegments = [
    { segment: 'New Users', count: 0, percentage: 0, color: 'bg-blue-500' },
    { segment: 'Returning Users', count: 0, percentage: 0, color: 'bg-green-500' }
  ];
  let topPages: any[] = [];

  let uniqueUsersData: any[] = [];
  let totalSessionsData: any[] = [];
  let labels: string[] = [];

  let totalUniqueUsers = 0;
  let totalSessions = 0;
  let newUsers = 0;
  let returningUsers = 0;
  let uniqueChange = 0;
  let sessionsChange = 0;
  let newUsersChange = 0;
  let returningChange = 0;

  let loading = true;
  let project = "";

  function waitForFirebase() {
    return new Promise<void>((resolve) => {
      if (typeof window !== "undefined" && window.firebase && window.firebase.firestore) {
        resolve();
      } else {
        setTimeout(() => resolve(waitForFirebase()), 50);
      }
    });
  }

  onMount(async () => {
    project = "scalable-web-solutions";
    await waitForFirebase();

    // Get Firestore reference
    const db = window.firebase.firestore();

    // Pull all events for this client in the last 7 days
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const eventsRef = db.collection("clients").doc(project).collection("events");
    const snap = await eventsRef.where("timestamp", ">", weekAgo).get();

    // --- Analytics Calculation Logic ---
    let usersSet = new Set();
    let sessionsSet = new Set();
    let pageMap = {};
    let newUserIds = new Set();
    let returningUserIds = new Set();

    let perDayUnique = {};
    let perDaySessions = {};

    snap.forEach(doc => {
      const data = doc.data();
      // Unique Users
      if (data.anonUserId) {
        usersSet.add(data.anonUserId);

        // New vs Returning (you can adjust this logic as needed)
        if (!newUserIds.has(data.anonUserId) && data.type === "pageview") {
          if (data.timestamp - weekAgo < 24 * 60 * 60 * 1000) {
            newUserIds.add(data.anonUserId);
          } else {
            returningUserIds.add(data.anonUserId);
          }
        }
      }

      // Sessions
      if (data.sessionId) {
        sessionsSet.add(data.sessionId);
      }

      // Pages
      if (data.url) {
        if (!pageMap[data.url]) {
          pageMap[data.url] = { uniqueUsers: new Set(), totalSessions: new Set() };
        }
        if (data.anonUserId) pageMap[data.url].uniqueUsers.add(data.anonUserId);
        if (data.sessionId) pageMap[data.url].totalSessions.add(data.sessionId);
      }

      // Per day charts
      if (data.timestamp) {
        const day = new Date(data.timestamp).toLocaleDateString(undefined, { weekday: "short" });
        perDayUnique[day] = perDayUnique[day] || new Set();
        perDaySessions[day] = perDaySessions[day] || new Set();
        if (data.anonUserId) perDayUnique[day].add(data.anonUserId);
        if (data.sessionId) perDaySessions[day].add(data.sessionId);
      }
    });

    // Top Pages
    topPages = Object.entries(pageMap)
      .map(([page, stats]) => ({
        page,
        uniqueUsers: stats.uniqueUsers.size,
        totalSessions: stats.totalSessions.size,
      }))
      .sort((a, b) => b.uniqueUsers - a.uniqueUsers)
      .slice(0, 5);

    // User Segments (very basic: counts and percentage)
    newUsers = newUserIds.size;
    returningUsers = returningUserIds.size;
    totalUniqueUsers = usersSet.size;
    totalSessions = sessionsSet.size;

    userSegments = [
      { segment: 'New Users', count: newUsers, percentage: totalUniqueUsers ? Math.round((newUsers / totalUniqueUsers) * 100) : 0, color: 'bg-blue-500' },
      { segment: 'Returning Users', count: returningUsers, percentage: totalUniqueUsers ? Math.round((returningUsers / totalUniqueUsers) * 100) : 0, color: 'bg-green-500' }
    ];

    // Charts
    // We'll use last 7 unique weekdays as X axis
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
      return d.toLocaleDateString(undefined, { weekday: "short" });
    });

    uniqueUsersData = days.map(day => (perDayUnique[day] ? perDayUnique[day].size : 0));
    totalSessionsData = days.map(day => (perDaySessions[day] ? perDaySessions[day].size : 0));
    labels = days;

    // You can also calculate % change for metrics (not shown here)
    loading = false;
  });
</script>

{#if loading}
  <div class="flex items-center justify-center py-12">Loading...</div>
{:else}
  <div class="p-6 w-full">
    <div class="mb-6">
      <TimeSelector />
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <MetricCard title="Unique Users" value={totalUniqueUsers.toLocaleString()} change="N/A" changeType="neutral" icon={Users} />
      <MetricCard title="Total Sessions" value={totalSessions.toLocaleString()} change="N/A" changeType="neutral" icon={Activity} />
      <MetricCard title="New Users" value={newUsers.toLocaleString()} change="N/A" changeType="neutral" icon={UserPlus} />
      <MetricCard title="Returning Users" value={returningUsers.toLocaleString()} change="N/A" changeType="neutral" icon={UserCheck} />
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <Chart title="Unique Users This Week" data={uniqueUsersData} labels={labels} type="line" />
      <Chart title="Total Sessions This Week" data={totalSessionsData} labels={labels} type="bar" />
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">User Segments</h3>
        <div class="space-y-4">
          {#each userSegments as segment (segment.segment)}
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class={`w-3 h-3 rounded-full ${segment.color}`}></div>
                <span class="text-sm font-medium text-gray-700">{segment.segment}</span>
              </div>
              <div class="flex items-center space-x-3">
                <span class="text-sm text-gray-500">{segment.count.toLocaleString()}</span>
                <span class="text-sm font-medium text-gray-900">{segment.percentage}%</span>
              </div>
            </div>
          {/each}
        </div>
        <div class="mt-6">
          <div class="flex rounded-lg overflow-hidden h-3">
            {#each userSegments as segment}
              <div class={segment.color} style="width: {segment.percentage}%"></div>
            {/each}
          </div>
        </div>
      </div>
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Top Pages by Users</h3>
        <div class="space-y-4">
          <div class="flex items-center justify-between text-xs font-medium text-gray-500 uppercase tracking-wider">
            <span>Page</span>
            <div class="flex space-x-8">
              <span>Unique</span>
              <span>Total</span>
            </div>
          </div>
          {#each topPages as page (page.page)}
            <div class="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div class="flex-1">
                <span class="text-sm font-medium text-gray-900">{page.page}</span>
              </div>
              <div class="flex space-x-8 text-sm">
                <span class="text-blue-600 font-medium w-16 text-right">{page.uniqueUsers.toLocaleString()}</span>
                <span class="text-gray-600 w-16 text-right">{page.totalSessions.toLocaleString()}</span>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
{/if}
