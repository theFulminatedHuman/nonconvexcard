/*
 * Judge worker.
 *
 * Runs submitted Python in a Web Worker via Pyodide (CPython compiled to
 * WebAssembly). Two reasons it is a worker rather than the main thread:
 *
 *  1. A submission that loops forever would otherwise freeze the page. The main
 *     thread can `terminate()` a worker, which is the only reliable way to
 *     enforce a time limit in a browser.
 *  2. Pyodide's first load is several megabytes and a second or two of work;
 *     off the main thread that never blocks interaction.
 *
 * Nothing executes on a server: the code runs inside the reader's own browser
 * sandbox, which is why this design needs no backend and adds no attack surface.
 */

/* global loadPyodide */

const PYODIDE_VERSION = '0.26.4';

/*
 * Sources are tried in order. Three of them, with genuinely different failure
 * modes, because a single hard-coded URL makes the whole judge depend on one
 * path being exactly right on one CDN:
 *
 *   1. Pyodide's own CDN layout on jsDelivr.
 *   2. The same release as an npm package — a different path on the same CDN,
 *      so it survives a wrong `/pyodide/vX/full/` path.
 *   3. unpkg — a different CDN entirely, so it survives a jsDelivr outage.
 *
 * `importScripts` throws synchronously on a failed load, so a bad source is
 * detected immediately and the next is tried. If all fail the reported error
 * lists every URL attempted, which is what makes a wrong pin a one-line fix
 * rather than a hunt.
 */
const PYODIDE_SOURCES = [
  `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`,
  `https://cdn.jsdelivr.net/npm/pyodide@${PYODIDE_VERSION}/`,
  `https://unpkg.com/pyodide@${PYODIDE_VERSION}/`,
];

let pyodidePromise = null;

function getPyodide() {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      const failures = [];
      for (const base of PYODIDE_SOURCES) {
        try {
          importScripts(`${base}pyodide.js`);
          return await loadPyodide({ indexURL: base });
        } catch (err) {
          failures.push(`${base}pyodide.js — ${err}`);
        }
      }
      throw new Error(
        `none of the ${PYODIDE_SOURCES.length} sources for Pyodide ${PYODIDE_VERSION} could be loaded:\n` +
          failures.join('\n'),
      );
    })();
    // A failed load must not be cached, or every later attempt reuses the
    // rejection and the reader can never retry without a page reload.
    pyodidePromise.catch(() => {
      pyodidePromise = null;
    });
  }
  return pyodidePromise;
}

/** Collects everything the submission prints, so it can be shown alongside the verdict. */
function captureOutput(pyodide, sink) {
  pyodide.setStdout({ batched: (line) => sink.push(line) });
  pyodide.setStderr({ batched: (line) => sink.push(line) });
}

self.onmessage = async (event) => {
  const { id, source, preamble, tests } = event.data;
  const output = [];

  const fail = (stage, message) =>
    self.postMessage({ id, ok: false, stage, message, output: output.join('\n') });

  let pyodide;
  try {
    self.postMessage({ id, stage: 'loading' });
    pyodide = await getPyodide();
  } catch (err) {
    fail('runtime', `Could not load the Python runtime (Pyodide ${PYODIDE_VERSION}): ${err}`);
    return;
  }

  captureOutput(pyodide, output);

  // Fetch any packages the submission imports (numpy and friends) before running it.
  try {
    await pyodide.loadPackagesFromImports(`${preamble ?? ''}\n${source}`);
  } catch (err) {
    fail('runtime', `Could not load the packages this code imports: ${err}`);
    return;
  }

  // A fresh namespace per submission, so one run cannot see the previous one's state.
  const ns = pyodide.globals.get('dict')();

  try {
    if (preamble) await pyodide.runPythonAsync(preamble, { globals: ns });
    await pyodide.runPythonAsync(source, { globals: ns });
  } catch (err) {
    ns.destroy();
    fail('source', String(err && err.message ? err.message : err));
    return;
  }

  const results = [];
  for (const test of tests) {
    const before = output.length;
    try {
      await pyodide.runPythonAsync(test.code, { globals: ns });
      results.push({ name: test.name, ok: true });
    } catch (err) {
      const raw = String(err && err.message ? err.message : err);
      results.push({ name: test.name, ok: false, message: condense(raw) });
    }
    // Attribute anything printed during this test to it.
    if (output.length > before) {
      results[results.length - 1].output = output.slice(before).join('\n');
    }
  }

  ns.destroy();
  self.postMessage({ id, ok: true, stage: 'done', results, output: output.join('\n') });
};

/**
 * Pyodide tracebacks carry frames from its own bootstrap. Keep the lines that
 * refer to the submission and the final exception, and drop the rest.
 */
function condense(traceback) {
  const lines = traceback.split('\n').filter((l) => !l.includes('/lib/python3') && l.trim() !== '');
  const last = lines[lines.length - 1] ?? traceback;
  const assertionLine = lines.find((l) => l.trim().startsWith('assert'));
  return assertionLine ? `${last}\n  in: ${assertionLine.trim()}` : last;
}
