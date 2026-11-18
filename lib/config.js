const HASH_PATTERN = /^[A-Za-z0-9_-]+$/;
const RESERVED_HASHES = new Set(['index.html', '404.html', 'links.js', 'CNAME', 'assets']);
const HTTP_URL_PATTERN = /^https?:\/\/\S+$/;

function fail(message) {
  throw new Error(message);
}

function validateUrl(value, label) {
  if (typeof value !== 'string' || !HTTP_URL_PATTERN.test(value)) {
    fail(`${label} must start with http:// or https:// (got: ${JSON.stringify(value)}).`);
  }
}

export function validateConfig(config) {
  if (!config || typeof config !== 'object') fail('config.yml is empty or invalid.');
  const links = config.links;
  if (!Array.isArray(links) || links.length === 0) fail('config.yml must define at least one link under "links:".');

  const seen = new Set();
  links.forEach((link, index) => {
    const label = `links[${index}]`;
    if (!link || typeof link !== 'object') fail(`${label} must be a map with "hash" and "url".`);

    if (typeof link.hash !== 'string' || !HASH_PATTERN.test(link.hash)) {
      fail(`${label}: "hash" must match ${HASH_PATTERN} (got: ${JSON.stringify(link.hash)}).`);
    }
    if (RESERVED_HASHES.has(link.hash)) fail(`${label}: "${link.hash}" is a reserved name.`);
    if (seen.has(link.hash)) fail(`${label}: duplicate hash "${link.hash}".`);
    seen.add(link.hash);

    validateUrl(link.url, `${label}: "url"`);

    for (const field of ['title', 'description']) {
      if (link[field] != null && typeof link[field] !== 'string') {
        fail(`${label}: "${field}" must be a string.`);
      }
    }
  });

  const topLevel = {};
  for (const key of ['title', 'description', 'language', 'report', 'domain', 'basePath', 'analytics']) {
    if (config[key] != null) topLevel[key] = config[key];
  }
  const site = { ...(config.site && typeof config.site === 'object' ? config.site : {}), ...topLevel };

  if (site.domain != null && !/^[a-z0-9.-]+$/i.test(site.domain)) {
    fail(`domain looks invalid: ${JSON.stringify(site.domain)}`);
  }
  if (site.report != null) validateUrl(site.report, '"report"');
  if (site.analytics != null) validateUrl(site.analytics, '"analytics"');
  site.title = String(site.title || site.domain || 'Links');
  site.language = site.language === 'en' ? 'en' : 'es';
  return site;
}
