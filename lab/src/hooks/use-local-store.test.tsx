// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';

/**
 * The store's module-level caches live for the life of the module, so each
 * test imports a fresh copy rather than sharing state with its neighbours.
 */
async function freshStore() {
  vi.resetModules();
  return import('./use-local-store');
}

async function freshProgress() {
  vi.resetModules();
  return {
    hooks: await import('./use-progress'),
    lib: await import('@/lib/progress'),
  };
}

beforeEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe('cachedParse', () => {
  it('returns the identical reference while the raw string is unchanged', async () => {
    const { cachedParse } = await freshStore();
    const parse = (raw: string | null) => ({ raw });

    const a = cachedParse('k', parse, '{}');
    const b = cachedParse('k', parse, '{}');

    // Object.is equality is what useSyncExternalStore requires; a deep-equal
    // but distinct object is exactly the bug this guards.
    expect(b).toBe(a);
  });

  it('reparses when the raw string changes', async () => {
    const { cachedParse } = await freshStore();
    const parse = (raw: string | null) => ({ raw });

    const a = cachedParse('k', parse, '1');
    const b = cachedParse('k', parse, '2');

    expect(b).not.toBe(a);
    expect(b.raw).toBe('2');
  });

  it('keeps two parsers of the same key from evicting each other', async () => {
    const { cachedParse } = await freshStore();
    const one = (raw: string | null) => ({ tag: 'one', raw });
    const two = (raw: string | null) => ({ tag: 'two', raw });

    const a1 = cachedParse('k', one, 'x');
    const b1 = cachedParse('k', two, 'x');
    const a2 = cachedParse('k', one, 'x');
    const b2 = cachedParse('k', two, 'x');

    expect(a2).toBe(a1);
    expect(b2).toBe(b1);
  });
});

describe('useLocalStore', () => {
  it('renders a stored object value without looping', async () => {
    const { useLocalStore } = await freshStore();
    // Mirrors `parseState`: a fresh object on every call. Without a cached
    // snapshot React re-renders until it throws "Maximum update depth
    // exceeded", which unmounts the tree and shows the app-error page.
    const parse = (raw: string | null) => ({ items: raw ? (JSON.parse(raw) as string[]) : [] });
    const serialize = (v: { items: string[] }) => JSON.stringify(v.items);

    window.localStorage.setItem('lab:test:objects', '["a","b"]');

    function Probe() {
      const [value] = useLocalStore('lab:test:objects', parse, serialize);
      return <p>count {value.items.length}</p>;
    }

    expect(() => render(<Probe />)).not.toThrow();
    expect(screen.getByText('count 2')).toBeTruthy();
  });

  it('still re-renders when the stored value changes', async () => {
    const { useLocalStore } = await freshStore();
    const parse = (raw: string | null) => ({ items: raw ? (JSON.parse(raw) as string[]) : [] });
    const serialize = (v: { items: string[] }) => JSON.stringify(v.items);

    let push: (() => void) | undefined;

    function Probe() {
      const [value, set] = useLocalStore('lab:test:live', parse, serialize);
      push = () => set((prev) => ({ items: [...prev.items, 'x'] }));
      return <p>count {value.items.length}</p>;
    }

    render(<Probe />);
    expect(screen.getByText('count 0')).toBeTruthy();

    act(() => push!());
    expect(screen.getByText('count 1')).toBeTruthy();

    act(() => push!());
    expect(screen.getByText('count 2')).toBeTruthy();
  });
});

describe('useProgress against stored progress', () => {
  /** The exact state the site is left in by a first accepted submission. */
  function seed() {
    window.localStorage.setItem(
      'lab:progress',
      JSON.stringify({
        version: 1,
        entries: [
          {
            key: 'problem:la-power-iteration',
            kind: 'problem',
            refId: 'la-power-iteration',
            title: 'Implement power iteration and verify the convergence rate',
            date: '2026-09-20',
            field: 'foundations',
            difficulty: 'intermediate',
            type: 'coding',
            minutes: 60,
          },
        ],
      }),
    );
  }

  it('reads a non-empty stored state without crashing', async () => {
    const { hooks } = await freshProgress();
    seed();

    function Probe() {
      const { state, isDone } = hooks.useProgress();
      return (
        <p>
          {state.entries.length} entries, solved={String(isDone('problem', 'la-power-iteration'))}
        </p>
      );
    }

    expect(() => render(<Probe />)).not.toThrow();
    expect(screen.getByText('1 entries, solved=true')).toBeTruthy();
  });

  it('records a completion and reflects it immediately', async () => {
    const { hooks } = await freshProgress();

    let solve: (() => void) | undefined;

    function Probe() {
      const { state, complete } = hooks.useProgress();
      solve = () =>
        complete({
          kind: 'problem',
          refId: 'la-power-iteration',
          title: 'Implement power iteration and verify the convergence rate',
          date: '2026-09-20',
          field: 'foundations',
          difficulty: 'intermediate',
          type: 'coding',
          minutes: 60,
        });
      return <p>{state.entries.length} entries</p>;
    }

    render(<Probe />);
    expect(screen.getByText('0 entries')).toBeTruthy();

    // This is the click that broke the site: the first write turns `parseState`
    // from the shared EMPTY_STATE constant into a fresh object per call.
    expect(() => act(() => solve!())).not.toThrow();
    expect(screen.getByText('1 entries')).toBeTruthy();
  });
});
