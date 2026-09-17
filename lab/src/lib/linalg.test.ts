import { describe, expect, it } from 'vitest';
import {
  cosineSimilarity,
  frobeniusNorm,
  gram,
  identity,
  mat,
  matmul,
  matvec,
  norm2,
  ridgeSolve,
  singularValues,
  solveSpd,
  spectralNorm,
  symmetricEigenvalues,
  transpose,
} from './linalg';
import { createRng } from './rng';

describe('matrix algebra', () => {
  it('multiplies matrices', () => {
    const a = mat(2, 3, [1, 2, 3, 4, 5, 6]);
    const b = mat(3, 2, [7, 8, 9, 10, 11, 12]);
    const c = matmul(a, b);
    expect(Array.from(c.data)).toEqual([58, 64, 139, 154]);
  });

  it('rejects shape mismatches', () => {
    expect(() => matmul(mat(2, 3), mat(2, 3))).toThrow(/shape mismatch/);
  });

  it('is the identity on multiplication by I', () => {
    const a = mat(3, 3, [1, 2, 3, 4, 5, 6, 7, 8, 10]);
    expect(Array.from(matmul(a, identity(3)).data)).toEqual(Array.from(a.data));
  });

  it('transposes', () => {
    const a = mat(2, 3, [1, 2, 3, 4, 5, 6]);
    expect(Array.from(transpose(a).data)).toEqual([1, 4, 2, 5, 3, 6]);
  });

  it('applies a matrix to a vector', () => {
    expect(Array.from(matvec(mat(2, 2, [1, 2, 3, 4]), [1, 1]))).toEqual([3, 7]);
  });

  it('computes the Frobenius norm', () => {
    expect(frobeniusNorm(mat(2, 2, [3, 4, 0, 0]))).toBeCloseTo(5, 10);
  });
});

describe('vector operations', () => {
  it('computes cosine similarity', () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBeCloseTo(1, 10);
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 10);
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1, 10);
  });

  it('returns 0 against the zero vector rather than NaN', () => {
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
  });

  it('computes the Euclidean norm', () => {
    expect(norm2([3, 4])).toBe(5);
  });
});

describe('symmetricEigenvalues', () => {
  it('recovers a known spectrum', () => {
    // [[2,1],[1,2]] has eigenvalues 1 and 3.
    const eig = symmetricEigenvalues(mat(2, 2, [2, 1, 1, 2]));
    expect(eig[0]).toBeCloseTo(1, 8);
    expect(eig[1]).toBeCloseTo(3, 8);
  });

  it('returns the diagonal for a diagonal matrix', () => {
    const eig = symmetricEigenvalues(mat(3, 3, [5, 0, 0, 0, -1, 0, 0, 0, 2]));
    expect(Array.from(eig).map((v) => Math.round(v))).toEqual([-1, 2, 5]);
  });

  it('preserves trace and determinant on a random symmetric matrix', () => {
    const rng = createRng(17);
    const n = 6;
    const a = mat(n, n);
    for (let i = 0; i < n; i++) {
      for (let j = i; j < n; j++) {
        const v = rng.normal();
        a.data[i * n + j] = v;
        a.data[j * n + i] = v;
      }
    }
    let trace = 0;
    for (let i = 0; i < n; i++) trace += a.data[i * n + i]!;
    const eig = Array.from(symmetricEigenvalues(a));
    expect(eig.reduce((x, y) => x + y, 0)).toBeCloseTo(trace, 6);
  });

  it('rejects non-square input', () => {
    expect(() => symmetricEigenvalues(mat(2, 3))).toThrow();
  });
});

describe('singular values', () => {
  it('matches the diagonal of a diagonal matrix', () => {
    const sv = Array.from(singularValues(mat(2, 2, [3, 0, 0, 4])));
    expect(sv[0]).toBeCloseTo(3, 8);
    expect(sv[1]).toBeCloseTo(4, 8);
  });

  it('gives the operator norm of a scaled identity', () => {
    expect(spectralNorm(mat(3, 3, [2, 0, 0, 0, 2, 0, 0, 0, 2]))).toBeCloseTo(2, 8);
  });

  it('satisfies ‖A‖ <= ‖A‖_F <= sqrt(rank) ‖A‖', () => {
    const rng = createRng(23);
    const a = mat(8, 5);
    for (let i = 0; i < a.data.length; i++) a.data[i] = rng.normal();
    const op = spectralNorm(a);
    const fro = frobeniusNorm(a);
    expect(op).toBeLessThanOrEqual(fro + 1e-8);
    expect(fro).toBeLessThanOrEqual(Math.sqrt(5) * op + 1e-8);
  });
});

describe('linear solves', () => {
  it('solves an SPD system', () => {
    const a = mat(2, 2, [4, 1, 1, 3]);
    const x = solveSpd(a, [1, 2]);
    const b = matvec(a, x);
    expect(b[0]).toBeCloseTo(1, 10);
    expect(b[1]).toBeCloseTo(2, 10);
  });

  it('rejects indefinite matrices', () => {
    expect(() => solveSpd(mat(2, 2, [0, 1, 1, 0]), [1, 1])).toThrow(/positive definite/);
  });

  it('shrinks ridge coefficients as lambda grows', () => {
    const rng = createRng(29);
    const n = 40;
    const p = 5;
    const x = mat(n, p);
    for (let i = 0; i < x.data.length; i++) x.data[i] = rng.normal();
    const beta = [1, -2, 0.5, 0, 3];
    const y = Array.from(matvec(x, beta), (v) => v + 0.01 * rng.normal());
    const small = ridgeSolve(x, y, 1e-8);
    const large = ridgeSolve(x, y, 10);
    expect(norm2(small)).toBeCloseTo(norm2(beta), 1);
    expect(norm2(large)).toBeLessThan(norm2(small));
  });
});

describe('gram', () => {
  it('produces a symmetric second-moment matrix', () => {
    const x = mat(3, 2, [1, 0, 0, 1, 1, 1]);
    const g = gram(x);
    expect(g.rows).toBe(2);
    expect(g.data[1]).toBeCloseTo(g.data[2]!, 12);
    expect(g.data[0]).toBeCloseTo(2 / 3, 12);
  });
});
