import test from 'node:test';
import assert from 'node:assert/strict';
import { parseYaml } from './lib/yaml-parser.js';
import { renderDashboard } from './lib/generators.js';
import { normalizeBasePath, resolveBasePath } from './lib/utils.js';

test('parses nested maps, lists of maps and scalars', () => {
  const yaml = `
# comment
site:
  title: "mislinks"
  language: es
  # inline comment
  domain: links.example.com
  active: true
  limit: 10

links:
  - hash: gh
    url: https://github.com/salteadorneo/status
    title: "Status Monitor"
    description: Status page template
  - hash: blog
    url: https://example.com/blog
`;
  const config = parseYaml(yaml);
  assert.equal(config.site.title, 'mislinks');
  assert.equal(config.site.language, 'es');
  assert.equal(config.site.domain, 'links.example.com');
  assert.equal(config.site.active, true);
  assert.equal(config.site.limit, 10);
  assert.equal(config.links.length, 2);
  assert.deepEqual(config.links[0], {
    hash: 'gh',
    url: 'https://github.com/salteadorneo/status',
    title: 'Status Monitor',
    description: 'Status page template',
  });
  assert.equal(config.links[1].url, 'https://example.com/blog');
});

test('keeps colons inside URLs and strips inline comments', () => {
  const config = parseYaml(`
links:
  - hash: a
    url: https://example.com/path?q=1 # tracking
`);
  assert.equal(config.links[0].url, 'https://example.com/path?q=1');
});

test('parses literal blocks and empty config', () => {
  const config = parseYaml('site:\n  note: |\n    line one\n    line two\n');
  assert.equal(config.site.note, 'line one\nline two');
  assert.deepEqual(parseYaml('# only comments\n'), {});
});

test('resolves the base path for every hosting mode', () => {
  assert.equal(resolveBasePath({ env: { GITHUB_REPOSITORY: 'user/links' } }), '/links/');
  assert.equal(resolveBasePath({ env: { GITHUB_REPOSITORY: 'user/user.github.io' } }), '/');
  assert.equal(resolveBasePath({ domain: 'links.example.com', env: {} }), '/');
  assert.equal(resolveBasePath({ basePath: 'go', env: {} }), '/go/');
  assert.equal(resolveBasePath({ env: { BASE_PATH: 'custom/', GITHUB_REPOSITORY: 'user/links' } }), '/custom/');
  assert.equal(resolveBasePath({ env: {} }), '/');
  assert.equal(normalizeBasePath('/a/b'), '/a/b/');
});

test('renders a QR code for each short link using the deployment base path', () => {
  const html = renderDashboard({
    site: { title: 'mislinks' },
    links: [
      { hash: 'gh', url: 'https://github.com/' },
      { hash: 'blog', url: 'https://example.com/blog' },
    ],
    lang: 'es',
    base: '/repo/',
  });

  assert.match(html, /<a class="short" href="\/repo\/gh\/"[^>]*>\/repo\/gh\/<\/a>/);
  assert.match(html, /<a class="qr-download" data-url="\/repo\/gh\/" download="gh\.png"/);
  assert.match(html, /<a class="qr-download" data-url="\/repo\/blog\/" download="blog\.png"/);
  assert.equal((html.match(/class="qr"/g) || []).length, 2);
  assert.match(html, /<svg aria-hidden="true" viewBox="0 0 24 24"/);
  assert.match(html, /class="copy"[^>]*data-url="\/repo\/gh\/"/);
  assert.match(html, /<div class="muted dest">https:\/\/github\.com\/<\/div>/);
  assert.doesNotMatch(html, /<a class="dest"/);
  assert.match(html, /\.qr\{display:block;width:64px;height:64px/);
  assert.doesNotMatch(html, /Copiado|Copied/);
  assert.match(html, /<table>/);
  assert.match(html, /api\.qrserver\.com\/v1\/create-qr-code/);
  assert.match(html, /href="https:\/\/github\.com\/salteadorneo\/links"[^>]*>[\s\S]*<svg aria-hidden="true" viewBox="0 0 16 16"/);
  assert.match(html, /<span>salteadorneo\/links<\/span>/);
});
