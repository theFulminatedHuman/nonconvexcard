'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useHasMounted, useLocalStore } from '@/hooks/use-local-store';
import { useProgress } from '@/hooks/use-progress';
import { today } from '@/lib/dates';
import type { JudgeSpec } from '@/lib/judge';
import type { Difficulty, FieldSlug } from '@/lib/taxonomy';
import { CheckIcon, CloseIcon, PlayIcon, RefreshIcon } from '@/components/ui/icons';
import { cx } from '@/components/ui/primitives';

interface TestResult {
  name: string;
  ok: boolean;
  message?: string;
  output?: string;
}

type Verdict =
  | { kind: 'idle' }
  | { kind: 'loading'; note: string }
  | { kind: 'running' }
  | { kind: 'accepted'; results: TestResult[]; output: string }
  | { kind: 'failed'; results: TestResult[]; output: string }
  | { kind: 'error'; stage: string; message: string; output: string }
  | { kind: 'timeout'; seconds: number };

const VERDICT_LABEL: Record<string, string> = {
  accepted: 'Accepted',
  failed: 'Wrong answer',
  error: 'Runtime error',
  timeout: 'Time limit exceeded',
};

/**
 * An in-browser judge.
 *
 * Python runs in the reader's own browser through Pyodide in a Web Worker —
 * there is no server, nothing is uploaded, and the site remains a static
 * export. The worker exists so a non-terminating submission can be killed,
 * which is the only way to enforce a time limit in a browser.
 */
export function CodeRunner({
  spec,
  problem,
  basePath,
}: {
  spec: JudgeSpec;
  problem: { id: string; title: string; field: FieldSlug; difficulty: Difficulty; minutes: number };
  basePath: string;
}) {
  const mounted = useHasMounted();
  const { complete, isDone } = useProgress();

  const storageKey = `lab:draft:${problem.id}`;
  const [draft, setDraft] = useLocalStore<string>(
    storageKey,
    useCallback((raw: string | null) => raw ?? spec.starter, [spec.starter]),
    useCallback((v: string) => v, []),
  );

  const [verdict, setVerdict] = useState<Verdict>({ kind: 'idle' });
  const workerRef = useRef<Worker | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runIdRef = useRef(0);

  const disposeWorker = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  useEffect(() => disposeWorker, [disposeWorker]);

  const run = useCallback(() => {
    // Always start from a clean worker: the previous one may have been killed
    // mid-run, and a fresh namespace per submission is what we want anyway.
    disposeWorker();
    const worker = new Worker(`${basePath}/judge-worker.js`);
    workerRef.current = worker;

    const id = ++runIdRef.current;
    setVerdict({ kind: 'loading', note: 'Starting the Python runtime…' });

    worker.onmessage = (event: MessageEvent) => {
      const data = event.data as Record<string, unknown>;
      if (data.id !== id) return;

      if (data.stage === 'loading') {
        setVerdict({ kind: 'loading', note: 'Downloading Python and packages (first run only)…' });
        return;
      }

      if (timerRef.current) clearTimeout(timerRef.current);

      if (data.ok === false) {
        setVerdict({
          kind: 'error',
          stage: String(data.stage ?? 'source'),
          message: String(data.message ?? 'Unknown error'),
          output: String(data.output ?? ''),
        });
        return;
      }

      const results = (data.results ?? []) as TestResult[];
      const output = String(data.output ?? '');
      const passed = results.every((r) => r.ok);
      setVerdict(passed ? { kind: 'accepted', results, output } : { kind: 'failed', results, output });

      if (passed && !isDone('problem', problem.id)) {
        complete({
          kind: 'problem',
          refId: problem.id,
          title: problem.title,
          field: problem.field,
          difficulty: problem.difficulty,
          type: 'coding',
          minutes: problem.minutes,
          date: today(),
        });
      }
    };

    worker.onerror = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setVerdict({
        kind: 'error',
        stage: 'runtime',
        message:
          'The judge worker failed to start. This usually means the Python runtime could not be fetched from the CDN — check the network tab.',
        output: '',
      });
    };

    timerRef.current = setTimeout(() => {
      disposeWorker();
      setVerdict({ kind: 'timeout', seconds: spec.timeout_seconds });
    }, spec.timeout_seconds * 1000);

    setVerdict({ kind: 'running' });
    worker.postMessage({ id, source: draft, preamble: spec.preamble, tests: spec.tests });
  }, [basePath, complete, disposeWorker, draft, isDone, problem, spec]);

  const lineCount = useMemo(() => draft.split('\n').length, [draft]);
  const busy = verdict.kind === 'running' || verdict.kind === 'loading';

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const el = e.currentTarget;
      const { selectionStart: s, selectionEnd: t } = el;
      const next = `${draft.slice(0, s)}    ${draft.slice(t)}`;
      setDraft(next);
      requestAnimationFrame(() => el.setSelectionRange(s + 4, s + 4));
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (!busy) run();
    }
  };

  return (
    <div className="panel">
      <div className="panel-title">
        <span>Solve it here</span>
        <span className="font-mono text-[10px] normal-case">
          {spec.tests.length} test{spec.tests.length === 1 ? '' : 's'} · Python runs in your browser
        </span>
      </div>

      <div className="flex items-stretch border-b border-[var(--color-line)]">
        <pre
          aria-hidden
          className="shrink-0 border-r border-[var(--color-line)] bg-[var(--color-elevated)] px-2 py-2 text-right font-mono text-[0.76rem] leading-[1.5] text-[var(--color-ink-faint)] select-none"
        >
          {Array.from({ length: lineCount }, (_, i) => i + 1).join('\n')}
        </pre>
        <textarea
          value={mounted ? draft : spec.starter}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          spellCheck={false}
          rows={Math.min(Math.max(lineCount + 2, 12), 34)}
          aria-label="Your solution"
          className="w-full resize-y bg-[var(--color-surface)] px-3 py-2 font-mono text-[0.76rem] leading-[1.5] outline-none"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-line)] bg-[var(--color-elevated)] px-3 py-2">
        <button
          type="button"
          onClick={run}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded bg-[var(--color-accent)] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
        >
          <PlayIcon size={12} />
          {busy ? 'Running…' : 'Run tests'}
        </button>
        <button
          type="button"
          onClick={() => {
            setDraft(spec.starter);
            setVerdict({ kind: 'idle' });
          }}
          className="inline-flex items-center gap-1.5 rounded border border-[var(--color-line-strong)] px-2.5 py-1.5 text-xs font-medium"
        >
          <RefreshIcon size={12} />
          Reset
        </button>
        <span className="ml-auto font-mono text-[10px] text-[var(--color-ink-faint)]">
          ⌘/Ctrl + ↵ to run · limit {spec.timeout_seconds}s · draft saved in this browser
        </span>
      </div>

      <Verdicts verdict={verdict} tests={spec.tests} />
    </div>
  );
}

