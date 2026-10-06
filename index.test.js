import test from 'node:test';
import assert from 'node:assert/strict';
import { parseYaml } from './lib/yaml-parser.js';

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
