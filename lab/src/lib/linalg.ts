/**
 * Dense linear algebra on flat row-major arrays.
 *
 * Deliberately small: the experiments need matrix products, symmetric
 * eigenvalues, singular values and a least-squares solve on matrices of at most
 * a few hundred rows, all in the browser. Bringing in a full BLAS would cost
 * more than it buys at that size.
 */

export interface Matrix {
  readonly rows: number;
  readonly cols: number;
  readonly data: Float64Array; // row-major, length rows * cols
}

export function mat(rows: number, cols: number, data?: Float64Array | number[]): Matrix {
  const buf =
    data instanceof Float64Array
      ? data
      : data === undefined
        ? new Float64Array(rows * cols)
        : Float64Array.from(data);
  if (buf.length !== rows * cols) {
    throw new Error(`matrix data length ${buf.length} does not match ${rows}x${cols}`);
  }
  return { rows, cols, data: buf };
}

export function at(m: Matrix, i: number, j: number): number {
  return m.data[i * m.cols + j]!;
}

export function set(m: Matrix, i: number, j: number, v: number): void {
  m.data[i * m.cols + j] = v;
}

export function identity(n: number): Matrix {
  const m = mat(n, n);
  for (let i = 0; i < n; i++) set(m, i, i, 1);
  return m;
}

export function transpose(a: Matrix): Matrix {
  const out = mat(a.cols, a.rows);
  for (let i = 0; i < a.rows; i++) {
    for (let j = 0; j < a.cols; j++) set(out, j, i, at(a, i, j));
  }
  return out;
}

export function matmul(a: Matrix, b: Matrix): Matrix {
  if (a.cols !== b.rows) throw new Error(`shape mismatch: ${a.rows}x${a.cols} times ${b.rows}x${b.cols}`);
  const out = mat(a.rows, b.cols);
  for (let i = 0; i < a.rows; i++) {
    for (let k = 0; k < a.cols; k++) {
      const aik = at(a, i, k);
      if (aik === 0) continue;
      const rowB = k * b.cols;
      const rowO = i * b.cols;
      for (let j = 0; j < b.cols; j++) {
        out.data[rowO + j] = out.data[rowO + j]! + aik * b.data[rowB + j]!;
      }
    }
  }
  return out;
}

export function matvec(a: Matrix, x: Vec): Float64Array {
  const out = new Float64Array(a.rows);
  for (let i = 0; i < a.rows; i++) {
    let s = 0;
    for (let j = 0; j < a.cols; j++) s += at(a, i, j) * x[j]!;
    out[i] = s;
  }
  return out;
}

export type Vec = ArrayLike<number>;

export function dot(x: Vec, y: Vec): number {
  let s = 0;
  for (let i = 0; i < x.length; i++) s += x[i]! * y[i]!;
  return s;
}

export function norm2(x: Vec): number {
  return Math.sqrt(dot(x, x));
}

export function scale(x: Vec, c: number): Float64Array {
  const out = new Float64Array(x.length);
  for (let i = 0; i < x.length; i++) out[i] = c * x[i]!;
  return out;
}

export function axpy(a: number, x: Vec, y: Vec): Float64Array {
  const out = new Float64Array(y.length);
  for (let i = 0; i < y.length; i++) out[i] = a * x[i]! + y[i]!;
  return out;
}

export function sub(x: Vec, y: Vec): Float64Array {
  const out = new Float64Array(x.length);
  for (let i = 0; i < x.length; i++) out[i] = x[i]! - y[i]!;
  return out;
}

export function cosineSimilarity(x: Vec, y: Vec): number {
  const nx = norm2(x);
  const ny = norm2(y);
  if (nx === 0 || ny === 0) return 0;
  return dot(x, y) / (nx * ny);
}

/** (1/n) XᵀX — the empirical second-moment matrix of the rows of X. */
export function gram(x: Matrix): Matrix {
  const p = x.cols;
  const n = x.rows;
  const out = mat(p, p);
  for (let i = 0; i < n; i++) {
    const row = i * p;
    for (let a = 0; a < p; a++) {
      const xa = x.data[row + a]!;
      if (xa === 0) continue;
      for (let b = a; b < p; b++) {
        out.data[a * p + b] = out.data[a * p + b]! + xa * x.data[row + b]!;
      }
    }
  }
  for (let a = 0; a < p; a++) {
    for (let b = a; b < p; b++) {
      const v = out.data[a * p + b]! / n;
      out.data[a * p + b] = v;
      out.data[b * p + a] = v;
    }
  }
  return out;
}

/**
 * Eigenvalues of a real symmetric matrix by the cyclic Jacobi method, returned
 * in ascending order. Jacobi is chosen over a QR implementation because it is
 * short, numerically robust for symmetric input, and fast enough for the
 * p ≲ 400 matrices used in the spectral experiments.
 */
