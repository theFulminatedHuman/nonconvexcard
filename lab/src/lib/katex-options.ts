/**
 * Shared KaTeX configuration.
 *
 * Both rendering pipelines — MDX for topic and paper pages, plain Markdown for
 * the problem database — use exactly these options and macros, so a macro works
 * identically wherever it is written.
 *
 * Non-strict mode with `throwOnError: false` means a single unsupported command
 * renders as visible red source instead of failing the whole build; `trust:
 * false` keeps `\href` and `\includegraphics` out of content.
 */
export const katexOptions = {
  strict: false as const,
  throwOnError: false,
  trust: false,
  macros: {
    '\\R': '\\mathbb{R}',
    '\\N': '\\mathbb{N}',
    '\\E': '\\mathbb{E}',
    '\\P': '\\mathbb{P}',
    '\\Var': '\\operatorname{Var}',
    '\\Cov': '\\operatorname{Cov}',
    '\\argmin': '\\operatorname*{arg\\,min}',
    '\\argmax': '\\operatorname*{arg\\,max}',
    '\\tr': '\\operatorname{tr}',
    '\\rank': '\\operatorname{rank}',
    '\\sign': '\\operatorname{sign}',
    '\\diag': '\\operatorname{diag}',
    '\\ip': '\\left\\langle #1, #2 \\right\\rangle',
    '\\norm': '\\left\\lVert #1 \\right\\rVert',
    '\\abs': '\\left\\lvert #1 \\right\\rvert',
    '\\one': '\\mathbf{1}',
    '\\eps': '\\varepsilon',
    '\\Hcal': '\\mathcal{H}',
    '\\Fcal': '\\mathcal{F}',
    '\\Xcal': '\\mathcal{X}',
    '\\Ycal': '\\mathcal{Y}',
    '\\Dcal': '\\mathcal{D}',
    '\\Ncal': '\\mathcal{N}',
    '\\prox': '\\operatorname{prox}',
  },
};
