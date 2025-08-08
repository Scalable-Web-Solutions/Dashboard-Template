<script lang="ts">
  export let open = false;
  export let title = '';
  export let onClose: () => void = () => {};
  const handleKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
</script>

{#if open}
  <div class="fixed inset-0 z-50" on:keydown={handleKey} tabindex="0">
    <div class="absolute inset-0 bg-black/40" on:click={onClose}></div>

    <div class="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col">
      <header class="p-4 border-b flex items-center justify-between">
        <h2 class="text-lg font-semibold">{title}</h2>
        <button class="px-3 py-1 rounded border" on:click={onClose}>Close</button>
      </header>
      <div class="p-4 overflow-y-auto grow">
        <slot />
      </div>
    </div>
  </div>
{/if}
