export function normalizeBasePath(value) {
  let base = String(value ?? '/').trim() || '/';
  if (!base.startsWith('/')) base = `/${base}`;
  if (!base.endsWith('/')) base = `${base}/`;
  return base;
}

/**
 * Where is the site served from?
 * - Custom domain (site.domain): root of the domain → "/"
 * - GitHub user/organization page (owner.github.io): "/"
 * - Project page: "/{repository}/"
 * - env BASE_PATH always wins.
 */
export function resolveBasePath({ domain, basePath, env = process.env } = {}) {
  if (env.BASE_PATH) return normalizeBasePath(env.BASE_PATH);
  if (basePath) return normalizeBasePath(basePath);
  if (domain) return '/';

  const repo = String(env.GITHUB_REPOSITORY || '').split('/')[1] || '';
  if (!repo) return '/';
  return repo.toLowerCase().endsWith('.github.io') ? '/' : `/${repo}/`;
}
