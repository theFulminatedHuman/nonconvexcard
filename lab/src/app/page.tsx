import Link from 'next/link';
import { ProblemRow } from '@/components/problems/problem-row';
import { ArrowRightIcon, FlaskIcon } from '@/components/ui/icons';
import {
  Card,
  Chip,
  ClaimChip,
  LinkCard,
  SectionHeading,
} from '@/components/ui/primitives';
import { EXPERIMENTS } from '@/experiments/registry';
import { allClaims, allPapers, allTopics, populatedFields, siteStats } from '@/lib/content';
import { buildProblemIndex } from '@/lib/problem-index';
import { SITE } from '@/lib/site';
import { CLAIM_LABEL, FIELDS, FIELD_GROUPS, LEVEL_SHORT } from '@/lib/taxonomy';

/**
 * The topic pipeline, stated once. Every topic page follows it, in this order.
 */
const PIPELINE = [
  ['Intuition', 'What the result says before any notation.'],
  ['Definitions', 'Stated precisely, with the quantifiers in the right order.'],
  ['Formulation', 'The object of study, written down.'],
  ['Theorems', 'With every hypothesis spelled out.'],
  ['Proofs', 'Complete, folded by default so you can try first.'],
  ['Derivations', 'Step by step, with the reason for each step.'],
  ['Examples', 'Worked, including ones where the hypotheses fail.'],
  ['Experiment', 'A seeded simulation you can rerun.'],
  ['Code', 'The algorithm, implemented.'],
  ['Problems', 'With hints and full solutions.'],
  ['Papers', 'Where this mathematics is actually used.'],
  ['Research', 'What is open, stated as open.'],
] as const;

/** The epistemic vocabulary, shown on the home page because it is the editorial rule. */
const EPISTEMICS = [
  ['theorem', 'Proved here, or proved in a cited source and marked as such.'],
  ['heuristic', 'An argument that is useful and is not a proof.'],
  ['empirical', 'A measurement that has been reproduced and not explained.'],
  ['conjecture', 'Believed, with reasons given, and unproved.'],
  ['open-problem', 'Nobody knows. Stated so you can see the edge.'],
] as const;

