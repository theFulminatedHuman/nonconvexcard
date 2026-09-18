'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import type { NavField } from '@/lib/nav';
import { SITE } from '@/lib/site';
import { CommandPalette } from '@/components/search/command-palette';
import { CloseIcon, MenuIcon, SigmaIcon } from '@/components/ui/icons';
import { ResearchModeToggle, ThemeToggle } from './controls';
import { SidebarContent } from './sidebar';

/** The primary sections, as a contest-site tab strip. */
const TABS = [
  { href: '/learn', label: 'Learn' },
  { href: '/problems', label: 'Problems' },
  { href: '/abyss', label: 'Abyss' },
  { href: '/proofs', label: 'Proofs' },
  { href: '/experiments', label: 'Experiments' },
  { href: '/papers', label: 'Papers' },
  { href: '/topics', label: 'Topics' },
  { href: '/graph', label: 'Graph' },
  { href: '/progress', label: 'Progress' },
] as const;

export function AppShell({
  fields,
  basePath,
  children,
}: {
  fields: NavField[];
  basePath: string;
  children: ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  // The drawer is a route-scoped overlay; a navigation always dismisses it.
  useEffect(() => setDrawerOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-[var(--color-surface)] focus:px-3 focus:py-2 focus:text-sm"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-[var(--color-line)] bg-[var(--color-canvas)]/92 backdrop-blur-sm">
        <div className="flex h-14 items-center gap-3 px-3 sm:px-4">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            className="rounded p-1.5 text-[var(--color-ink-soft)] hover:bg-[var(--color-elevated)] lg:hidden"
          >
            <MenuIcon size={18} />
          </button>

          <Link href="/" className="flex shrink-0 items-center gap-2">
            <SigmaIcon size={18} className="text-[var(--color-accent)]" />
            <span className="text-sm font-semibold tracking-[-0.01em]">
              <span className="hidden sm:inline">{SITE.name}</span>
              <span className="sm:hidden">{SITE.short}</span>
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden w-64 md:block">
              <CommandPalette basePath={basePath} />
            </div>
            <div className="hidden lg:block">
              <ResearchModeToggle />
            </div>
            <ThemeToggle />
          </div>
        </div>
        <nav
          aria-label="Sections"
          className="no-scrollbar hidden overflow-x-auto border-t border-[var(--color-line)] px-2 md:block"
        >
          <ul className="flex items-stretch">
            {TABS.map((tab) => {
              const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
              return (
                <li key={tab.href}>
                  <Link
                    href={tab.href}
                    aria-current={active ? 'page' : undefined}
                    className="navtab"
                  >
                    {tab.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-[var(--color-line)] px-3 py-2 md:hidden">
          <CommandPalette basePath={basePath} />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[110rem]">
        <aside className="no-scrollbar sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-64 shrink-0 overflow-y-auto border-r border-[var(--color-line)] px-3 py-5 lg:block">
          <SidebarContent fields={fields} />
        </aside>

        {drawerOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden" role="presentation">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setDrawerOpen(false)}
              aria-hidden
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              className="absolute inset-y-0 left-0 w-72 overflow-y-auto border-r border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-4"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="mono-label">Navigate</span>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close navigation"
                  className="rounded p-1 text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
                >
                  <CloseIcon size={16} />
                </button>
              </div>
              <div className="mb-4">
                <ResearchModeToggle />
              </div>
              <SidebarContent fields={fields} onNavigate={() => setDrawerOpen(false)} />
            </div>
          </div>
        ) : null}

        <main id="main" className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
