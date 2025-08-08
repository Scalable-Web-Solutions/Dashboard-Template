import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { auth } from '$lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as fbSignOut } from 'firebase/auth';

export const user = writable<any | null>(null);
export const authReady = writable(false);

export function waitForAuth() {
  return new Promise<void>((resolve) => {
    if (!browser || !auth) { authReady.set(true); return resolve(); }
    onAuthStateChanged(auth, (u) => {
      user.set(u);
      authReady.set(true);
      resolve();
    });
  });
}

export async function signIn(email: string, password: string) {
  if (!auth) throw new Error('Auth not available');
  return signInWithEmailAndPassword(auth, email, password);
}
export function signOut() {
  if (!auth) return;
  return fbSignOut(auth);
}
