import type { Reference } from '@/lib/schema';
import { ExternalIcon } from '@/components/ui/icons';

const KIND_LABEL: Record<Reference['kind'], string> = {
  book: 'Book',
  paper: 'Paper',
  'lecture-notes': 'Lecture notes',
  survey: 'Survey',
  chapter: 'Chapter',
};

/**
 * Bibliography for a topic.
 *
 * References are pointers, never substitutes: nothing on this site reproduces
 * text, figures, numbering or exercises from the works listed here. Where a
 * proof follows a standard argument, the exposition is written from scratch and
 * the source is cited so a reader can go to the original treatment.
 */
export function ReferenceList({ references }: { references: Reference[] }) {
  if (references.length === 0) return null;
  return (
    <section aria-labelledby="references" className="mt-12 border-t border-[var(--color-line)] pt-6">
      <h2 id="references" className="mb-3 text-sm font-semibold tracking-wide">
        References
      </h2>
      <ul className="space-y-2.5">
        {references.map((r) => (
          <li key={r.key} className="text-[0.85rem] leading-relaxed">
            <span className="mono-label mr-2 align-middle">{KIND_LABEL[r.kind]}</span>
            <span className="font-medium">{r.authors}</span>
            {r.year ? <span className="text-[var(--color-ink-faint)]"> ({r.year})</span> : null}.{' '}
            {r.url ? (
              <a
                href={r.url}
                target="_blank"
                rel="noreferrer noopener"
                className="text-[var(--color-accent)] underline underline-offset-2"
              >
                {r.title}
                <ExternalIcon size={11} className="ml-0.5 inline-block align-baseline" />
              </a>
            ) : (
              <span className="italic">{r.title}</span>
            )}
            {r.note ? (
              <span className="block text-[var(--color-ink-faint)]">{r.note}</span>
            ) : null}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[0.75rem] leading-relaxed text-[var(--color-ink-faint)]">
        These works are cited as sources to read, not reproduced. All exposition, examples and
        problems on this site are written independently; where an argument is standard, the citation
        points to a canonical treatment.
      </p>
    </section>
  );
}
