<script lang="ts">
  // inside +page.svelte (script)
const PROJECT_ID = 'scalable-web-solutions';
const ACTIVE_EXPERIMENTS = [
  { id: 'hero_banner',       variants: ['control', 'big'] },
  { id: 'contact_block_v1',  variants: ['control', 'alt'] }
];

let buttonId = 'contact_email_click';
let goal = 'lead_submit';
let useDay = true;
let day = new Date().toISOString().slice(0,10);
let startMs = Date.now() - 7*24*3600*1000;
let endMs = Date.now();

let loading = false;
let results: any[] = [];

async function run() {
  loading = true;
  const range = useDay ? { day } : { startMs, endMs };
  const res = await fetch('/api/experiments', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      projectId: PROJECT_ID,
      experiments: ACTIVE_EXPERIMENTS,
      buttonId, goal, range
    })
  });
  const json = await res.json();
  results = json.results || [];
  loading = false;
}

</script>

<style>
  .card { background:#fff; border-radius:16px; box-shadow:0 8px 24px rgba(0,0,0,.06); padding:16px; }
  .pill { padding:2px 8px; border-radius:999px; background:#f3f4f6; font-size:12px; }
  table { width:100%; border-collapse:separate; border-spacing:0 6px; }
  th, td { padding:8px 10px; text-align:left; }
  th { font-weight:600; opacity:.8; }
</style>

<div class="grid gap-4">
  <!-- Filters -->
  <div class="card">
    <h2 class="text-xl font-semibold mb-3">Active Experiments</h2>
    <div class="grid md:grid-cols-3 gap-3">
      <div>
        <label class="block text-sm opacity-70">CTA button_id</label>
        <input class="border rounded px-2 py-1 w-full" bind:value={buttonId} placeholder="contact_email_click" />
      </div>
      <div>
        <label class="block text-sm opacity-70">Conversion goal</label>
        <input class="border rounded px-2 py-1 w-full" bind:value={goal} placeholder="lead_submit" />
      </div>
      <div class="flex items-end gap-2">
        <label class="text-sm opacity-70 flex items-center gap-2">
          <input type="checkbox" bind:checked={useDay} /> Use single day
        </label>
      </div>
      {#if useDay}
        <div>
          <label class="block text-sm opacity-70">Day (YYYY-MM-DD)</label>
          <input class="border rounded px-2 py-1 w-full" bind:value={day} />
        </div>
      {:else}
        <div>
          <label class="block text-sm opacity-70">Start (ms)</label>
          <input type="number" class="border rounded px-2 py-1 w-full" bind:value={startMs} />
        </div>
        <div>
          <label class="block text-sm opacity-70">End (ms)</label>
          <input type="number" class="border rounded px-2 py-1 w-full" bind:value={endMs} />
        </div>
      {/if}
    </div>
    <button class="mt-3 bg-black text-white rounded px-4 py-2" on:click={run} disabled={loading}>
      {loading ? 'Loading…' : 'Run'}
    </button>
  </div>

  <!-- Results -->
  {#each results as r}
    <div class="card">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">{r.expId}</h3>
        <div class="flex gap-2 text-sm">
          <span class="pill">Exposures: {r.totals.exp}</span>
          <span class="pill">Clicks: {r.totals.clicks}</span>
          <span class="pill">Conversions: {r.totals.conv}</span>
        </div>
      </div>

      <table class="mt-3">
        <thead>
          <tr>
            <th>Variant</th>
            <th>Exposures</th>
            <th>Clicks</th>
            <th>CTR</th>
            <th>Conversions</th>
            <th>CVR</th>
          </tr>
        </thead>
        <tbody>
          {#each r.rows as row}
            <tr>
              <td>
                <span class="pill">{row.variant}</span>
                {#if r.winner === row.variant}
                  <span class="pill" style="background:#e6f7ee">winner</span>
                {/if}
              </td>
              <td>{row.exp}</td>
              <td>{row.clicks}</td>
              <td>{(row.ctr * 100).toFixed(2)}%</td>
              <td>{row.conv}</td>
              <td>{(row.cvr * 100).toFixed(2)}%</td>
            </tr>
          {/each}
        </tbody>
      </table>

      {#if r.lift != null && r.p != null}
        <div class="mt-2 text-sm">
          Lift vs control: <b>{(r.lift * 100).toFixed(2)}%</b>
          &nbsp;•&nbsp; p-value: <b>{r.p.toFixed(4)}</b>
          {#if r.p < 0.05} <span class="pill" style="background:#e6f7ee">≈ 95%+</span>{/if}
        </div>
      {/if}
    </div>
  {/each}
</div>
