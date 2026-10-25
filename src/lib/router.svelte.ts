/** Hash routing, so the app works on GitHub Pages without server-side rewrites. */

export const route = $state({ path: [] as string[], query: new URLSearchParams() });

function parse(): void {
  const [path, query] = location.hash.replace(/^#/, '').split('?');
  route.path = path.split('/').filter(Boolean).map(decodeURIComponent);
  route.query = new URLSearchParams(query ?? '');
}

parse();
window.addEventListener('hashchange', () => {
  parse();
  window.scrollTo(0, 0);
});

export function go(path: string, { replace = false } = {}): void {
  if (replace) {
    history.replaceState(null, '', `#${path}`);
    parse();
  } else {
    location.hash = path;
  }
}
