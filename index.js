import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { parseYaml } from './lib/yaml-parser.js';
import { validateConfig } from './lib/config.js';
import { renderDashboard, renderNotFound, renderRedirect } from './lib/generators.js';
import { resolveBasePath } from './lib/utils.js';

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, '_site');

function fail(message) {
  console.error(`\x1b[31mError:\x1b[0m ${message}`);
  process.exit(1);
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
  const site = validateConfig(config);
  const links = config.links;
  const lang = site.language;
  const basePath = resolveBasePath({ domain: site.domain, basePath: site.basePath });
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

  await writeFile(
    path.join(OUTPUT_DIR, 'index.html'),
    renderDashboard({ site, links, lang, base: basePath }),
    'utf8',
  );
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
