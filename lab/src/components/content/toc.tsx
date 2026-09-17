'use client';

import { useEffect, useState } from 'react';
import { cx } from '@/components/ui/primitives';

export interface TocItem {
  depth: number;
  text: string;
  id: string;
}

/**
 * Table of contents with a scroll-spy.
 *
 * `IntersectionObserver` is used rather than scroll offsets so the highlight
 * does not fight the sticky header, and the whole component degrades to a plain
 * list of links if the observer is unavailable.
 */
export function TableOfContents({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0 || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: [0, 1] },
    );
    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);

  if (items.length < 2) return null;

  return (
    <nav aria-label="On this page" className="text-[0.8rem]">
      <p className="mono-label mb-2">On this page</p>
      <ul className="space-y-1 border-l border-[var(--color-line)]">
        {items
          .filter((i) => i.depth <= 3)
          .map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={cx(
                  '-ml-px block border-l py-0.5 pl-3 leading-snug transition-colors',
                  item.depth === 3 && 'pl-6',
                  active === item.id
                    ? 'border-[var(--color-accent)] font-medium text-[var(--color-accent)]'
                    : 'border-transparent text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]',
                )}
              >
                {item.text}
              </a>
            </li>
          ))}
      </ul>
    </nav>
  );
}
