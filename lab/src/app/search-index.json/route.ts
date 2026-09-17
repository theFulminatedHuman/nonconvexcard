/**
 * The search corpus, emitted as a static file at `/search-index.json`.
 *
 * Generating it from a route handler rather than a separate build script keeps
 * it in the same module graph as the content loader, so the index can never
 * drift from the pages it points at.
 */
import { buildSearchIndex } from '@/lib/search-index';

export const dynamic = 'force-static';

export function GET(): Response {
  return new Response(JSON.stringify(buildSearchIndex()), {
    headers: { 'content-type': 'application/json' },
  });
}
