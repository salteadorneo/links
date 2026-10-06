const STRINGS = {
  es: {
    redirecting: 'Redirigiendo…',
    fallback: 'Redirigiendo a',
    notFound: 'Link no encontrado',
    notFoundHint: 'El link',
    notFoundTail: 'no existe en este acortador.',
    back: 'Volver al inicio',
    copy: 'Copiar',
    copied: 'Copiado',
    destination: 'Destino',
    links: 'links',
    report: 'Reportar un problema',
    total: 'Total',
  },
  en: {
    redirecting: 'Redirecting…',
    fallback: 'Redirecting to',
    notFound: 'Link not found',
    notFoundHint: 'The link',
    notFoundTail: 'does not exist in this shortener.',
    back: 'Back to home',
    copy: 'Copy',
    copied: 'Copied',
    destination: 'Destination',
    links: 'links',
    report: 'Report an issue',
    total: 'Total',
  },
};

export function t(lang, key) {
  return (STRINGS[lang] || STRINGS.en)[key] ?? STRINGS.en[key];
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const BASE_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#0d1117;--panel:#161b22;--border:#30363d;--fg:#e6edf3;--muted:#8b949e;--accent:#2f81f7;--ok:#3fb950}
@media (prefers-color-scheme:light){:root{--bg:#ffffff;--panel:#f6f8fa;--border:#d0d7de;--fg:#1f2328;--muted:#656d76;--accent:#0969da;--ok:#1a7f37}}
body{background:var(--bg);color:var(--fg);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:14px;line-height:1.6;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center}
a{color:var(--accent);text-decoration:none}
a:hover{text-decoration:underline}
.container{width:100%;max-width:720px}
h1{font-size:20px;margin-bottom:4px}
.muted{color:var(--muted);font-size:12px}
.card{background:var(--panel);border:1px solid var(--border);border-radius:8px;padding:20px;margin-top:20px}
.btn{display:inline-block;background:var(--panel);border:1px solid var(--border);color:var(--fg);border-radius:6px;padding:6px 14px;font:inherit;font-size:12px;cursor:pointer}
.btn:hover{border-color:var(--accent);color:var(--accent);text-decoration:none}
code{background:var(--panel);border:1px solid var(--border);border-radius:4px;padding:1px 6px;font-size:13px;word-break:break-all}
`;

export function renderRedirect({ url, hash, lang, site }) {
  const safeUrl = escapeHtml(url);
  const jsUrl = JSON.stringify(url);
  const title = escapeHtml(`${site.title} → ${hash}`);
  return `<!doctype html>
<html lang="${escapeHtml(lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${title}</title>
<link rel="canonical" href="${safeUrl}">
<meta http-equiv="refresh" content="0; url=${safeUrl}">
<script>location.replace(${jsUrl}+location.search+location.hash)</script>
<style>${BASE_CSS}</style>
</head>
<body>
<div class="container">
<h1>${escapeHtml(t(lang, 'redirecting'))}</h1>
<p class="muted">${escapeHtml(t(lang, 'fallback'))} <a href="${safeUrl}">${safeUrl}</a></p>
<noscript><p style="margin-top:16px"><a class="btn" href="${safeUrl}">${safeUrl}</a></p></noscript>
</div>
</body>
</html>
`;
}

export function renderDashboard({ site, links, lang, base = '' }) {
  const title = escapeHtml(site.title);
  const description = escapeHtml(site.description || '');
  const rows = links
    .map((link) => {
      const short = escapeHtml(`${base}${link.hash}/`);
      const dest = escapeHtml(link.url);
      const name = link.title ? `<span class="name">${escapeHtml(link.title)}</span>` : '';
      const desc = link.description
        ? `<div class="muted">${escapeHtml(link.description)}</div>`
        : '';
      return `<li class="row">
  <div class="info">
    <a class="short" href="${short}" target="_blank" rel="noopener">/${short}</a>
    ${name}
    <div class="muted dest">${dest}</div>
    ${desc}
  </div>
  <div class="actions">
    <button class="btn copy" data-url="${short}">${escapeHtml(t(lang, 'copy'))}</button>
    <a class="btn" href="${dest}" target="_blank" rel="noopener">↗</a>
  </div>
</li>`;
    })
    .join('\n');

  const report = site.report
    ? `<p class="muted"><a href="${escapeHtml(site.report)}">${escapeHtml(t(lang, 'report'))}</a></p>`
    : '';

  return `<!doctype html>
<html lang="${escapeHtml(lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
<style>${BASE_CSS}
body{display:block;padding:40px 20px}
.container{margin:0 auto}
.header{display:flex;align-items:baseline;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:20px}
ul{list-style:none}
.row{display:flex;align-items:center;justify-content:space-between;gap:12px;background:var(--panel);border:1px solid var(--border);border-radius:8px;padding:12px 16px;margin-bottom:8px;text-align:left}
.info{min-width:0}
.short{font-weight:700;font-size:15px}
.name{margin-left:8px;color:var(--muted);font-size:12px}
.dest{font-size:12px;word-break:break-all}
.actions{display:flex;gap:6px;flex-shrink:0}
.footer{margin-top:24px;text-align:center}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div>
      <h1>${title}</h1>
      ${description ? `<p class="muted">${description}</p>` : ''}
    </div>
    <span class="muted">${links.length} ${escapeHtml(t(lang, 'links'))}</span>
  </div>
  <ul>
${rows}
  </ul>
  <div class="footer">${report}</div>
</div>
<script>
document.querySelectorAll('.copy').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var url = new URL(btn.dataset.url, location.href).href;
    navigator.clipboard.writeText(url).then(function () {
      var old = btn.textContent;
      btn.textContent = ${JSON.stringify(t(lang, 'copied'))};
      setTimeout(function () { btn.textContent = old; }, 1500);
    });
  });
});
</script>
</body>
</html>
`;
}

export function renderNotFound({ site, links, lang, basePath = '/' }) {
  const map = Object.fromEntries(links.map((link) => [link.hash, link.url]));
  return `<!doctype html>
<html lang="${escapeHtml(lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escapeHtml(t(lang, 'notFound'))}</title>
<style>${BASE_CSS}</style>
</head>
<body>
<div class="container">
<h1>404</h1>
<p class="muted" id="msg">${escapeHtml(t(lang, 'notFoundHint'))} <code id="path"></code> ${escapeHtml(t(lang, 'notFoundTail'))}</p>
<p style="margin-top:16px"><a class="btn" id="home" href="${escapeHtml(basePath)}">${escapeHtml(t(lang, 'back'))}</a></p>
</div>
<script>
var LINKS = ${JSON.stringify(map)};
var BASE = ${JSON.stringify(basePath)};
var prefix = BASE.replace(/\\/+$/, '');
var key = location.pathname;
if (prefix && key.indexOf(prefix) === 0) key = key.slice(prefix.length);
key = key.replace(/^\\/+|\\/+$/g, '');
document.getElementById('path').textContent = '/' + key;
if (LINKS[key]) {
  location.replace(LINKS[key] + location.search + location.hash);
}
</script>
</body>
</html>
`;
}
