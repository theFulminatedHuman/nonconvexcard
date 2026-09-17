'use client';

import { useCallback, useMemo } from 'react';
import {
  EMPTY_STATE,
  hasActivity,
  parseState,
  recordActivity,
  removeActivity,
  STORAGE_KEY,
  type ActivityEntry,
  type ActivityKind,
  type ProgressState,
} from '@/lib/progress';
import { useLocalStore } from './use-local-store';

const serialize = (s: ProgressState) => JSON.stringify(s);

export interface ProgressApi {
  state: ProgressState;
  /** `false` during server render and the first client paint. */
  ready: boolean;
  isDone: (kind: ActivityKind, refId: string) => boolean;
  complete: (entry: Omit<ActivityEntry, 'key'>) => void;
  uncomplete: (kind: ActivityKind, refId: string) => void;
  toggle: (entry: Omit<ActivityEntry, 'key'>) => void;
  reset: () => void;
  importState: (json: string) => boolean;
  exportJson: () => string;
}

export function useProgress(): ProgressApi {
  const [state, setState] = useLocalStore<ProgressState>(STORAGE_KEY, parseState, serialize);

  const complete = useCallback(
    (entry: Omit<ActivityEntry, 'key'>) => setState((prev) => recordActivity(prev, entry)),
    [setState],
  );

  const uncomplete = useCallback(
    (kind: ActivityKind, refId: string) => setState((prev) => removeActivity(prev, kind, refId)),
    [setState],
  );

  const toggle = useCallback(
    (entry: Omit<ActivityEntry, 'key'>) =>
      setState((prev) =>
        hasActivity(prev, entry.kind, entry.refId)
          ? removeActivity(prev, entry.kind, entry.refId)
          : recordActivity(prev, entry),
      ),
    [setState],
  );

  const importState = useCallback(
    (json: string) => {
      const parsed = parseState(json);
      if (parsed.entries.length === 0) return false;
      setState(parsed);
      return true;
    },
    [setState],
  );

  return useMemo<ProgressApi>(
    () => ({
      state,
      ready: state !== EMPTY_STATE || typeof window !== 'undefined',
      isDone: (kind, refId) => hasActivity(state, kind, refId),
      complete,
      uncomplete,
      toggle,
      reset: () => setState(EMPTY_STATE),
      importState,
      exportJson: () => JSON.stringify(state, null, 2),
    }),
    [state, complete, uncomplete, toggle, setState, importState],
  );
}
