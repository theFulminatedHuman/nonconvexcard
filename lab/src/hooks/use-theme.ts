'use client';

import { useCallback } from 'react';
import { useLocalStore, useHasMounted } from './use-local-store';

export type ThemePreference = 'light' | 'dark' | 'system';

const THEME_KEY = 'lab:theme';
const RESEARCH_KEY = 'lab:research-mode';

const parseTheme = (raw: string | null): ThemePreference =>
  raw === 'light' || raw === 'dark' ? raw : 'system';

function applyTheme(pref: ThemePreference): void {
  const dark =
    pref === 'dark' ||
    (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
}

export function useTheme() {
  const [theme, setThemeRaw] = useLocalStore<ThemePreference>(THEME_KEY, parseTheme, (v) => v);
  const mounted = useHasMounted();

  const setTheme = useCallback(
    (pref: ThemePreference) => {
      setThemeRaw(pref);
      applyTheme(pref);
    },
    [setThemeRaw],
  );

  return { theme, setTheme, mounted };
}

const parseFlag = (raw: string | null): boolean => raw === '1';

/**
 * Research mode strips the intuition-first scaffolding and shows formal
 * statements, assumptions, proofs and open questions only. It is a document
 * attribute so that CSS can act on it without a re-render.
 */
export function useResearchMode() {
  const [enabled, setRaw] = useLocalStore<boolean>(RESEARCH_KEY, parseFlag, (v) => (v ? '1' : '0'));
  const mounted = useHasMounted();

  const setEnabled = useCallback(
    (next: boolean) => {
      setRaw(next);
      if (next) document.documentElement.setAttribute('data-research', '1');
      else document.documentElement.removeAttribute('data-research');
    },
    [setRaw],
  );

  return { enabled: mounted ? enabled : false, setEnabled, mounted };
}
