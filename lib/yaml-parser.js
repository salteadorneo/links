/**
 * Minimal YAML parser (zero dependencies).
 * Supports: nested maps, lists of maps, scalars, quoted strings,
 * comments, inline comments and literal blocks (|).
 */

function tokenize(text) {
  const lines = [];
  for (const raw of text.split(/\r?\n/)) {
    if (!raw.trim() || /^\s*#/.test(raw)) continue;
    const indent = raw.match(/^ */)[0].length;
    lines.push({ indent, text: raw.trim() });
  }
  return lines;
}

function stripInlineComment(value) {
  const idx = value.indexOf(' #');
  return idx === -1 ? value : value.slice(0, idx);
}

function parseScalar(raw) {
  let v = raw.trim();
  if (v.length > 1) {
    const q = v[0];
    if ((q === '"' || q === "'") && v.endsWith(q)) {
      v = v.slice(1, -1);
      return q === '"' ? v.replace(/\\(.)/g, '$1') : v;
    }
  }
  v = stripInlineComment(v).trim();
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (v === 'null' || v === '~' || v === '') return v === '' ? '' : null;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return v;
}

function isListItem(text) {
  return text === '-' || text.startsWith('- ');
}

function parseNode(lines, start, indent) {
  if (start >= lines.length) return [null, start];
  return isListItem(lines[start].text)
    ? parseList(lines, start, indent)
    : parseMap(lines, start, indent);
}

function parseList(lines, start, indent) {
  const result = [];
  let i = start;
  while (i < lines.length && lines[i].indent === indent && isListItem(lines[i].text)) {
    const rest = lines[i].text === '-' ? '' : lines[i].text.slice(2).trim();
    if (rest === '') {
      const [value, next] = parseNode(lines, i + 1, lines[i + 1]?.indent ?? indent + 2);
      result.push(value);
      i = next;
    } else if (/^[\w"'.\-/]+:(\s|$)/.test(rest)) {
      // "- key: value" -> first key of a map item
      lines[i] = { indent: indent + 2, text: rest };
      const [value, next] = parseMap(lines, i, indent + 2);
      result.push(value);
      i = next;
    } else {
      result.push(parseScalar(rest));
      i += 1;
    }
  }
  return [result, i];
}

function parseMap(lines, start, indent) {
  const result = {};
  let i = start;
  while (i < lines.length && lines[i].indent === indent && !isListItem(lines[i].text)) {
    const match = lines[i].text.match(/^([^:]+):\s*(.*)$/);
    if (!match) throw new Error(`Invalid YAML line: "${lines[i].text}"`);
    const key = parseScalar(match[1]).toString();
    const inlineValue = match[2];
    let value;
    let next;

    if (inlineValue === '' || inlineValue === '|' || inlineValue === '>') {
      const childIndent = lines[i + 1]?.indent ?? 0;
      if (lines[i + 1] && childIndent > indent) {
        if (inlineValue === '|' || inlineValue === '>') {
          const parts = [];
          let j = i + 1;
          while (j < lines.length && lines[j].indent > indent) {
            parts.push(lines[j].text);
            j += 1;
          }
          value = inlineValue === '|' ? parts.join('\n') : parts.join(' ');
          next = j;
        } else {
          [value, next] = parseNode(lines, i + 1, childIndent);
        }
      } else {
        value = null;
        next = i + 1;
      }
    } else {
      value = parseScalar(inlineValue);
      next = i + 1;
    }

    result[key] = value;
    i = next;
  }
  return [result, i];
}

export function parseYaml(text) {
  const lines = tokenize(text);
  if (lines.length === 0) return {};
  const [value] = parseNode(lines, 0, lines[0].indent);
  return value;
}
