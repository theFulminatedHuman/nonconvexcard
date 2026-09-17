import { describe, expect, it } from 'vitest';
import { normalise, scoreDoc, search, tokenize, type SearchDoc } from './search';

const docs: SearchDoc[] = [
  {
    id: 'topic:a',
    kind: 'topic',
    title: 'SGD convergence',
    subtitle: 'Rates for stochastic gradient descent',
    href: '/topics/stochastic-optimization/sgd-convergence',
    keywords: 'robbins monro step size variance noise',
  },
  {
    id: 'problem:b',
    kind: 'problem',
    title: 'Prove the Johnson–Lindenstrauss lemma',
    subtitle: 'Proof · High-Dim Probability',
    href: '/problems/jl-lemma',
    keywords: 'random projection distortion epsilon net',
  },
  {
    id: 'claim:c',
    kind: 'claim',
    title: 'Marchenko–Pastur law',
    subtitle: 'Theorem — Random matrices',
    href: '/topics/random-matrix-theory/marchenko-pastur#mp-law',
    keywords: 'spectrum sample covariance aspect ratio',
  },
];

describe('normalise and tokenize', () => {
  it('strips punctuation and unicode dashes', () => {
    expect(normalise('Marchenko–Pastur law!')).toBe('marchenko-pastur law');
  });

  it('splits into tokens', () => {
    expect(tokenize('  SGD   Convergence ')).toEqual(['sgd', 'convergence']);
  });

  it('returns no tokens for an empty query', () => {
    expect(tokenize('   ')).toEqual([]);
  });
});

describe('scoreDoc', () => {
  it('scores an exact title match highest', () => {
    const exact = scoreDoc(docs[0]!, tokenize('sgd convergence'));
    const partial = scoreDoc(docs[0]!, tokenize('sgd'));
    expect(exact).toBeGreaterThan(partial);
  });

  it('is conjunctive: every token must match', () => {
    expect(scoreDoc(docs[0]!, tokenize('sgd rademacher'))).toBe(0);
  });

  it('matches keywords when the title does not', () => {
    expect(scoreDoc(docs[0]!, tokenize('robbins'))).toBeGreaterThan(0);
  });

  it('scores zero for an empty query', () => {
    expect(scoreDoc(docs[0]!, [])).toBe(0);
  });
});

describe('search', () => {
  it('finds documents across kinds', () => {
    expect(search(docs, 'marchenko')[0]!.id).toBe('claim:c');
    expect(search(docs, 'johnson lindenstrauss')[0]!.id).toBe('problem:b');
  });

  it('is insensitive to dashes and case', () => {
    expect(search(docs, 'Marchenko-Pastur')).toHaveLength(1);
    expect(search(docs, 'MARCHENKO pastur')).toHaveLength(1);
  });

  it('returns nothing for an empty or unmatched query', () => {
    expect(search(docs, '')).toEqual([]);
    expect(search(docs, 'quantum topology')).toEqual([]);
  });

  it('respects the result limit', () => {
    expect(search(docs, 'e', 2).length).toBeLessThanOrEqual(2);
  });

  it('orders by score descending', () => {
    const hits = search(docs, 'lemma');
    for (let i = 1; i < hits.length; i++) {
      expect(hits[i - 1]!.score).toBeGreaterThanOrEqual(hits[i]!.score);
    }
  });
});

describe('scoreDoc keyword normalisation', () => {
  // The index builder normalises `keywords`, but the index ships as JSON and is
  // re-read at runtime; a doc that arrives un-normalised must still match
  // rather than silently score zero.
  const raw: SearchDoc = {
    id: 'topic:d',
    kind: 'topic',
    title: 'Covariance estimation',
    subtitle: 'Sample covariance in high dimension',
    href: '/topics/high-dimensional-statistics/covariance-estimation',
    keywords: 'Sub-Gaussian TAILS, Operator Norm; Wishart!',
  };

  it('matches a token that only appears in mixed-case keywords', () => {
    expect(scoreDoc(raw, ['wishart'])).toBeGreaterThan(0);
  });

  it('matches a token adjacent to punctuation in keywords', () => {
    expect(scoreDoc(raw, ['tails'])).toBeGreaterThan(0);
  });

  it('still returns 0 for a token that is genuinely absent', () => {
    expect(scoreDoc(raw, ['rademacher'])).toBe(0);
  });

  it('is unchanged on already-normalised keywords, since normalise is idempotent', () => {
    const pre: SearchDoc = { ...raw, keywords: normalise(raw.keywords) };
    expect(scoreDoc(pre, ['wishart'])).toBe(scoreDoc(raw, ['wishart']));
  });
});
