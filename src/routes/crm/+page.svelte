<script lang="ts">
  export const ssr = false;

  import { onMount } from 'svelte';
  import { db } from '$lib/firebase';
  import { collection, onSnapshot, query, limit } from 'firebase/firestore';
  import { getAuth, onAuthStateChanged } from 'firebase/auth';
  import Modal from './modal/Popup.svelte';

  let leads: any[] = [];
  let unsub: undefined | (() => void);

  // modal state
  let showDetails = false;
  let active: any = null;

  const CORE_FIELDS = new Set([
    'companyName','contactName','email','phone','id'
  ]);

  // pretty labels
  const label = (k: string) =>
    k
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (c) => c.toUpperCase());

  // returns [ [key, value], ... ] for all questionnaire fields
  const detailPairs = (d: Record<string, any>) =>
    Object.entries(d)
      .filter(([k]) => !CORE_FIELDS.has(k))
      .sort(([a], [b]) => a.localeCompare(b));

  onMount(() => {
    const auth = getAuth();
    const stop = onAuthStateChanged(auth, (user) => {
      if (!user) {
        if (unsub) { unsub(); unsub = undefined; }
        leads = [];
        return;
      }
      if (unsub) { unsub(); unsub = undefined; }

      const col = collection(db, 'onboardingData');
      const qy = query(col, limit(200));
      unsub = onSnapshot(qy, (snap) => {
        leads = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      });
    });
    return () => { if (unsub) unsub(); stop(); };
  });

  function openDetails(row: any) {
    active = row;
    showDetails = true;
  }
</script>

<div class="p-6 space-y-6 w-full">
  <div class="overflow-auto shadow-md rounded-xlbg-gray-50">
    <table class="min-w-full text-sm">
      <thead class="bg-gray-50">
        <tr>
          <th class="p-3 text-left">Company</th>
          <th class="p-3 text-left">Contact</th>
          <th class="p-3 text-left">Email</th>
          <th class="p-3 text-left">Phone</th>
          <th class="p-3 text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each leads as it}
          <tr class="border-t hover:bg-gray-50">
            <td class="p-3">{it.companyName}</td>
            <td class="p-3">{it.contactName}</td>
            <td class="p-3">{it.email}</td>
            <td class="p-3">{it.phone}</td>
            <td class="p-3 text-right">
              <button
                class="px-3 py-1 rounded bg-blue-500 text-white"
                on:click={() => openDetails(it)}
              >
                Details
              </button>
            </td>
          </tr>
        {/each}
        {#if leads.length === 0}
          <tr><td class="p-6 text-center text-gray-500" colspan="5">No results</td></tr>
        {/if}
      </tbody>
    </table>
  </div>
</div>

<!-- Details modal -->
<Modal
  open={showDetails}
  title={active ? active.companyName ?? 'Details' : 'Details'}
  onClose={() => (showDetails = false)}
>
  {#if active}
    <!-- Core summary -->
    <div class="mb-4 grid grid-cols-2 gap-3 text-sm">
      <div><div class="text-gray-500">Contact</div><div class="font-medium">{active.contactName}</div></div>
      <div><div class="text-gray-500">Email</div><div class="font-medium">{active.email}</div></div>
      <div><div class="text-gray-500">Phone</div><div class="font-medium">{active.phone}</div></div>
      <div><div class="text-gray-500">Doc ID</div><div class="font-mono text-xs">{active.id}</div></div>
    </div>

    <hr class="my-4" />

    <!-- All questionnaire fields -->
    <div class="grid md:grid-cols-2 gap-4">
      {#each detailPairs(active) as [k, v]}
        <div class="bg-gray-50 shadow-md rounded-lg p-3">
          <div class="text-xs uppercase tracking-wide text-gray-500 mb-1">{label(k)}</div>
          <div class="whitespace-pre-wrap">{v}</div>
        </div>
      {/each}
    </div>
  {/if}
</Modal>
