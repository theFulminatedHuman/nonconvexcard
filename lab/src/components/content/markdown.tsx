/**
 * Renders pre-compiled Markdown.
 *
 * The HTML comes from `renderMarkdown`, which runs at build time over content
 * committed to this repository. There is no user input anywhere in this path
 * and the pipeline does not allow raw HTML through, so the injection here is
 * inert — it is the standard way to mount a build-time-compiled document.
 */
export function Markdown({ html, className = 'prose-tight' }: { html: string; className?: string }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
