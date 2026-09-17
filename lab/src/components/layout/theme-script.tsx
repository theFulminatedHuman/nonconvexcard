/**
 * Applies the stored theme and reading mode before first paint.
 *
 * This runs as a blocking inline script so that the page never renders with the
 * wrong theme and then corrects itself. It is intentionally dependency-free and
 * defensive: private browsing modes can make `localStorage` throw.
 */
const script = `
(function () {
  try {
    var pref = localStorage.getItem('lab:theme') || 'system';
    var dark = pref === 'dark' ||
      (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    if (localStorage.getItem('lab:research-mode') === '1') {
      document.documentElement.setAttribute('data-research', '1');
    }
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} suppressHydrationWarning />;
}
