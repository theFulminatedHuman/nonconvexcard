'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { search, type SearchDoc, type SearchHit, type SearchKind } from '@/lib/search';
import { CloseIcon, SearchIcon } from '@/components/ui/icons';
import { cx } from '@/components/ui/primitives';

const KIND_LABEL: Record<SearchKind, string> = {
  topic: 'Topic',
  claim: 'Theorem',
  problem: 'Problem',
  paper: 'Paper',
  experiment: 'Experiment',
  page: 'Page',
};

const SUGGESTIONS = [
  'strong convexity',
  'Marchenko Pastur',
  'SGD convergence',
  'Rademacher',
  'SVM dual',
  'JL lemma',
  'attention',
  'retrieval',
];

/** Fetched once per session and shared by every palette instance. */
let indexPromise: Promise<SearchDoc[]> | null = null;

function loadIndex(basePath: string): Promise<SearchDoc[]> {
  indexPromise ??= fetch(`${basePath}/search-index.json`)
    .then((r) => (r.ok ? r.json() : []))
    .then((d: unknown) => (Array.isArray(d) ? (d as SearchDoc[]) : []))
    .catch(() => []);
  return indexPromise;
}

export function CommandPalette({ basePath }: { basePath: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [docs, setDocs] = useState<SearchDoc[] | null>(null);
  const [error, setError] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Global shortcut: ⌘K / Ctrl-K, and "/" when not already typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable === true;
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === '/' && !typing && !open) {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setActive(0);
    inputRef.current?.focus();
    if (docs === null) {
      loadIndex(basePath).then((d) => {
        setDocs(d);
        setError(d.length === 0);
      });
    }
  }, [open, docs, basePath]);

  const hits = useMemo<SearchHit[]>(() => (docs ? search(docs, query, 20) : []), [docs, query]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery('');
      router.push(href);
    },
    [router],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, hits.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const hit = hits[active];
      if (hit) go(hit.href);
    }
  };

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active, hits.length]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full max-w-xs items-center gap-2 rounded border border-[var(--color-line)] bg-[var(--color-elevated)] px-2.5 py-1.5 text-left text-xs text-[var(--color-ink-faint)] transition-colors hover:border-[var(--color-line-strong)]"
      >
        <SearchIcon size={14} />
        <span className="truncate">Search theorems, problems, papers…</span>
        <kbd className="ml-auto hidden rounded border border-[var(--color-line)] px-1 font-mono text-[10px] sm:block">
          ⌘K
        </kbd>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/35 px-4 pt-[10vh] backdrop-blur-[2px]"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            className="flex max-h-[70vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-[var(--color-line-strong)] bg-[var(--color-surface)] shadow-2xl"
          >
            <div className="flex items-center gap-2 border-b border-[var(--color-line)] px-3">
              <SearchIcon size={16} className="shrink-0 text-[var(--color-ink-faint)]" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onKeyDown}
                placeholder="Search concepts, theorems, proofs, problems, papers, experiments…"
                aria-label="Search query"
                className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-[var(--color-ink-faint)]"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close search"
                className="rounded p-1 text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
              >
                <CloseIcon size={16} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {docs === null ? (
                <p className="px-4 py-8 text-center text-sm text-[var(--color-ink-faint)]">
                  Loading index…
                </p>
              ) : error ? (
                <p className="px-4 py-8 text-center text-sm text-[var(--color-ink-faint)]">
                  The search index could not be loaded. Browsing still works from the sidebar.
                </p>
              ) : query.trim() === '' ? (
                <div className="px-4 py-5">
                  <p className="mono-label mb-2">Try</p>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setQuery(s)}
                        className="rounded border border-[var(--color-line)] px-2 py-1 text-xs text-[var(--color-ink-soft)] hover:border-[var(--color-line-strong)] hover:text-[var(--color-ink)]"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <p className="mt-4 text-xs text-[var(--color-ink-faint)]">
                    {docs.length} indexed items · ↑↓ to move · ↵ to open · esc to close
                  </p>
                </div>
              ) : hits.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-[var(--color-ink-faint)]">
                  No matches for “{query}”.
                </p>
              ) : (
                <ul ref={listRef} role="listbox" aria-label="Search results" className="py-1">
                  {hits.map((hit, i) => (
                    <li key={hit.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={i === active}
                        data-active={i === active}
                        onMouseEnter={() => setActive(i)}
                        onClick={() => go(hit.href)}
                        className={cx(
                          'flex w-full items-baseline gap-3 px-4 py-2 text-left',
                          i === active ? 'bg-[var(--color-accent-soft)]' : '',
                        )}
                      >
                        <span className="mono-label w-16 shrink-0">{KIND_LABEL[hit.kind]}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{hit.title}</span>
                          <span className="block truncate text-xs text-[var(--color-ink-faint)]">
                            {hit.subtitle}
                          </span>
                        </span>
                        {hit.badge ? (
                          <span className="shrink-0 font-mono text-[10px] text-[var(--color-ink-faint)]">
                            {hit.badge}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
