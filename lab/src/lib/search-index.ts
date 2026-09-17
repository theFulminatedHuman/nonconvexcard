/** Build-time construction of the search corpus. Server-only. */
import { allClaims, allPapers, allProblems, allTopics, populatedFields } from './content';
import { EXPERIMENTS } from '@/experiments/registry';
import { normalise, type SearchDoc } from './search';
import { PRIMARY_NAV } from './site';
import { CLAIM_LABEL, DIFFICULTY_LABEL, FIELDS, PROBLEM_TYPE_LABEL } from './taxonomy';

export function buildSearchIndex(): SearchDoc[] {
  const docs: SearchDoc[] = [];

  for (const t of allTopics()) {
    const f = FIELDS[t.field];
    docs.push({
      id: `topic:${t.id}`,
      kind: 'topic',
      title: t.frontmatter.title,
      subtitle: t.frontmatter.summary,
      href: `/topics/${t.field}/${t.slug}`,
      field: t.field,
      badge: f.short,
      keywords: normalise(
        [
          t.frontmatter.summary,
          f.title,
          ...t.frontmatter.tags,
          ...t.headings.map((h) => h.text),
        ].join(' '),
      ),
    });
  }

  for (const { claim, topicId, topicTitle, field } of allClaims()) {
    docs.push({
      id: `claim:${topicId}#${claim.id}`,
      kind: 'claim',
      title: claim.title,
      subtitle: `${CLAIM_LABEL[claim.kind]} — ${topicTitle}`,
      href: `/topics/${topicId}#${claim.id}`,
      field,
      badge: CLAIM_LABEL[claim.kind],
      keywords: normalise([claim.summary, ...claim.tags, CLAIM_LABEL[claim.kind]].join(' ')),
    });
  }

  for (const p of allProblems()) {
    docs.push({
      id: `problem:${p.id}`,
      kind: 'problem',
      title: p.title,
      subtitle: `${PROBLEM_TYPE_LABEL[p.type]} · ${FIELDS[p.field].short}`,
      href: `/problems/${p.id}`,
      field: p.field,
      badge: DIFFICULTY_LABEL[p.difficulty],
      keywords: normalise([...p.tags, p.statement.slice(0, 400), FIELDS[p.field].title].join(' ')),
    });
  }

  for (const p of allPapers()) {
    docs.push({
      id: `paper:${p.id}`,
      kind: 'paper',
      title: p.frontmatter.title,
      subtitle: `${p.frontmatter.authors} (${p.frontmatter.year})`,
      href: `/papers/${p.id}`,
      field: p.frontmatter.field,
      badge: String(p.frontmatter.year),
      keywords: normalise(
        [p.frontmatter.problem, p.frontmatter.contribution, ...p.frontmatter.tags].join(' '),
      ),
    });
  }

  for (const e of EXPERIMENTS) {
    docs.push({
      id: `experiment:${e.id}`,
      kind: 'experiment',
      title: e.title,
      subtitle: e.summary,
      href: `/experiments/${e.id}`,
      field: e.field,
      badge: 'Experiment',
      keywords: normalise([e.summary, e.question, ...e.tags].join(' ')),
    });
  }

  for (const section of PRIMARY_NAV) {
    for (const item of section.items) {
      docs.push({
        id: `page:${item.href}`,
        kind: 'page',
        title: item.label,
        subtitle: item.hint ?? section.label,
        href: item.href,
        badge: 'Page',
        keywords: normalise([section.label, item.hint ?? ''].join(' ')),
      });
    }
  }

  for (const slug of populatedFields()) {
    const f = FIELDS[slug];
    docs.push({
      id: `page:field:${slug}`,
      kind: 'page',
      title: f.title,
      subtitle: f.blurb,
      href: `/topics/${slug}`,
      field: slug,
      badge: 'Field',
      keywords: normalise(`${f.blurb} ${f.short} ${f.group}`),
    });
  }

  return docs;
}
