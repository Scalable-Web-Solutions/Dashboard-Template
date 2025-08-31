<script lang="ts">
  import TimeSelector from '../../components/TimeSelector.svelte';
  import { authReady, user } from '$lib/stores/auth';

  import { onDestroy } from 'svelte';
  import {
    collection, onSnapshot, query,
    doc, updateDoc, increment
  } from 'firebase/firestore';
  import { db } from '$lib/firebase';

  export const ssr = false; // client-only since we use Firestore client SDK

  let loading = true;

  /*
    ID
    Sales Script Name
    Opening phase
    Call phase
    Closed deal phase
  */

  type SalesRow = {
    id: string;
    name: string;
    one: number;
    two: number;
    three: number; 
  };

  let salesScripts: SalesRow[] = [];
  let unsub: null | (() => void) = null;

  // selection state
  let selectedPrimaryId: string | null = null;
  let selectedCompareId: string | null = null;

  const phaseLabels = {
    one: 'Opening',
    two: 'Scheduled Call',
    three: 'Closed Deal'
  } as const;

  function toTitleCase(s: string) {
    return s.replace(/[-_]/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
  }

  async function loadData() {

    if (unsub) return;
    try {
      loading = true;
      const q = query(collection(db, 'sales'));
      unsub = onSnapshot(
        q,
        (snap) => {
          const rows = snap.docs.map((d) => {
            const data: any = d.data();
            return {
              id: d.id,
              name: toTitleCase(d.id) || 'Untitled Script',
              one: Number(data.one ?? 0),
              two: Number(data.two ?? 0),
              three: Number(data.three ?? 0)
            } as SalesRow;
          });

          // stable sort by name
          rows.sort((a, b) => a.name.localeCompare(b.name));

          salesScripts = rows;

          // initialize selected ids if empty
          if (!selectedPrimaryId && rows.length) selectedPrimaryId = rows[0].id;
          if (!selectedCompareId && rows.length > 1) selectedCompareId = rows[1].id;

          loading = false;
        },
        (err) => {
          console.error('sales onSnapshot error', err);
          loading = false;
        }
      );
    } catch (e) {
      console.error('loadData(sales) failed', e);
      loading = false;
    }
  }

  // run when auth is ready
  $: if ($authReady && $user && loading) loadData().catch(console.error);

  onDestroy(() => { if (unsub) { unsub(); unsub = null; } });

  // derived selections
  $: primary = salesScripts.find(s => s.id === selectedPrimaryId) ?? null;
  $: compare = salesScripts.find(s => s.id === selectedCompareId) ?? null;

  // update form
  let saving = false;
  async function handleSubmit(ev: SubmitEvent) {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget as HTMLFormElement);
    const scriptId = String(fd.get('salesScript') || '');
    const phaseKey = String(fd.get('phase') || ''); // 'one' | 'two' | 'three'
    if (!scriptId || !phaseKey) return;

    try {
      saving = true;
      await updateDoc(doc(db, 'sales', scriptId), { [phaseKey]: increment(1) });
    } catch (e) {
      console.error('update failed', e);
    } finally {
      saving = false;
    }
  }
</script>

{#if loading}
  <div class="flex items-center justify-center py-12">Loading...</div>
{:else}
  <div class="p-6 w-full">
    <div class="mb-6">
      <TimeSelector />
    </div>

    <!-- Selectors -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 w-full">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Select Sales Script to Track</h3>
        <div class="space-y-3">
          {#each salesScripts as script}
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-800">{script.name}</span>
              <button
                class="text-sm font-medium text-blue-600"
                aria-pressed={selectedPrimaryId === script.id}
                on:click={() => selectedPrimaryId = script.id}
              >
                {selectedPrimaryId === script.id ? 'Selected' : 'Select'}
              </button>
            </div>
          {/each}
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 w-full">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Select Sales Script to Compare</h3>
        <div class="space-y-3">
          {#each salesScripts as script}
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-800">{script.name}</span>
              <button
                class="text-sm font-medium text-blue-600"
                aria-pressed={selectedCompareId === script.id}
                on:click={() => selectedCompareId = script.id}
              >
                {selectedCompareId === script.id ? 'Selected' : 'Select'}
              </button>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Stats (no charts) -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 w-full">
        <h2 class="text-lg font-semibold mb-4">
          {#if primary}Showing Performance for {primary.name}{:else}Select a script{/if}
        </h2>
        {#if primary}
          <div class="grid grid-cols-3 gap-4">
            <div class="rounded-lg border border-gray-200 p-4">
              <div class="text-xs text-gray-500">{phaseLabels.one}</div>
              <div class="text-2xl font-semibold">{primary.one}</div>
            </div>
            <div class="rounded-lg border border-gray-200 p-4">
              <div class="text-xs text-gray-500">{phaseLabels.two}</div>
              <div class="text-2xl font-semibold">{primary.two}</div>
            </div>
            <div class="rounded-lg border border-gray-200 p-4">
              <div class="text-xs text-gray-500">{phaseLabels.three}</div>
              <div class="text-2xl font-semibold">{primary.three}</div>
            </div>
          </div>
        {/if}
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 w-full">
        <h2 class="text-lg font-semibold mb-4">
          {#if compare}Showing Performance for {compare.name}{:else}Select a script{/if}
        </h2>
        {#if compare}
          <div class="grid grid-cols-3 gap-4">
            <div class="rounded-lg border border-gray-200 p-4">
              <div class="text-xs text-gray-500">{phaseLabels.one}</div>
              <div class="text-2xl font-semibold">{compare.one}</div>
            </div>
            <div class="rounded-lg border border-gray-200 p-4">
              <div class="text-xs text-gray-500">{phaseLabels.two}</div>
              <div class="text-2xl font-semibold">{compare.two}</div>
            </div>
            <div class="rounded-lg border border-gray-200 p-4">
              <div class="text-xs text-gray-500">{phaseLabels.three}</div>
              <div class="text-2xl font-semibold">{compare.three}</div>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Update Data -->
    <div class="grid grid-cols-1 gap-6 mb-8">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 w-full">
        <h2 class="text-lg font-semibold mb-4">Update Data</h2>
        <form on:submit|preventDefault={handleSubmit} class="space-y-4">
          <div>
            <label for="salesScript" class="block text-sm font-medium text-gray-700">Sales Script</label>
            <select id="salesScript" name="salesScript" class="mt-1 block w-full p-2 border border-gray-300 rounded-md" required>
              {#each salesScripts as s}
                <option value={s.id}>{s.name}</option>
              {/each}
            </select>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="date" class="block text-sm font-medium text-gray-700">Date</label>
              <input type="date" id="date" name="date" class="mt-1 block w-full p-2 border border-gray-300 rounded-md">
            </div>
            <div>
              <label for="time" class="block text-sm font-medium text-gray-700">Time</label>
              <input type="time" id="time" name="time" class="mt-1 block w-full p-2 border border-gray-300 rounded-md">
            </div>
          </div>

          <div>
            <label for="phase" class="block text-sm font-medium text-gray-700">Furthest Phase</label>
            <select id="phase" name="phase" class="mt-1 block w-full p-2 border border-gray-300 rounded-md" required>
              <option value="one">{phaseLabels.one}</option>
              <option value="two">{phaseLabels.two}</option>
              <option value="three">{phaseLabels.three}</option>
            </select>
          </div>

          <div class="flex items-center gap-3">
            <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-50" disabled={saving}>
              {saving ? 'Updating…' : 'Update'}
            </button>
            <input type="reset" value="Reset" class="bg-gray-200 text-gray-800 px-4 py-2 rounded-md" />
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}