export function symmetricEigenvalues(input: Matrix, sweeps = 60, tol = 1e-10): Float64Array {
  if (input.rows !== input.cols) throw new Error('symmetricEigenvalues requires a square matrix');
  const n = input.rows;
  const a = Float64Array.from(input.data);
  const idx = (i: number, j: number) => i * n + j;

  for (let sweep = 0; sweep < sweeps; sweep++) {
    let off = 0;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) off += a[idx(i, j)]! * a[idx(i, j)]!;
    }
    if (Math.sqrt(2 * off) < tol) break;

    for (let p = 0; p < n - 1; p++) {
      for (let q = p + 1; q < n; q++) {
        const apq = a[idx(p, q)]!;
        if (Math.abs(apq) < 1e-15) continue;
        const app = a[idx(p, p)]!;
        const aqq = a[idx(q, q)]!;
        const theta = (aqq - app) / (2 * apq);
        const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(t * t + 1);
        const s = t * c;
        for (let k = 0; k < n; k++) {
          const akp = a[idx(k, p)]!;
          const akq = a[idx(k, q)]!;
          a[idx(k, p)] = c * akp - s * akq;
          a[idx(k, q)] = s * akp + c * akq;
        }
        for (let k = 0; k < n; k++) {
          const apk = a[idx(p, k)]!;
          const aqk = a[idx(q, k)]!;
          a[idx(p, k)] = c * apk - s * aqk;
          a[idx(q, k)] = s * apk + c * aqk;
        }
      }
    }
  }

  const eig = new Float64Array(n);
  for (let i = 0; i < n; i++) eig[i] = a[idx(i, i)]!;
  return eig.sort();
}

/**
 * Singular values of `a`, ascending. Computed as the square roots of the
 * eigenvalues of the smaller of AᵀA and AAᵀ, which is adequate for the
 * spectral-norm experiments (it loses accuracy on singular values far below
 * √eps · σ_max, which those experiments do not inspect).
 */
export function singularValues(a: Matrix): Float64Array {
  const useAtA = a.cols <= a.rows;
  const m = useAtA ? matmul(transpose(a), a) : matmul(a, transpose(a));
  const eig = symmetricEigenvalues(m);
  const out = new Float64Array(eig.length);
  for (let i = 0; i < eig.length; i++) out[i] = Math.sqrt(Math.max(0, eig[i]!));
  return out;
}

/** Largest singular value, i.e. the operator norm ‖A‖. */
export function spectralNorm(a: Matrix): number {
  const sv = singularValues(a);
  return sv[sv.length - 1] ?? 0;
}

export function frobeniusNorm(a: Matrix): number {
  let s = 0;
  for (let i = 0; i < a.data.length; i++) s += a.data[i]! * a.data[i]!;
  return Math.sqrt(s);
}

/**
 * Solves the symmetric positive-definite system `A x = b` by Cholesky.
 * Throws when `A` is not numerically positive definite — callers that want a
 * regularised solve should add the ridge term before calling.
 */
export function solveSpd(a: Matrix, b: Vec): Float64Array {
  const n = a.rows;
  if (a.cols !== n) throw new Error('solveSpd requires a square matrix');
  const l = new Float64Array(n * n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let s = at(a, i, j);
      for (let k = 0; k < j; k++) s -= l[i * n + k]! * l[j * n + k]!;
      if (i === j) {
        if (s <= 0) throw new Error('solveSpd: matrix is not positive definite');
        l[i * n + j] = Math.sqrt(s);
      } else {
        l[i * n + j] = s / l[j * n + j]!;
      }
    }
  }
  const y = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let s = b[i]!;
    for (let k = 0; k < i; k++) s -= l[i * n + k]! * y[k]!;
    y[i] = s / l[i * n + i]!;
  }
  const x = new Float64Array(n);
  for (let i = n - 1; i >= 0; i--) {
    let s = y[i]!;
    for (let k = i + 1; k < n; k++) s -= l[k * n + i]! * x[k]!;
    x[i] = s / l[i * n + i]!;
  }
  return x;
}

/**
 * Ridge regression coefficients `(XᵀX + n·λ·I)⁻¹ Xᵀy`.
 * The `n·λ` scaling matches the convention `min (1/n)‖y − Xβ‖² + λ‖β‖²`.
 */
export function ridgeSolve(x: Matrix, y: Vec, lambda: number): Float64Array {
  const xt = transpose(x);
  const xtx = matmul(xt, x);
  for (let i = 0; i < xtx.rows; i++) {
    set(xtx, i, i, at(xtx, i, i) + lambda * x.rows);
  }
  return solveSpd(xtx, matvec(xt, y));
}
