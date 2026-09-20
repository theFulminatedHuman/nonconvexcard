'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * A `localStorage`-backed external store.
 *
 * `useSyncExternalStore` keeps every component that reads the same key in sync
 * within a tab, and the `storage` event keeps tabs in sync with each other.
 * The `getServerSnapshot` argument supplies the pre-render value so that static
 * export produces valid HTML and hydration does not mismatch.
 */
type Listener = () => void;
type Parse<T> = (raw: string | null) => T;

const listeners = new Map<string, Set<Listener>>();
const cache = new Map<string, string | null>();

function emit(key: string): void {
  for (const l of listeners.get(key) ?? []) l();
}

function readRaw(key: string): string | null {
  if (cache.has(key)) return cache.get(key) ?? null;
  let value: string | null = null;
  try {
    value = window.localStorage.getItem(key);
  } catch {
    value = null; // private mode, or storage disabled
  }
  cache.set(key, value);
  return value;
}

export function writeRaw(key: string, value: string | null): void {
  cache.set(key, value);
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Persisting failed; the in-memory cache still keeps the session consistent.
  }
  emit(key);
}

/* ------------------------------------------------------- snapshot caching */

/**
 * Parsed snapshots, memoised on the raw string they came from.
 *
 * `useSyncExternalStore` compares successive snapshots with `Object.is` and
 * re-renders whenever they differ. A `parse` that builds a fresh object each
 * call therefore reports a change on *every* render, and React re-renders
 * until it gives up with "Maximum update depth exceeded" — which unmounts the
 * whole tree. Returning the identical reference while the stored string is
 * unchanged is part of the hook's contract, not an optimisation.
 *
 * This bit: `parseState` returns the shared `EMPTY_STATE` constant for empty
 * storage but a new object once anything is stored, so the site was stable
 * until a reader's first completed item and crashed on every page after it.
 *
 * Keyed on the `parse` function first so that two stores sharing a storage key
 * but parsing it differently cannot evict each other (which would recreate the
 * loop). The outer map is weak: a `parse` closed over a component's props dies
 * with the component.
 */
const snapshots = new WeakMap<Parse<never>, Map<string, { raw: string | null; value: unknown }>>();

export function cachedParse<T>(key: string, parse: Parse<T>, raw: string | null): T {
  const fn = parse as unknown as Parse<never>;
  let byKey = snapshots.get(fn);
  if (!byKey) {
    byKey = new Map();
    snapshots.set(fn, byKey);
  }
  const hit = byKey.get(key);
  if (hit && hit.raw === raw) return hit.value as T;
  const value = parse(raw);
  byKey.set(key, { raw, value });
  return value;
}

/** Cache slot for the pre-render value, kept apart from the live one so that
 *  hydration cannot thrash the two against each other. */
const serverSlot = (key: string) => `${key}\u0000server`;

/* ---------------------------------------------------------- subscriptions */

function subscribe(key: string, listener: Listener): () => void {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(listener);

  const onStorage = (e: StorageEvent) => {
    if (e.key === key || e.key === null) {
      cache.delete(key);
      emit(key);
    }
  };
  window.addEventListener('storage', onStorage);

  return () => {
    set.delete(listener);
    // Drop the key entirely once nothing is listening, so the map tracks live
    // subscriptions rather than every key ever subscribed to.
    if (set.size === 0) listeners.delete(key);
    window.removeEventListener('storage', onStorage);
  };
}

/**
 * Reads and writes a parsed value at `key`.
 *
 * `parse` must be total: it receives whatever is in storage (possibly garbage
 * written by an older version of the site) and must return a usable value. It
 * must also be referentially stable across renders — declare it at module
 * scope or wrap it in `useCallback` — because it identifies the snapshot cache.
 */
export function useLocalStore<T>(
  key: string,
  parse: Parse<T>,
  serialize: (value: T) => string,
): [T, (updater: T | ((prev: T) => T)) => void] {
  const value = useSyncExternalStore(
    useCallback((l: Listener) => subscribe(key, l), [key]),
    useCallback(() => cachedParse(key, parse, readRaw(key)), [key, parse]),
    useCallback(() => cachedParse(serverSlot(key), parse, null), [key, parse]),
  );

  const set = useCallback(
    (updater: T | ((prev: T) => T)) => {
      const prev = cachedParse(key, parse, readRaw(key));
      const next = typeof updater === 'function' ? (updater as (p: T) => T)(prev) : updater;
      writeRaw(key, serialize(next));
    },
    [key, parse, serialize],
  );

  return [value, set];
}

// Hoisted so that `useHasMounted` passes the same three functions on every
// render; an inline `subscribe` makes React tear down and re-establish the
// subscription after each commit.
const noopSubscribe = () => () => {};
const alwaysTrue = () => true;
const alwaysFalse = () => false;

/** True once the component has mounted on the client. */
export function useHasMounted(): boolean {
  return useSyncExternalStore(noopSubscribe, alwaysTrue, alwaysFalse);
}