export default function Home() {
  const stats = siteStats();
  const fields = populatedFields();
  const topics = allTopics();
  const problems = buildProblemIndex();

  const featuredClaim = allClaims().find(
    (c) => c.claim.id === 'johnson-lindenstrauss' || c.claim.kind === 'theorem',
  );
  const featuredProblems = problems.filter((p) => p.abyss).slice(0, 3);
  const featuredExperiment = EXPERIMENTS[0];
  const recentPapers = allPapers().slice(0, 4);

  const counters = [
    { value: stats.topics, label: 'topics', href: '/topics' },
    { value: stats.claims, label: 'stated results', href: '/proofs' },
    { value: stats.proofs, label: 'with complete proofs', href: '/proofs' },
    { value: stats.problems, label: 'problems', href: '/problems' },
    { value: stats.abyss, label: 'in The Abyss', href: '/abyss' },
    { value: EXPERIMENTS.length, label: 'experiments', href: '/experiments' },
    { value: stats.papers, label: 'papers', href: '/papers' },
    { value: stats.fields, label: 'fields', href: '/topics' },
  ];

  return (
    <div>
      <section className="grid-field border-b border-[var(--color-line)]">
        <div className="mx-auto max-w-[76rem] px-4 py-14 sm:px-6 sm:py-20">
          <p className="mono-label mb-3">Mathematical laboratory</p>
          <h1 className="max-w-4xl text-[2rem] leading-[1.1] font-semibold tracking-[-0.03em] text-balance sm:text-[2.75rem]">
            {SITE.name}
          </h1>
          <p className="mt-4 max-w-2xl text-[1.02rem] leading-relaxed text-[var(--color-ink-soft)]">
            {SITE.tagline}
          </p>
          <p className="mt-3 max-w-2xl text-[0.92rem] leading-relaxed text-[var(--color-ink-faint)]">
            Theory with the hypotheses stated, proofs you can fold away until you have tried, seeded
            simulations you can rerun, and a problem database that goes past the point where the
            answers are known.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/learn"
              className="inline-flex items-center gap-2 rounded bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Start the learning path
              <ArrowRightIcon size={14} />
            </Link>
            <Link
              href="/problems"
              className="inline-flex items-center gap-2 rounded border border-[var(--color-line-strong)] px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--color-elevated)]"
            >
              {stats.problems} problems
            </Link>
            <Link
              href="/daily"
              className="text-sm font-medium text-[var(--color-accent)] hover:underline"
            >
              Today’s four problems →
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="mx-auto grid max-w-[76rem] grid-cols-2 divide-x divide-y divide-[var(--color-line)] sm:grid-cols-4 lg:grid-cols-8 lg:divide-y-0">
          {counters.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className="px-4 py-4 transition-colors hover:bg-[var(--color-elevated)]"
            >
              <div className="font-mono text-xl tabular-nums">{c.value}</div>
              <div className="mt-0.5 text-[11px] leading-snug text-[var(--color-ink-faint)]">
                {c.label}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-[76rem] space-y-14 px-4 py-12 sm:px-6">
        <section>
          <SectionHeading title="How every topic is built" />
          <p className="mb-4 max-w-3xl text-[0.9rem] leading-relaxed text-[var(--color-ink-soft)]">
            The same twelve movements, in the same order, on every page. You always know where the
            proof is, and you always know whether there is one.
          </p>
          <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {PIPELINE.map(([name, blurb], i) => (
              <li
                key={name}
                className="flex gap-2.5 rounded border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2"
              >
                <span className="mono-label mt-0.5 w-5 shrink-0 tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0">
                  <span className="block text-[0.85rem] font-medium">{name}</span>
                  <span className="block text-[0.78rem] leading-snug text-[var(--color-ink-faint)]">
                    {blurb}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <SectionHeading
            title="Every claim carries its status"
            action={
              <Link href="/proofs" className="text-xs text-[var(--color-accent)] hover:underline">
                Proof library
              </Link>
            }
          />
          <p className="mb-4 max-w-3xl text-[0.9rem] leading-relaxed text-[var(--color-ink-soft)]">
            The most common failure in writing about machine learning is presenting an empirical
            regularity in the grammar of a theorem. Nothing here does that. “SGD converges” is never
            written; “under assumptions A, B and C, SGD satisfies X” is, with A, B and C stated.
          </p>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {EPISTEMICS.map(([kind, meaning]) => (
              <li key={kind} className="rounded border border-[var(--color-line)] px-3 py-2.5">
                <ClaimChip kind={kind} />
                <p className="mt-1.5 text-[0.82rem] leading-snug text-[var(--color-ink-soft)]">
                  {meaning}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-[var(--color-ink-faint)]">
            {stats.proofs} of the {stats.claims} results stated on this site are proved in full on
            their page; the rest are definitions, or are labelled with one of the statuses above.
          </p>
        </section>

        <section>
          <SectionHeading
            title="Fields"
            action={
              <Link href="/topics" className="text-xs text-[var(--color-accent)] hover:underline">
                All {stats.topics} topics
              </Link>
            }
          />
          <div className="space-y-6">
            {FIELD_GROUPS.map((group) => {
              const inGroup = fields.filter((f) => FIELDS[f].group === group);
              if (inGroup.length === 0) return null;
              return (
                <div key={group}>
                  <p className="mono-label mb-2">{group}</p>
                  <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {inGroup.map((slug) => {
                      const meta = FIELDS[slug];
                      const n = topics.filter((t) => t.field === slug).length;
                      return (
                        <li key={slug}>
                          <LinkCard href={`/topics/${slug}`} className="h-full p-3.5">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="text-sm font-medium">{meta.title}</span>
                              <span className="mono-label shrink-0 tabular-nums">{n}</span>
                            </div>
                            <p className="mt-1 text-[0.8rem] leading-snug text-[var(--color-ink-faint)]">
                              {meta.blurb}
                            </p>
                          </LinkCard>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          {featuredClaim ? (
            <div>
              <SectionHeading title="A result, as it appears here" />
              <Card className="p-4">
                <ClaimChip kind={featuredClaim.claim.kind} />
                <h3 className="mt-2 text-sm font-semibold">{featuredClaim.claim.title}</h3>
                <p className="mt-1 text-[0.85rem] leading-relaxed text-[var(--color-ink-soft)]">
                  {featuredClaim.claim.summary}
                </p>
                <p className="mt-2.5 text-xs">
                  <Link
                    href={`/topics/${featuredClaim.topicId}#${featuredClaim.claim.id}`}
                    className="text-[var(--color-accent)] hover:underline"
                  >
                    {featuredClaim.topicTitle}
                  </Link>{' '}
                  <span className="text-[var(--color-ink-faint)]">
                    · {CLAIM_LABEL[featuredClaim.claim.kind]}
                    {featuredClaim.claim.proved ? ' · proof included' : ''}
                  </span>
                </p>
              </Card>
            </div>
          ) : null}

          {featuredExperiment ? (
            <div>
              <SectionHeading title="An experiment" />
              <LinkCard href={`/experiments/${featuredExperiment.id}`} className="block p-4">
                <div className="flex items-start gap-2.5">
                  <FlaskIcon size={16} className="mt-0.5 shrink-0 text-[var(--color-accent)]" />
                  <div>
                    <h3 className="text-sm font-semibold">{featuredExperiment.title}</h3>
                    <p className="mt-1 text-[0.85rem] leading-relaxed text-[var(--color-ink-soft)]">
                      {featuredExperiment.question}
                    </p>
                  </div>
                </div>
              </LinkCard>
            </div>
          ) : null}
        </section>

        {featuredProblems.length > 0 ? (
          <section>
            <SectionHeading
              title="From The Abyss"
              action={
                <Link href="/abyss" className="text-xs text-[var(--color-accent)] hover:underline">
                  All {stats.abyss}
                </Link>
              }
            />
            <Card>
              <ul className="divide-y divide-[var(--color-line)]">
                {featuredProblems.map((p) => (
                  <li key={p.id}>
                    <ProblemRow problem={p} />
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        ) : null}

        <section>
          <SectionHeading
            title="Papers, broken down by the mathematics they use"
            action={
              <Link href="/papers" className="text-xs text-[var(--color-accent)] hover:underline">
                All {stats.papers}
              </Link>
            }
          />
          <ul className="grid gap-3 sm:grid-cols-2">
            {recentPapers.map((p) => (
              <li key={p.id}>
                <LinkCard href={`/papers/${p.id}`} className="h-full p-3.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium">{p.frontmatter.title}</span>
                    <span className="mono-label shrink-0 tabular-nums">{p.frontmatter.year}</span>
                  </div>
                  <p className="mt-1 text-[0.8rem] leading-snug text-[var(--color-ink-soft)]">
                    {p.frontmatter.contribution}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Chip tone="quiet">{FIELDS[p.frontmatter.field].short}</Chip>
                    {p.frontmatter.prerequisites.slice(0, 1).map((pre) => {
                      const t = topics.find((x) => x.id === pre);
                      return t ? (
                        <Chip key={pre} tone="quiet">
                          needs {LEVEL_SHORT[t.frontmatter.level]}
                        </Chip>
                      ) : null;
                    })}
                  </div>
                </LinkCard>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
          <p className="mono-label mb-2">On sources and honesty</p>
          <p className="max-w-3xl text-[0.88rem] leading-relaxed text-[var(--color-ink-soft)]">
            The exposition, examples and problems here are original. Standard references — Vershynin’s{' '}
            <em>High-Dimensional Probability</em>, Boyd and Vandenberghe, Shalev-Shwartz and
            Ben-David, Wainwright, and the cited papers — are named where a result is standard, and
            none of them is reproduced. Where a proof is omitted, the page says so and points at a
            source rather than gesturing. Where nothing is known, the page says that too.
          </p>
          <p className="mt-2.5 max-w-3xl text-[0.82rem] leading-relaxed text-[var(--color-ink-faint)]">
            Your progress is stored only in this browser: there is no account, no server and no
            analytics. The whole site is a static export, so there is nowhere for your data to go.
          </p>
        </section>
      </div>
    </div>
  );
}
