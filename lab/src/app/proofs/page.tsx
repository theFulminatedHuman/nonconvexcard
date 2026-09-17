import type { Metadata } from 'next';
import { ProofBrowser, type ProofEntry } from '@/components/proofs/proof-browser';
import { PageHeader } from '@/components/ui/primitives';
import { allClaims } from '@/lib/content';
import { CLAIM_LABEL, PROVABLE_KINDS } from '@/lib/taxonomy';

export const metadata: Metadata = {
  title: 'Proof library',
  description:
    'Every theorem, lemma, proposition, definition, heuristic, empirical observation and open problem stated on the site, with its epistemic status and whether a complete proof is given.',
};

export default function ProofsPage() {
  const entries: ProofEntry[] = allClaims().map(({ claim, topicId, topicTitle, field }) => ({
    id: `${topicId}#${claim.id}`,
    title: claim.title,
    summary: claim.summary,
    kind: claim.kind,
    proved: claim.proved,
    tags: claim.tags,
    field,
    topicId,
    topicTitle,
    href: `/topics/${topicId}#${claim.id}`,
  }));

  const provable = entries.filter((e) => PROVABLE_KINDS.includes(e.kind));
  const proved = provable.filter((e) => e.proved).length;
  const notTheorems = entries.length - provable.length;

  return (
    <div className="mx-auto max-w-[84rem] px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Reference"
        title="Proof library"
        lead={
          <>
            {entries.length} statements. {provable.length} of them carry a proof obligation, and{' '}
            {proved} ({Math.round((proved / Math.max(1, provable.length)) * 100)}%) are proved in
            full on their page. The remaining {notTheorems} are definitions, heuristics, empirical
            observations, conjectures and open problems — things that are true by convention, things
            that are observed but not proven, and things nobody knows.
          </>
        }
      >
        <p className="max-w-3xl text-xs leading-relaxed text-[var(--color-ink-faint)]">
          The distinction is the point. A {CLAIM_LABEL.theorem.toLowerCase()} has a proof; a{' '}
          {CLAIM_LABEL.heuristic.toLowerCase()} is an argument that is useful and not rigorous; an{' '}
          {CLAIM_LABEL.empirical.toLowerCase()} is a measurement that has been reproduced and not
          explained. Nothing on this site presents one as another, and the filters here let you check
          that claim rather than take it on trust.
        </p>
      </PageHeader>

      <ProofBrowser entries={entries} />
    </div>
  );
}
