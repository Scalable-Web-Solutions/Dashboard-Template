<script lang="ts">
  export const ssr = false;

  import { onMount } from 'svelte';
  import Modal from './modal/Popup.svelte';

  // Firestore (reads only)
  import { db, app } from '$lib/firebase';
  import { collection, onSnapshot, query, limit } from 'firebase/firestore';
  import { getAuth, onAuthStateChanged } from 'firebase/auth';

  // ✅ Cloud Functions via callables (no CORS issues)
  import { getFunctions, httpsCallable /*, connectFunctionsEmulator */ } from 'firebase/functions';
  const fns = getFunctions(app, 'us-central1');
  // Uncomment for local emulator:
  // connectFunctionsEmulator(fns, 'localhost', 5001);

  const fnUpdateLead = httpsCallable(fns, 'updateLead');
  const fnCreateLead = httpsCallable(fns, 'createLeadAdmin');
  const fnSoftDelete = httpsCallable(fns, 'softDeleteLead');

  // ---------- Constants / options ----------
  const PRIORITIES = ['First Class','High','Medium','Low'];
  const SIZES = ['1-10','11-50','51-100','100-500','500+'];
  const INDUSTRIES = ['Ecommerce - Retail','SaaS','Services','Other'];
  const CONTACT_METHODS = ['Email','Phone','SMS','WhatsApp'];
  const SUB_TYPES = ['Free Trial','Active','Churned'];
  const PHASES = ['Opening','Scheduled Call','Closed Deal'];
  const STATUSES = ['Active','Paused','Lost'];

  // ---------- State ----------
  let leads: any[] = [];
  let unsub: undefined | (() => void);
  let loading = true;

  // criteria state
  let showCriteria = false;

  // details modal
  let showDetails = false;
  let active: any = null;

  // edit modal
  let showEdit = false;
  let editId: string | null = null;
  let form = {
    accountManager: 'Ian Bacon',
    leadValue: '',
    priority: 'First Class',
    companySize: '100-500',
    industry: 'Ecommerce - Retail',
    contactMethod: 'Email',
    subscriptionType: 'Free Trial',
    currentPhase: 'Opening',
    status: 'Active',
    website: '',
    notes: ''
  };

  // create modal
  let showCreate = false;
  let create = {
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    accountManager: 'Ian Bacon',
    priority: 'First Class',
    currentPhase: 'Opening'
  };

  // filters
  let q = '';
  let fPriority = 'All';
  let fPhase = 'All';
  let fStatus = 'All';

  const CORE_FIELDS = new Set(['companyName','contactName','email','phone','id','deletedAt']);
  const label = (k: string) => k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
  const detailPairs = (d: Record<string, any>) =>
    Object.entries(d)
      .filter(([k]) => !CORE_FIELDS.has(k))
      .sort(([a],[b]) => a.localeCompare(b));

  // ---------- Data load (read-only from client) ----------
  onMount(() => {
    const auth = getAuth();
    const stop = onAuthStateChanged(auth, (user) => {
      if (!user) {
        if (unsub) { unsub(); unsub = undefined; }
        leads = []; loading = false;
        return;
      }
      if (unsub) { unsub(); unsub = undefined; }
      loading = true;

      const col = collection(db, 'onboardingData');
      const qy = query(col, limit(500));
      unsub = onSnapshot(qy, (snap) => {
        leads = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((x: any) => !x.deletedAt);
        loading = false;
      }, (err) => {
        console.error('onSnapshot error', err);
        loading = false;
      });
    });
    return () => { if (unsub) unsub(); stop(); };
  });

  function openDetails(row: any) { active = row; showDetails = true; }

  // ---------- Edit / Save via callable (no CORS) ----------
  function openEdit(row: any) {
    editId = row.id;
    form = {
      accountManager: row.accountManager ?? 'Ian Bacon',
      leadValue: row.leadValue ?? '',
      priority: row.priority ?? 'First Class',
      companySize: row.companySize ?? '100-500',
      industry: row.industry ?? 'Ecommerce - Retail',
      contactMethod: row.contactMethod ?? 'Email',
      subscriptionType: row.subscriptionType ?? 'Free Trial',
      currentPhase: row.currentPhase ?? 'Opening',
      status: row.status ?? 'Active',
      website: row.website ?? '',
      notes: row.notes ?? ''
    };
    showEdit = true;
  }

  let saving = false;
  async function saveEdit() {
    if (!editId) return;
    saving = true;
    try {
      const leadValueNum =
        String(form.leadValue).trim() === '' ? null : Number(form.leadValue);

      const patch: any = {
        accountManager: form.accountManager,
        priority: form.priority,
        companySize: form.companySize,
        industry: form.industry,
        contactMethod: form.contactMethod,
        subscriptionType: form.subscriptionType,
        currentPhase: form.currentPhase,
        status: form.status,
        website: form.website,
        notes: form.notes
      };
      if (leadValueNum !== null && !Number.isNaN(leadValueNum)) {
        patch.leadValue = leadValueNum;
      }

      await fnUpdateLead({ id: editId, patch });
      showEdit = false; // onSnapshot will refresh the row
    } catch (e) {
      console.error('saveEdit failed', e);
      alert('Save failed. Check console.');
    } finally {
      saving = false;
    }
  }

  // ---------- Create via callable (no CORS) ----------
  let creating = false;
  async function createLead() {
    creating = true;
    try {
      if (!create.companyName || !create.contactName || !create.email) {
        alert('Company, contact name, and email are required.');
        creating = false;
        return;
      }
      await fnCreateLead({
        companyName: create.companyName,
        contactName: create.contactName,
        email: create.email,
        phone: create.phone,
        accountManager: create.accountManager,
        priority: create.priority,
        currentPhase: create.currentPhase
      });
      // reset + close; onSnapshot will include the new doc
      create = {
        companyName: '',
        contactName: '',
        email: '',
        phone: '',
        accountManager: 'Ian Bacon',
        priority: 'First Class',
        currentPhase: 'Opening'
      };
      showCreate = false;
    } catch (e) {
      console.error('createLead failed', e);
      alert('Create failed. Check console.');
    } finally {
      creating = false;
    }
  }

  // ---------- Delete (soft) via callable (no CORS) ----------
  async function softDelete(id: string) {
    if (!confirm('Delete this lead? You can recover by clearing deletedAt in Firestore.')) return;
    try {
      await fnSoftDelete({ id });
      // onSnapshot will drop the row
    } catch (e) {
      console.error('delete failed', e);
      alert('Delete failed. Check console.');
    }
  }

  // ---------- Derived: filtered rows ----------
  $: filtered = leads.filter((r) => {
    if (q) {
      const hay = `${r.companyName ?? ''} ${r.contactName ?? ''} ${r.email ?? ''}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    if (fPriority !== 'All' && r.priority !== fPriority) return false;
    if (fPhase !== 'All' && r.currentPhase !== fPhase) return false;
    if (fStatus !== 'All' && r.status !== fStatus) return false;
    return true;
  });
</script>


<div class="p-6 space-y-6 w-full">
  <div class="flex flex-wrap items-center gap-3">
    <button on:click={() => showCriteria = !showCriteria} class="px-4 py-2 rounded bg-purple-600 text-white">Show Criteria</button>

    <!-- filters -->
    <input class="px-3 py-2 rounded border" placeholder="Search name/email…" bind:value={q} />
    <select class="px-3 py-2 rounded border" bind:value={fPriority}>
      <option>All</option>{#each PRIORITIES as p}<option>{p}</option>{/each}
    </select>
    <select class="px-3 py-2 rounded border" bind:value={fPhase}>
      <option>All</option>{#each PHASES as p}<option>{p}</option>{/each}
    </select>
    <select class="px-3 py-2 rounded border" bind:value={fStatus}>
      <option>All</option>{#each STATUSES as s}<option>{s}</option>{/each}
    </select>

    <button class="ml-auto px-4 py-2 rounded bg-emerald-600 text-white" on:click={() => (showCreate = true)}>
      New Lead
    </button>
  </div>

  {#if showCriteria}
    <div class="mt-2 rounded border bg-white p-4">
      <h3 class="text-xl mb-2">Qualification Criteria</h3>
      <p>Company Revenue: $1,000,000 - $3,000,000</p>
      <p>Company Industry: Ecommerce</p>
      <p>Company Location: United States</p>
    </div>
  {/if}

  <div class="overflow-auto shadow-md rounded-xl bg-gray-50">
    <table class="min-w-full text-sm">
      <thead class="bg-gray-50">
        <tr>
          <th class="p-3 text-left">Account Manager</th>
          <th class="p-3 text-left">Business Name</th>
          <th class="p-3 text-left">Lead Value</th>
          <th class="p-3 text-left">Priority</th>
          <th class="p-3 text-left">Company Size</th>
          <th class="p-3 text-left">Industry</th>
          <th class="p-3 text-left">Contact Method</th>
          <th class="p-3 text-left">Contact</th>
          <th class="p-3 text-left">Email</th>
          <th class="p-3 text-left">Phone</th>
          <th class="p-3 text-left">Subscription Type</th>
          <th class="p-3 text-left">Current Phase</th>
          <th class="p-3 text-left">Status</th>
          <th class="p-3 text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        {#if loading}
          <tr><td colspan="14" class="p-6 text-center text-gray-500">Loading…</td></tr>
        {:else if filtered.length === 0}
          <tr><td colspan="14" class="p-6 text-center text-gray-500">No results</td></tr>
        {:else}
          {#each filtered as it}
            <tr class="border-t hover:bg-gray-50">
              <td class="p-3">{it.accountManager ?? '—'}</td>
              <td class="p-3">{it.companyName}</td>
              <td class="p-3">{typeof it.leadValue === 'number' ? `$${it.leadValue.toLocaleString()}` : '—'}</td>
              <td class="p-3">{it.priority ?? '—'}</td>
              <td class="p-3">{it.companySize ?? '—'}</td>
              <td class="p-3">{it.industry ?? '—'}</td>
              <td class="p-3">{it.contactMethod ?? '—'}</td>
              <td class="p-3">{it.contactName}</td>
              <td class="p-3"><a class="text-blue-600" href={'mailto:' + it.email}>{it.email}</a></td>
              <td class="p-3"><a class="text-blue-600" href={'tel:' + it.phone}>{it.phone}</a></td>
              <td class="p-3">{it.subscriptionType ?? '—'}</td>
              <td class="p-3">{it.currentPhase ?? '—'}</td>
              <td class="p-3">{it.status ?? '—'}</td>
              <td class="p-3 text-right flex gap-3">
                <button class="px-3 py-1 rounded bg-blue-500 text-white" on:click={() => openDetails(it)}>Details</button>
                <button class="px-3 py-1 rounded bg-emerald-600 text-white" on:click={() => openEdit(it)}>Edit</button>
                <button class="px-3 py-1 rounded bg-rose-600 text-white" on:click={() => softDelete(it.id)}>Delete</button>
              </td>
            </tr>
          {/each}
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
    <div class="mb-4 grid grid-cols-2 gap-3 text-sm">
      <div><div class="text-gray-500">Contact</div><div class="font-medium">{active.contactName}</div></div>
      <div><div class="text-gray-500">Email</div><div class="font-medium">{active.email}</div></div>
      <div><div class="text-gray-500">Phone</div><div class="font-medium">{active.phone}</div></div>
      <div><div class="text-gray-500">Doc ID</div><div class="font-mono text-xs">{active.id}</div></div>
    </div>
    <hr class="my-4" />
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

<!-- Edit modal -->
<Modal open={showEdit} title="Edit Lead" onClose={() => (showEdit = false)}>
  <form class="space-y-3" on:submit|preventDefault={saveEdit}>
    <div class="grid md:grid-cols-2 gap-3">
      <div><label class="text-xs text-gray-500">Account Manager</label><input class="w-full p-2 border rounded" bind:value={form.accountManager} /></div>
      <div><label class="text-xs text-gray-500">Lead Value (USD)</label><input class="w-full p-2 border rounded" inputmode="numeric" bind:value={form.leadValue} /></div>
      <div><label class="text-xs text-gray-500">Priority</label><select class="w-full p-2 border rounded" bind:value={form.priority}>{#each PRIORITIES as p}<option>{p}</option>{/each}</select></div>
      <div><label class="text-xs text-gray-500">Company Size</label><select class="w-full p-2 border rounded" bind:value={form.companySize}>{#each SIZES as s}<option>{s}</option>{/each}</select></div>
      <div><label class="text-xs text-gray-500">Industry</label><select class="w-full p-2 border rounded" bind:value={form.industry}>{#each INDUSTRIES as s}<option>{s}</option>{/each}</select></div>
      <div><label class="text-xs text-gray-500">Contact Method</label><select class="w-full p-2 border rounded" bind:value={form.contactMethod}>{#each CONTACT_METHODS as s}<option>{s}</option>{/each}</select></div>
      <div><label class="text-xs text-gray-500">Subscription Type</label><select class="w-full p-2 border rounded" bind:value={form.subscriptionType}>{#each SUB_TYPES as s}<option>{s}</option>{/each}</select></div>
      <div><label class="text-xs text-gray-500">Current Phase</label><select class="w-full p-2 border rounded" bind:value={form.currentPhase}>{#each PHASES as s}<option>{s}</option>{/each}</select></div>
      <div><label class="text-xs text-gray-500">Status</label><select class="w-full p-2 border rounded" bind:value={form.status}>{#each STATUSES as s}<option>{s}</option>{/each}</select></div>
      <div class="md:col-span-2"><label class="text-xs text-gray-500">Website</label><input class="w-full p-2 border rounded" placeholder="https://example.com" bind:value={form.website} /></div>
      <div class="md:col-span-2"><label class="text-xs text-gray-500">Notes</label><textarea class="w-full p-2 border rounded" rows="3" bind:value={form.notes}></textarea></div>
    </div>
    <div class="flex items-center gap-3 pt-2">
      <button class="bg-emerald-600 text-white px-4 py-2 rounded disabled:opacity-50" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      <button type="button" class="bg-gray-200 px-4 py-2 rounded" on:click={() => (showEdit = false)}>Cancel</button>
    </div>
  </form>
</Modal>

<!-- Create modal -->
<Modal open={showCreate} title="New Lead" onClose={() => (showCreate = false)}>
  <form class="space-y-3" on:submit|preventDefault={createLead}>
    <div class="grid md:grid-cols-2 gap-3">
      <div><label class="text-xs text-gray-500">Business Name</label><input class="w-full p-2 border rounded" bind:value={create.companyName} required /></div>
      <div><label class="text-xs text-gray-500">Contact Name</label><input class="w-full p-2 border rounded" bind:value={create.contactName} required /></div>
      <div><label class="text-xs text-gray-500">Email</label><input type="email" class="w-full p-2 border rounded" bind:value={create.email} required /></div>
      <div><label class="text-xs text-gray-500">Phone</label><input class="w-full p-2 border rounded" bind:value={create.phone} /></div>
      <div><label class="text-xs text-gray-500">Account Manager</label><input class="w-full p-2 border rounded" bind:value={create.accountManager} /></div>
      <div><label class="text-xs text-gray-500">Priority</label><select class="w-full p-2 border rounded" bind:value={create.priority}>{#each PRIORITIES as p}<option>{p}</option>{/each}</select></div>
      <div class="md:col-span-2"><label class="text-xs text-gray-500">Current Phase</label><select class="w-full p-2 border rounded" bind:value={create.currentPhase}>{#each PHASES as p}<option>{p}</option>{/each}</select></div>
    </div>
    <div class="flex items-center gap-3 pt-2">
      <button class="bg-emerald-600 text-white px-4 py-2 rounded disabled:opacity-50" disabled={creating}>{creating ? 'Creating…' : 'Create'}</button>
      <button type="button" class="bg-gray-200 px-4 py-2 rounded" on:click={() => (showCreate = false)}>Cancel</button>
    </div>
  </form>
</Modal>
