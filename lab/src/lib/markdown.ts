/**
 * Markdown rendering for content that is *not* MDX.
 *
 * Problem statements, hints and solutions come from YAML, where they are
 * authored as ordinary Markdown with LaTeX. Running them through the MDX
 * compiler would subject mathematical prose to JSX parsing — a set such as
 * `{convex, smooth}` written in running text becomes a JavaScript expression
 * and fails the build. They therefore get their own pipeline: the same GFM,
 * math and KaTeX plugins as the MDX route, without JSX.
 */
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { katexOptions } from './katex-options';

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkRehype)
  .use(rehypeKatex, katexOptions)
  .use(rehypeStringify);

/**
 * Compiles Markdown + LaTeX to an HTML string.
 *
 * The output is injected with `dangerouslySetInnerHTML`, which is safe here and
 * only here: the input is repository content compiled at build time, never user
 * input, and the pipeline does not enable raw HTML passthrough.
 */
export async function renderMarkdown(source: string): Promise<string> {
  const file = await processor.process(source);
  return String(file);
}
