/**
 * The deployment sub-path, mirrored from `next.config.mjs`.
 *
 * `next/link` and `next/image` prepend `basePath` automatically, but raw
 * `fetch` calls to files in `public/` do not, so those must go through here.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export function asset(path: string): string {
  return `${BASE_PATH}${path.startsWith('/') ? path : `/${path}`}`;
}
