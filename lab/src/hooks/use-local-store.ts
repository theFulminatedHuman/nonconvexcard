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
    window.removeEventListener('storage', onStorage);
  };
}

/**
 * Reads and writes a parsed value at `key`.
 *
 * `parse` must be total: it receives whatever is in storage (possibly garbage
 * written by an older version of the site) and must return a usable value.
 */
export function useLocalStore<T>(
  key: string,
  parse: (raw: string | null) => T,
  serialize: (value: T) => string,
): [T, (updater: T | ((prev: T) => T)) => void] {
  const value = useSyncExternalStore(
    useCallback((l: Listener) => subscribe(key, l), [key]),
    useCallback(() => parse(readRaw(key)), [key, parse]),
    useCallback(() => parse(null), [parse]),
  );

  const set = useCallback(
    (updater: T | ((prev: T) => T)) => {
      const prev = parse(readRaw(key));
      const next = typeof updater === 'function' ? (updater as (p: T) => T)(prev) : updater;
      writeRaw(key, serialize(next));
    },
    [key, parse, serialize],
  );

  return [value, set];
}

/** True once the component has mounted on the client. */
export function useHasMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
