import { describe, expect, it } from 'vitest';
import { allProblems, allTopics } from './content';
import { allJudgeSpecs } from './judge';
import { FIELD_SLUGS } from './taxonomy';

/**
 * The build validates all of this too, by loading the content while collecting
 * page data. These tests do it in under a second instead of fifteen, and they
 * report the failing file rather than "failed to collect page data".
 */
describe('content loads and validates', () => {
  it('parses every topic', () => {
    const topics = allTopics();
    expect(topics.length).toBeGreaterThan(0);
    for (const t of topics) {
      expect(t.frontmatter.title.length).toBeGreaterThan(0);
      expect(FIELD_SLUGS).toContain(t.field);
    }
  });

  it('parses every problem', () => {
    const problems = allProblems();
    expect(problems.length).toBeGreaterThan(0);
    for (const p of problems) {
      expect(p.statement.length).toBeGreaterThan(0);
      expect(p.solution.length).toBeGreaterThan(0);
    }
  });

  it('attaches a judge spec to every coding problem', () => {
    const judged = allJudgeSpecs();
    const unjudged = allProblems()
      .filter((p) => p.type === 'coding' && !judged.has(p.id))
      .map((p) => p.id);
    // A coding problem with no spec shows a statement and no editor, which is
    // indistinguishable from the editor being broken.
    expect(unjudged).toEqual([]);
  });
});
