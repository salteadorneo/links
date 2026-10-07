const STRINGS = {
  es: {
    redirecting: 'Redirigiendo…',
    fallback: 'Redirigiendo a',
    notFound: 'Link no encontrado',
    notFoundHint: 'El link',
    notFoundTail: 'no existe en este acortador.',
    back: 'Volver al inicio',
    link: 'Enlace',
    copy: 'Copiar',
    copyFailed: 'No se pudo copiar el enlace.',
    downloadFailed: 'No se pudo descargar el código QR.',
    qrCode: 'Código QR',
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
    link: 'Link',
    copy: 'Copy',
    copyFailed: 'Could not copy the link.',
    downloadFailed: 'Could not download the QR code.',
    qrCode: 'QR code',
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
      const shortLabel = site.domain
        ? escapeHtml(`https://${site.domain}${short.startsWith('/') ? short : `/${short}`}`)
        : short.startsWith('/') ? short : `/${short}`;
      const dest = escapeHtml(link.url);
      const name = link.title ? `<span class="name">${escapeHtml(link.title)}</span>` : '';
      const desc = link.description
        ? `<div class="muted">${escapeHtml(link.description)}</div>`
        : '';
      return `<tr>
  <td class="link-cell">
    <div class="short-line">
      <a class="short" href="${short}" target="_blank" rel="noopener">${shortLabel}</a>
      <button class="copy" type="button" data-url="${short}" aria-label="${escapeHtml(t(lang, 'copy'))}" title="${escapeHtml(t(lang, 'copy'))}">
        <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>
      </button>
    </div>
    <div class="muted dest">${dest}</div>
    ${name}
    ${desc}
  </td>
  <td class="qr-cell">
    <a class="qr-download" data-url="${short}" download="${escapeHtml(link.hash)}.png" aria-label="${escapeHtml(t(lang, 'qrCode'))}" title="${escapeHtml(t(lang, 'qrCode'))}">
      <img class="qr" alt="" width="96" height="96" loading="lazy" referrerpolicy="no-referrer" />
    </a>
  </td>
</tr>`;
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
.container{max-width:960px;margin:0 auto}
.header{display:flex;align-items:baseline;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:20px}
table{width:100%;border-collapse:collapse;background:var(--panel);border:1px solid var(--border);border-radius:8px;overflow:hidden;text-align:left}
th,td{padding:12px 16px;border-bottom:1px solid var(--border);vertical-align:middle}
th{color:var(--muted);font-size:12px;font-weight:400}
tbody tr:last-child td{border-bottom:0}
.link-cell{min-width:220px}
.short-line{display:flex;align-items:center;gap:8px}
.short{font-weight:700;font-size:15px}
.name{margin-left:8px;color:var(--muted);font-size:12px}
.dest{font-size:12px;word-break:break-all}
.qr-cell{text-align:center;width:96px}
.qr-download{cursor:pointer}
.qr{display:block;width:64px;height:64px;padding:3px;background:#fff;border-radius:4px}
.copy{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;padding:4px;border:1px solid var(--border);border-radius:4px;background:transparent;color:var(--muted);cursor:pointer}
.copy:hover{border-color:var(--accent);color:var(--accent)}
.status{display:block;min-height:1em;color:var(--muted);font-size:11px}
.footer{margin-top:24px;text-align:center}
.repo-link{display:inline-flex;align-items:center;gap:8px;color:var(--muted);font-size:12px}
.repo-link:hover{color:var(--accent)}
.repo-link svg{width:16px;height:16px;fill:currentColor}
@media(max-width:600px){body{padding:24px 12px}table{min-width:600px}.table-wrap{overflow-x:auto}}
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
  <div class="table-wrap">
  <table>
    <tbody>
${rows}
    </tbody>
  </table>
  </div>
  <div class="footer">
    ${report}
    <a class="repo-link" href="https://github.com/salteadorneo/links" target="_blank" rel="noopener noreferrer">
      <svg aria-hidden="true" viewBox="0 0 16 16"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.65 7.65 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>
      <span>salteadorneo/links</span>
    </a>
  </div>
</div>
<script>
var qrEndpoint = 'https://api.qrserver.com/v1/create-qr-code/?size=96x96&data=';
document.querySelectorAll('.qr-download').forEach(function (link) {
  var url = new URL(link.dataset.url, location.href).href;
  link.href = qrEndpoint + encodeURIComponent(url);
  link.querySelector('.qr').src = link.href;
  link.addEventListener('click', function (event) {
    event.preventDefault();
    var status = link.parentElement.querySelector('.status');
    fetch(link.href).then(function (response) {
      if (!response.ok) throw new Error('QR download failed: ' + response.status);
      return response.blob();
    }).then(function (blob) {
      var objectUrl = URL.createObjectURL(blob);
      var download = document.createElement('a');
      download.href = objectUrl;
      download.download = link.download;
      document.body.appendChild(download);
      download.click();
      download.remove();
      setTimeout(function () { URL.revokeObjectURL(objectUrl); }, 1000);
      status.textContent = '';
    }).catch(function () {
      status.textContent = ${JSON.stringify(t(lang, 'downloadFailed'))};
    });
  });
});
document.querySelectorAll('.copy').forEach(function (button) {
  button.addEventListener('click', function () {
    var url = new URL(button.dataset.url, location.href).href;
    var status = button.closest('td').querySelector('.status');
    navigator.clipboard.writeText(url).catch(function () {
      status.textContent = ${JSON.stringify(t(lang, 'copyFailed'))};
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
