'use client';

import { useResearchMode, useTheme, type ThemePreference } from '@/hooks/use-theme';
import { MonitorIcon, MoonIcon, SunIcon } from '@/components/ui/icons';
import { cx } from '@/components/ui/primitives';

const OPTIONS: { value: ThemePreference; label: string; Icon: typeof SunIcon }[] = [
  { value: 'light', label: 'Light', Icon: SunIcon },
  { value: 'dark', label: 'Dark', Icon: MoonIcon },
  { value: 'system', label: 'System', Icon: MonitorIcon },
];

export function ThemeToggle() {
  const { theme, setTheme, mounted } = useTheme();
  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className="flex items-center gap-0.5 rounded border border-[var(--color-line)] p-0.5"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const selected = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${label} theme`}
            title={`${label} theme`}
            onClick={() => setTheme(value)}
            className={cx(
              'rounded p-1 transition-colors',
              selected
                ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)]'
                : 'text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]',
            )}
          >
            <Icon size={14} />
          </button>
        );
      })}
    </div>
  );
}

/**
 * Research mode hides the intuition-first scaffolding site-wide. The state is
 * mirrored onto `<html data-research>` so that MDX content can respond to it in
 * CSS without every page subscribing to the store.
 */
export function ResearchModeToggle() {
  const { enabled, setEnabled } = useResearchMode();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => setEnabled(!enabled)}
      title="Research mode hides intuition sections and shows formal statements, proofs and open questions only."
      className={cx(
        'flex items-center gap-1.5 rounded border px-2 py-1 font-mono text-[10px] tracking-wide uppercase transition-colors',
        enabled
          ? 'border-[var(--color-accent)]/40 bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)]'
          : 'border-[var(--color-line)] text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]',
      )}
    >
      <span
        aria-hidden
        className={cx(
          'size-1.5 rounded-full',
          enabled ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-line-strong)]',
        )}
      />
      Research mode
    </button>
  );
}
