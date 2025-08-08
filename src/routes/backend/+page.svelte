<script lang="ts">
  export const ssr = false;

  import { db } from '$lib/firebase';
  import { getAuth } from 'firebase/auth';
  import {
    collection, doc, getDocs, limit, orderBy, query, startAfter,
    updateDoc, Timestamp, writeBatch
  } from 'firebase/firestore';

  let running = false;
  let log: string[] = [];
  let pid = ''; // projectId input value

  function append(msg: string) {
    log = [...log, msg];
  }

  async function runBackfill() {
    if (running) return;
    running = true;
    log = [];

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        append('❌ Sign in first.');
        running = false;
        return;
      }

      if (!pid) {
        append('❌ Please enter a projectId.');
        running = false;
        return;
      }

      append(`🔄 Backfilling clients/${pid}/events ...`);

      const col = collection(db, `clients/${pid}/events`);
      const pageSize = 400;
      let last: any = null;
      let scanned = 0;
      let converted = 0;

      while (true) {
        let qy = query(col, orderBy('__name__'), limit(pageSize));
        if (last) qy = query(col, orderBy('__name__'), startAfter(last), limit(pageSize));
        const snap = await getDocs(qy);
        if (snap.empty) break;

        const batch = writeBatch(db);

        snap.docs.forEach(d => {
          scanned++;
          const data: any = d.data();
          const t = data?.timestamp;
          if (typeof t === 'number' && Number.isFinite(t) && t > 0) {
            converted++;
            batch.update(doc(db, `clients/${pid}/events/${d.id}`), {
              timestamp: Timestamp.fromMillis(t)
            });
          }
        });

        if (converted) await batch.commit();
        last = snap.docs.at(-1);
        append(`📄 Processed ${scanned} | converted so far: ${converted}`);

        if (snap.size < pageSize) break;
      }

      append(`✅ Done. Scanned: ${scanned}, Converted: ${converted}`);
    } catch (e: any) {
      append(`❌ Error: ${e?.message || e}`);
    } finally {
      running = false;
    }
  }
</script>

<div class="p-6 space-y-3">
  <div class="flex gap-2">
    <input
      id="pid"
      class="border rounded px-3 py-2"
      placeholder="projectId (e.g. opensoul)"
      bind:value={pid}
    />
    <button
      class="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
      disabled={running}
      on:click={runBackfill}
    >
      {running ? 'Running…' : 'Run Backfill'}
    </button>
  </div>

  <pre class="text-xs bg-gray-100 p-3 rounded h-64 overflow-auto">
    {log.join('\n')}
  </pre>
</div>
