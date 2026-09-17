/** Navigation model derived from content at build time. */
import { allTopics, populatedFields } from './content';
import { FIELDS, type FieldGroup, type FieldSlug, type Level } from './taxonomy';

export interface NavTopic {
  id: string;
  href: string;
  title: string;
  level: Level;
}

export interface NavField {
  slug: FieldSlug;
  title: string;
  short: string;
  group: FieldGroup;
  href: string;
  topics: NavTopic[];
}

export function buildFieldNav(): NavField[] {
  const topics = allTopics();
  return populatedFields().map((slug) => {
    const meta = FIELDS[slug];
    return {
      slug,
      title: meta.title,
      short: meta.short,
      group: meta.group,
      href: `/topics/${slug}`,
      topics: topics
        .filter((t) => t.field === slug)
        .map((t) => ({
          id: t.id,
          href: `/topics/${t.field}/${t.slug}`,
          title: t.frontmatter.title,
          level: t.frontmatter.level as Level,
        })),
    };
  });
}
