/**
 * The judge: starter code and test cases for coding problems.
 *
 * Specs live in `content/judge/<problem-id>.yaml` rather than inside the
 * problem files, so a problem's prose and its test cases can be edited
 * independently and a problem without a judge stays exactly as it was.
 *
 * Tests are plain Python that raises on failure — an `assert`, usually. That is
 * deliberately more flexible than an input/expected-output table, because most
 * of these problems check numerical properties (a rate, a tolerance, a
 * distribution) rather than exact returned values.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';
import { validateJudgeSpecs } from './content';
import { formatIssue } from './schema';

export const judgeTestSchema = z.object({
  /** Shown in the verdict table; describes what the case checks. */
  name: z.string().min(1),
  /** Python evaluated against the submission's namespace. Raises to fail. */
  code: z.string().min(1),
  /** Cases marked hidden still run; their code is not shown before a first run. */
  hidden: z.boolean().default(false),
});

export const judgeSpecSchema = z.object({
  /** Problem id this attaches to. */
  problem: z.string().min(1),
  /** Code the editor opens with — signatures and docstrings, never a solution. */
  starter: z.string().min(1),
  /** Runs before the submission: shared imports or fixtures. */
  preamble: z.string().optional(),
  tests: z.array(judgeTestSchema).min(1),
  /** Seconds before the run is abandoned as non-terminating. */
  timeout_seconds: z.number().int().min(1).max(120).default(30),
});

export type JudgeTest = z.infer<typeof judgeTestSchema>;
export type JudgeSpec = z.infer<typeof judgeSpecSchema>;

const JUDGE_ROOT = path.join(process.cwd(), 'content', 'judge');

let cache: Map<string, JudgeSpec> | null = null;

/** Every judge spec, keyed by problem id. Validated at build time. */
export function allJudgeSpecs(): Map<string, JudgeSpec> {
  if (cache) return cache;
  const specs = new Map<string, JudgeSpec>();
  if (!fs.existsSync(JUDGE_ROOT)) {
    cache = specs;
    return specs;
  }

  for (const entry of fs.readdirSync(JUDGE_ROOT).sort()) {
    if (!entry.endsWith('.yaml')) continue;
    const file = path.join(JUDGE_ROOT, entry);
    const parsed = judgeSpecSchema.safeParse(parseYaml(fs.readFileSync(file, 'utf8')));
    if (!parsed.success) throw new Error(formatIssue(file, parsed.error));

    const expected = `${parsed.data.problem}.yaml`;
    if (entry !== expected) {
      throw new Error(
        `Judge spec ${file} declares problem "${parsed.data.problem}" but is named "${entry}"; expected "${expected}".`,
      );
    }
    if (specs.has(parsed.data.problem)) {
      throw new Error(`Duplicate judge spec for problem "${parsed.data.problem}".`);
    }
    specs.set(parsed.data.problem, parsed.data);
  }

  validateJudgeSpecs(specs.keys());
  cache = specs;
  return specs;
}

export function getJudgeSpec(problemId: string): JudgeSpec | undefined {
  return allJudgeSpecs().get(problemId);
}

/** Number of coding problems that have a runnable judge, for the listing copy. */
export function judgeCount(): number {
  return allJudgeSpecs().size;
}
