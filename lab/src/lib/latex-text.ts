/**
 * Plain-text rendering of LaTeX fragments.
 *
 * Some surfaces cannot run KaTeX: the table of contents, problem previews, the
 * search index, page metadata. Left alone they show raw source — "without $d$
 * inversions" — which looks broken. This converts a fragment to readable text:
 * common commands become their Unicode equivalents, and anything left over is
 * stripped rather than shown as a backslash command.
 *
 * It is deliberately lossy and is never used where real typesetting is possible.
 */

const SYMBOLS: Record<string, string> = {
  times: '×', cdot: '·', div: '÷', pm: '±', mp: '∓',
  le: '≤', leq: '≤', ge: '≥', geq: '≥', ne: '≠', neq: '≠',
  ll: '≪', gg: '≫', approx: '≈', sim: '~', propto: '∝', equiv: '≡',
  to: '→', rightarrow: '→', leftarrow: '←', Rightarrow: '⇒', mapsto: '↦',
  in: '∈', notin: '∉', subset: '⊂', subseteq: '⊆', cup: '∪', cap: '∩',
  infty: '∞', partial: '∂', nabla: '∇', sum: 'Σ', prod: 'Π', int: '∫',
  sqrt: '√', forall: '∀', exists: '∃', emptyset: '∅', ldots: '…', dots: '…',
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ε',
  zeta: 'ζ', eta: 'η', theta: 'θ', kappa: 'κ', lambda: 'λ', mu: 'μ', nu: 'ν',
  xi: 'ξ', pi: 'π', rho: 'ρ', sigma: 'σ', tau: 'τ', phi: 'φ', varphi: 'φ',
  chi: 'χ', psi: 'ψ', omega: 'ω',
  Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ', Pi: 'Π',
  Sigma: 'Σ', Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω',
  // Site macros from katex-options.ts.
  R: 'ℝ', N: 'ℕ', E: '𝔼', P: 'ℙ', eps: 'ε', one: '1',
};

/** Converts the inside of a math span to readable plain text. */
function mathBodyToText(body: string): string {
  let out = body;
  // \operatorname{foo}, \mathbb{R}, \text{foo} … keep the argument, drop the wrapper.
  out = out.replace(/\\(?:operatorname|mathbb|mathcal|mathrm|mathbf|text|textrm|boldsymbol)\s*\{([^{}]*)\}/g, '$1');
  // \frac{a}{b} → a/b
  out = out.replace(/\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, '$1/$2');
  // Named symbols.
  out = out.replace(/\\([A-Za-z]+)/g, (_m, name: string) =>
    Object.prototype.hasOwnProperty.call(SYMBOLS, name) ? (SYMBOLS[name] as string) : name,
  );
  // Left-over structural characters.
  out = out.replace(/[{}$]/g, '');
  out = out.replace(/\\[,;!\s]/g, ' ');
  return out;
}

/**
 * Converts a Markdown/LaTeX fragment to plain text, resolving inline and
 * display math and collapsing whitespace.
 */
export function latexToText(source: string): string {
  return source
    .replace(/\$\$([\s\S]*?)\$\$/g, (_m, body: string) => mathBodyToText(body))
    .replace(/\$([^$\n]*)\$/g, (_m, body: string) => mathBodyToText(body))
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*([^*]*)\*\*/g, '$1')
    .replace(/\*([^*]*)\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}