function Verdicts({ verdict, tests }: { verdict: Verdict; tests: JudgeSpec['tests'] }) {
  if (verdict.kind === 'idle') {
    return (
      <div className="px-3 py-3 text-[0.82rem] text-[var(--color-ink-faint)]">
        {tests.length} test{tests.length === 1 ? '' : 's'} will run against your code. The first run
        downloads the Python runtime — several megabytes, once per browser.
      </div>
    );
  }

  if (verdict.kind === 'loading' || verdict.kind === 'running') {
    return (
      <div className="px-3 py-3 text-[0.82rem] text-[var(--color-ink-soft)]">
        {verdict.kind === 'loading' ? verdict.note : 'Running your code…'}
      </div>
    );
  }

  if (verdict.kind === 'timeout') {
    return (
      <Banner tone="bad" label={VERDICT_LABEL.timeout!}>
        Your code did not finish within {verdict.seconds} seconds and was stopped. That usually means
        a loop that never exits, or a problem size far larger than intended.
      </Banner>
    );
  }

  if (verdict.kind === 'error') {
    return (
      <>
        <Banner tone="bad" label={VERDICT_LABEL.error!}>
          {verdict.stage === 'runtime'
            ? 'The judge could not start.'
            : 'Your code raised before the tests ran.'}
        </Banner>
        <pre className="overflow-x-auto border-t border-[var(--color-line)] bg-[var(--color-sunken)] px-3 py-2 font-mono text-[0.74rem] whitespace-pre-wrap text-[var(--color-diff-olympiad)]">
          {verdict.message}
        </pre>
        {verdict.output ? <Output text={verdict.output} /> : null}
      </>
    );
  }

  const passed = verdict.results.filter((r) => r.ok).length;
  return (
    <>
      <Banner
        tone={verdict.kind === 'accepted' ? 'good' : 'bad'}
        label={VERDICT_LABEL[verdict.kind]!}
      >
        {passed} of {verdict.results.length} tests passed
        {verdict.kind === 'accepted' ? ' — marked solved.' : '.'}
      </Banner>
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col" className="w-8">
              <span className="sr-only">Result</span>
            </th>
            <th scope="col">Test</th>
            <th scope="col">Detail</th>
          </tr>
        </thead>
        <tbody>
          {verdict.results.map((r) => (
            <tr key={r.name}>
              <td>
                {r.ok ? (
                  <CheckIcon size={13} className="text-[var(--color-diff-foundation)]" />
                ) : (
                  <CloseIcon size={13} className="text-[var(--color-diff-olympiad)]" />
                )}
              </td>
              <td className="font-medium">{r.name}</td>
              <td className="font-mono text-[0.72rem] whitespace-pre-wrap text-[var(--color-ink-soft)]">
                {r.ok ? 'passed' : (r.message ?? 'failed')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {verdict.output ? <Output text={verdict.output} /> : null}
    </>
  );
}

function Banner({
  tone,
  label,
  children,
}: {
  tone: 'good' | 'bad';
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cx(
        'flex flex-wrap items-baseline gap-x-3 border-b px-3 py-2 text-[0.82rem]',
        tone === 'good'
          ? 'border-[var(--color-diff-foundation)]/40 bg-[var(--color-diff-foundation)]/10'
          : 'border-[var(--color-diff-olympiad)]/40 bg-[var(--color-diff-olympiad)]/10',
      )}
    >
      <strong
        className={cx(
          'font-bold',
          tone === 'good'
            ? 'text-[var(--color-diff-foundation)]'
            : 'text-[var(--color-diff-olympiad)]',
        )}
      >
        {label}
      </strong>
      <span className="text-[var(--color-ink-soft)]">{children}</span>
    </div>
  );
}

function Output({ text }: { text: string }) {
  return (
    <details className="border-t border-[var(--color-line)]">
      <summary className="cursor-pointer px-3 py-1.5 font-mono text-[0.72rem] text-[var(--color-ink-faint)]">
        Program output
      </summary>
      <pre className="overflow-x-auto bg-[var(--color-sunken)] px-3 py-2 font-mono text-[0.74rem] whitespace-pre-wrap">
        {text}
      </pre>
    </details>
  );
}
