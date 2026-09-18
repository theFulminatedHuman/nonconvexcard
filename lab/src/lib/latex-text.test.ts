import { describe, expect, it } from 'vitest';
import { latexToText } from './latex-text';

describe('latexToText', () => {
  it('resolves inline math rather than leaving the delimiters', () => {
    expect(latexToText('without $d$ inversions')).toBe('without d inversions');
  });

  it('maps common operators to Unicode', () => {
    expect(latexToText('$4096 \\times 4096$')).toBe('4096 × 4096');
    expect(latexToText('$a \\le b$')).toBe('a ≤ b');
  });

  it('expands site macros', () => {
    expect(latexToText('$x \\in \\R^d$')).toBe('x ∈ ℝ^d');
  });

  it('unwraps operatorname and mathbb', () => {
    expect(latexToText('$\\operatorname{rank}(A)$')).toBe('rank(A)');
    expect(latexToText('$\\mathbb{E}[X]$')).toBe('E[X]');
  });

  it('turns fractions into a slash', () => {
    expect(latexToText('$\\frac{a}{b}$')).toBe('a/b');
  });

  it('handles display math', () => {
    expect(latexToText('before $$x^2 + y^2$$ after')).toBe('before x^2 + y^2 after');
  });

  it('strips markdown emphasis and code ticks', () => {
    expect(latexToText('**bold** and `code`')).toBe('bold and code');
  });

  it('collapses whitespace', () => {
    expect(latexToText('a\n\n  b   c')).toBe('a b c');
  });

  it('leaves plain prose untouched', () => {
    expect(latexToText('An ordinary sentence.')).toBe('An ordinary sentence.');
  });

  it('drops unknown commands rather than showing a backslash', () => {
    expect(latexToText('$\\unknowncmd x$')).toBe('unknowncmd x');
  });
});
