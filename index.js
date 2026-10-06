import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { parseYaml } from './lib/yaml-parser.js';
import { renderDashboard, renderNotFound, renderRedirect, t } from './lib/generators.js';

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, '_site');
const HASH_PATTERN = /^[A-Za-z0-9_-]+$/;
const RESERVED_HASHES = new Set(['index.html', '404.html', 'links.js', 'CNAME', 'assets']);

function fail(message) {
  console.error(`\x1b[31mError:\x1b[0m ${message}`);
  process.exit(1);
}

function normalizeBasePath(value) {
  let base = (value || '/').trim();
  if (!base.startsWith('/')) base = `/${base}`;
  if (!base.endsWith('/')) base = `${base}/`;
  return base;
}

function validate(config) {
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

    if (typeof link.url !== 'string' || !/^https?:\/\/\S+$/.test(link.url)) {
      fail(`${label}: "url" must start with http:// or https:// (got: ${JSON.stringify(link.url)}).`);
    }

    for (const field of ['title', 'description']) {
      if (link[field] != null && typeof link[field] !== 'string') {
        fail(`${label}: "${field}" must be a string.`);
      }
    }
  });

  const topLevel = {};
  for (const key of ['title', 'description', 'language', 'report', 'domain', 'basePath']) {
    if (config[key] != null) topLevel[key] = config[key];
  }
  const site = { ...(config.site && typeof config.site === 'object' ? config.site : {}), ...topLevel };

  if (site.domain != null && !/^[a-z0-9.-]+$/i.test(site.domain)) {
    fail(`domain looks invalid: ${JSON.stringify(site.domain)}`);
  }
  site.title = String(site.title || site.domain || 'Links');
  site.language = site.language === 'en' ? 'en' : 'es';
  return site;
}

async function cleanOutput(dir) {
  try {
    await rm(dir, { recursive: true, force: true });
  } catch {
    // Directory is locked (e.g. open in Explorer): clear its contents instead.
    const entries = await readdir(dir).catch(() => []);
    for (const entry of entries) {
      await rm(path.join(dir, entry), { recursive: true, force: true }).catch(() => {});
    }
  }
  await mkdir(dir, { recursive: true });
}

async function main() {
  const raw = await readFile(path.join(ROOT, 'config.yml'), 'utf8');
  const config = parseYaml(raw);
  const site = validate(config);
  const links = config.links;
  const lang = site.language;
  const basePath = normalizeBasePath(process.env.BASE_PATH || site.basePath);
  const baseUrl = site.domain ? `https://${site.domain}/` : '';

  await cleanOutput(OUTPUT_DIR);

  for (const link of links) {
    const dir = path.join(OUTPUT_DIR, link.hash);
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, 'index.html'),
      renderRedirect({ url: link.url, hash: link.hash, lang, site }),
      'utf8',
    );
  }

  await writeFile(path.join(OUTPUT_DIR, 'index.html'), renderDashboard({ site, links, lang }), 'utf8');
  await writeFile(
    path.join(OUTPUT_DIR, '404.html'),
    renderNotFound({ site, links, lang, basePath }),
    'utf8',
  );
  await writeFile(path.join(OUTPUT_DIR, '.nojekyll'), '', 'utf8');

  if (site.domain) await writeFile(path.join(OUTPUT_DIR, 'CNAME'), `${site.domain}\n`, 'utf8');

  const preview = baseUrl || basePath;
  console.log(`\x1b[32m✓ Built ${links.length} link(s)\x1b[0m → ${path.relative(ROOT, OUTPUT_DIR)}/`);
  for (const link of links) {
    console.log(`  ${preview}${link.hash}/  →  ${link.url}`);
  }
}

main().catch((error) => fail(error.message));
