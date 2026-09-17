import type { Metadata } from 'next';
import Link from 'next/link';
import { Chip, LinkCard, PageHeader, SectionHeading, TimeChip } from '@/components/ui/primitives';
import { EXPERIMENTS } from '@/experiments/registry';
import { FIELDS, FIELD_SLUGS } from '@/lib/taxonomy';

export const metadata: Metadata = {
  title: 'Experiments',
  description:
    'Reproducible numerical experiments: concentration, random matrices, SGD dynamics, bias–variance, kernels and embedding geometry. Every run is deterministic in its seed.',
};

export default function ExperimentsPage() {
  const fields = FIELD_SLUGS.filter((f) => EXPERIMENTS.some((e) => e.field === f));

  return (
    <div className="mx-auto max-w-[76rem] px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Practice"
        title="Numerical experiments"
        lead={`${EXPERIMENTS.length} interactive simulations. Each one states the question it answers,
          runs in your browser from a seeded generator, and says what the figure is — and is not —
          evidence for. Several exist specifically to show where a theorem's bound is loose.`}
      >
        <p className="max-w-3xl text-xs leading-relaxed text-[var(--color-ink-faint)]">
          Determinism is deliberate: the same parameters and seed reproduce the same figure on any
          machine, so a number you read off here is a number you can quote. A simulation is evidence
          about the regime you sampled. The proofs are on the topic pages.
        </p>
      </PageHeader>

      <div className="space-y-8">
        {fields.map((field) => {
          const inField = EXPERIMENTS.filter((e) => e.field === field);
          return (
            <section key={field}>
              <SectionHeading
                title={FIELDS[field].title}
                action={
                  <Link
                    href={`/topics/${field}`}
                    className="text-xs text-[var(--color-accent)] hover:underline"
                  >
                    Theory
                  </Link>
                }
              />
              <ul className="grid gap-3 sm:grid-cols-2">
                {inField.map((e) => (
                  <li key={e.id}>
                    <LinkCard href={`/experiments/${e.id}`} className="h-full p-4">
                      <p className="text-sm font-medium">{e.title}</p>
                      <p className="mt-1 text-[0.85rem] leading-snug text-[var(--color-ink-soft)]">
                        {e.summary}
                      </p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        <TimeChip time={e.estimated_time} />
                        {e.tags.slice(0, 3).map((t) => (
                          <Chip key={t} tone="quiet">
                            {t}
                          </Chip>
                        ))}
                      </div>
                    </LinkCard>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
