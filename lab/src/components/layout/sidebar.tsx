'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import type { NavField } from '@/lib/nav';
import { PRIMARY_NAV } from '@/lib/site';
import { FIELD_GROUPS } from '@/lib/taxonomy';
import { ChevronDownIcon } from '@/components/ui/icons';
import { cx } from '@/components/ui/primitives';

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  href,
  children,
  depth = 0,
  onNavigate,
}: {
  href: string;
  children: React.ReactNode;
  depth?: number;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = isActive(pathname, href);
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cx(
        'block rounded px-2 py-1 text-[0.8125rem] leading-snug transition-colors',
        depth > 0 && 'ml-2 border-l border-[var(--color-line)] pl-3',
        active
          ? 'bg-[var(--color-accent-soft)] font-medium text-[var(--color-accent-ink)]'
          : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-elevated)] hover:text-[var(--color-ink)]',
      )}
    >
      {children}
    </Link>
  );
}

function FieldSection({ field, onNavigate }: { field: NavField; onNavigate?: () => void }) {
  const pathname = usePathname();
  const containsActive = isActive(pathname, field.href);
  const [open, setOpen] = useState(containsActive);
  const expanded = open || containsActive;

  return (
    <li>
      <div className="flex items-stretch">
        <NavLink href={field.href} onNavigate={onNavigate}>
          {field.short}
        </NavLink>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Collapse' : 'Expand'} ${field.title}`}
          className="ml-auto rounded px-1 text-[var(--color-ink-faint)] hover:bg-[var(--color-elevated)] hover:text-[var(--color-ink)]"
        >
          <ChevronDownIcon
            size={13}
            className={cx('transition-transform', expanded ? '' : '-rotate-90')}
          />
        </button>
      </div>
      {expanded ? (
        <ul className="mt-0.5 space-y-0.5">
          {field.topics.map((t) => (
            <li key={t.id}>
              <NavLink href={t.href} depth={1} onNavigate={onNavigate}>
                {t.title}
              </NavLink>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function SidebarContent({
  fields,
  onNavigate,
}: {
  fields: NavField[];
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Primary" className="space-y-6 pb-16">
      {PRIMARY_NAV.map((section) => (
        <div key={section.label}>
          <h2 className="mono-label mb-1.5 px-2">{section.label}</h2>
          <ul className="space-y-0.5">
            {section.items.map((item) => (
              <li key={item.href}>
                <NavLink href={item.href} onNavigate={onNavigate}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {FIELD_GROUPS.map((group) => {
        const inGroup = fields.filter((f) => f.group === group);
        if (inGroup.length === 0) return null;
        return (
          <div key={group}>
            <h2 className="mono-label mb-1.5 px-2">{group}</h2>
            <ul className="space-y-0.5">
              {inGroup.map((f) => (
                <FieldSection key={f.slug} field={f} onNavigate={onNavigate} />
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
