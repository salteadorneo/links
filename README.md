# Link Shortener

Acortador de links 100% estático y sin base de datos, hosteado en **GitHub Pages**.

Toda la configuración vive en un solo archivo: `config.yml`. Haz push y GitHub Actions construye y despliega tu propio acortador con subdominio propio.

[![Web](https://img.shields.io/badge/demo-mislinks-2f81f7)](#)

## Features

- 🚀 **Cero dependencias** — Node.js puro con ES modules (ni `npm install`)
- 📄 **Sin base de datos** — cada link es un HTML estático con redirect
- ⚡ **Redirect instantáneo** — `meta refresh` + `location.replace()`, funciona sin JS
- 🌐 **GitHub Pages** — build y deploy automático con GitHub Actions
- 🎨 **Dark mode** — respeta el tema del sistema
- 🌍 **Multi-idioma** — español e inglés
- 📱 **Responsive** — dashboard minimalista en monospace
- 🔳 **Código QR por enlace** — cada QR abre la URL corta correspondiente
- 🔗 **Subdominio propio** — `link.tudominio.com` generado desde el config
- 🛡️ **404 inteligente** — rutas desconocidas caen en un mapa de links y redirigen igual
- 🧪 **Tests** — `node --test` para el parser YAML

## Quick Start

### 1. Crea tu repo

Usa este repo como **template** (botón *Use this template*) o haz un fork.

### 2. Configura tus links

Edita `config.yml`:

```yaml
domain: link.tudominio.com

links:
  - hash: gh
    url: https://github.com/tu-usuario

  - hash: cv
    url: https://drive.google.com/.../cv.pdf
```

### 3. Publica

1. **Settings → Pages → Source**: selecciona **GitHub Actions**
2. Haz push a `main`
3. Listo: `https://tu-usuario.github.io/tu-repo/gh/`

## Cómo funciona

1. GitHub Actions corre `node index.js` en cada push
2. El build lee `config.yml` y genera en `_site/`:

```
_site/
  index.html
  404.html
  .nojekyll
  CNAME
  {hash}/index.html
```

3. Se despliega como artifact de GitHub Pages

**No hay servidores. No hay BD. No hay servicios externos.**

Cada página de redirect conserva query string y hash:

```html
<meta http-equiv="refresh" content="0; url=https://destino.com">
<script>location.replace("https://destino.com"+location.search+location.hash)</script>
```

Así que `/gh/?utm_source=twitter` llega a `https://destino.com/?utm_source=twitter`.

## Configuración

Todo en `config.yml`, solo dos claves:

```yaml
domain: link.midominio.com   # Opcional: genera el archivo CNAME

links:                        # Obligatorio
  - hash: gh                  # [a-zA-Z0-9_-], único → /gh/
    url: https://...          # http:// o https://
    title: GitHub             # Opcional: nombre en el dashboard
    description: Mi perfil    # Opcional: texto secundario
```

Opcionales a nivel raíz:

```yaml
title: mislinks         # Título del dashboard (default: el domain)
description: Mis links  # Subtítulo
language: es            # es (default) | en
report: https://github.com/tu/repo/issues/new   # Link de contacto
```

Los hashes no pueden repetirse ni usar nombres reservados (`index.html`, `404.html`, `CNAME`...).

## Dominio propio

1. Agrega en `config.yml`:

   ```yaml
   domain: link.tudominio.com
   ```

2. Apunta tu DNS:
   - **Apex**: `tudominio.com` → IPs de GitHub Pages (`185.199.108.153`, `.109.153`, `.110.153`, `.111.153`)
   - **Subdominio**: `link.tudominio.com` → `tu-usuario.github.io` (CNAME)

3. Push: el build genera el archivo `CNAME` automáticamente.

También puedes configurar el dominio en **Settings → Pages → Custom domain** (el CNAME del build lo mantiene).

## Local Development

```bash
node index.js     # o npm run build
```

Genera `_site/`. Sírvelo localmente:

```bash
npx serve _site        # o
python -m http.server -d _site
```

Para probar el 404 con `serve`, sirve con `npx serve _site` (ya maneja `404.html`).

```bash
npm test          # tests del parser YAML
```

## Proyecto Structure

```
config.yml                # ← Tu configuración (único archivo a editar)
index.js                  # Build: valida config y genera _site/
index.test.js             # Tests (node --test)
lib/
  yaml-parser.js          # Parser YAML sin dependencias
  generators.js           # Templates HTML (redirect, dashboard, 404)
.github/workflows/
  deploy.yml              # Build + deploy a GitHub Pages
```

Archivos generados (en `_site/`, no se commitean).

Los QR del dashboard se cargan desde [QRServer](https://qrserver.com/). El servicio recibe la URL corta pública para generar cada imagen. Haz clic en el QR para descargarlo como PNG; usa el icono junto al enlace para copiar su URL.

## FAQ

**¿Cuánto cuesta?** $0. GitHub Pages y Actions son gratis para repos públicos.

**¿Sirve para tracking / analytics?** No. Es solo redirect estático: sin cookies, sin BD, sin trackers.

**¿Qué pasa si borro un link?** Se elimina del build. Esa ruta cae en el 404 (que muestra "link no encontrado").

**¿Puedo tener links con barra, ej. `/go/perfil`?** No. Un solo segmento: `hash: perfil` → `/perfil/`.

**¿Funciona en un repo de organización o user page?** Sí. El workflow calcula el `BASE_PATH` solo (`/` si el repo termina en `.github.io`).

**¿Y si quiero analytics?** Usa parámetros UTM en la URL destino y mide en tu propia herramienta (Plausible, GA, etc.).

## Licencia

MIT — Fork it, use it, modify it.
