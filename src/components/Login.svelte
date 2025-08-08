<script lang="ts">
  import { signIn } from '$lib/stores/auth';
  import { goto } from '$app/navigation';

  let email = '';
  let password = '';
  let error = '';

  async function handleLogin() {
    error = '';
    try {
      await signIn(email, password);
      goto('/dashboard');
    } catch (e: any) {
      error = e?.message ?? 'Login failed';
    }
  }
</script>

<form on:submit|preventDefault={handleLogin} class="max-w-sm mx-auto p-6">
  {#if error}<p class="text-red-400 mb-3">{error}</p>{/if}
  <input class="w-full mb-3 p-2 rounded bg-gray-900 text-white" type="email" bind:value={email} placeholder="Email" />
  <input class="w-full mb-4 p-2 rounded bg-gray-900 text-white" type="password" bind:value={password} placeholder="Password" />
  <button class="w-full py-2 rounded bg-purple-600 hover:bg-purple-700">Login</button>
</form>
