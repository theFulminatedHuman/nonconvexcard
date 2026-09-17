'use client';

import { useState } from 'react';
import { useHasMounted } from '@/hooks/use-local-store';
import { useProgress } from '@/hooks/use-progress';
import { Card } from '@/components/ui/primitives';

/**
 * Export, import and reset.
 *
 * Progress lives in `localStorage`, which means it is tied to one browser on
 * one machine and can be cleared by a privacy setting you did not think was
 * related. Export is therefore not a nicety: it is the only backup that exists.
 */
export function DataControls() {
  const { exportJson, importState, reset, state } = useProgress();
  const mounted = useHasMounted();
  const [message, setMessage] = useState<string | null>(null);
  const [paste, setPaste] = useState('');
  const [confirming, setConfirming] = useState(false);

  const download = () => {
    const blob = new Blob([exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-math-lab-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('Downloaded.');
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(exportJson());
      setMessage('Copied to the clipboard.');
    } catch {
      setMessage('The clipboard is unavailable here — use Download instead.');
    }
  };

  return (
    <Card className="p-4">
      <p className="mono-label mb-2">Your data</p>
      <p className="text-[0.85rem] leading-relaxed text-[var(--color-ink-soft)]">
        {mounted ? state.entries.length : 0} records, stored in this browser. Nothing is uploaded and
        there is no account, so clearing site data deletes it permanently. Export before you switch
        machines.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={download}
          className="rounded border border-[var(--color-line)] px-2.5 py-1 text-xs font-medium hover:border-[var(--color-line-strong)]"
        >
          Download JSON
        </button>
        <button
          type="button"
          onClick={copy}
          className="rounded border border-[var(--color-line)] px-2.5 py-1 text-xs font-medium hover:border-[var(--color-line-strong)]"
        >
          Copy JSON
        </button>
        <button
          type="button"
          onClick={() => setConfirming((v) => !v)}
          className="rounded border border-[var(--color-diff-olympiad)]/40 px-2.5 py-1 text-xs font-medium text-[var(--color-diff-olympiad)] hover:border-[var(--color-diff-olympiad)]"
        >
          Reset everything
        </button>
      </div>

      {confirming ? (
        <div className="mt-3 rounded border border-[var(--color-diff-olympiad)]/40 bg-[var(--color-elevated)] px-3 py-2.5">
          <p className="text-[0.85rem]">
            This erases every record permanently. Download a copy first if you might want it back.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => {
                reset();
                setConfirming(false);
                setMessage('All progress cleared.');
              }}
              className="rounded bg-[var(--color-diff-olympiad)] px-2.5 py-1 text-xs font-medium text-white"
            >
              Yes, erase it
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded border border-[var(--color-line)] px-2.5 py-1 text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-[var(--color-ink-soft)]">
          Import from an export
        </summary>
        <textarea
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          rows={4}
          placeholder="Paste the contents of a progress export"
          aria-label="Progress JSON to import"
          className="mt-2 w-full rounded border border-[var(--color-line)] bg-[var(--color-elevated)] px-2 py-1.5 font-mono text-[11px] outline-none"
        />
        <button
          type="button"
          onClick={() => {
            setMessage(
              importState(paste)
                ? 'Imported — this replaced the previous records.'
                : 'That did not parse as a progress export; nothing was changed.',
            );
          }}
          className="mt-2 rounded border border-[var(--color-line)] px-2.5 py-1 text-xs font-medium hover:border-[var(--color-line-strong)]"
        >
          Import
        </button>
      </details>

      {message ? (
        <p role="status" className="mt-3 text-xs text-[var(--color-ink-soft)]">
          {message}
        </p>
      ) : null}
    </Card>
  );
}
