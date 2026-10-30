# PROMPT.HUB // Neo-Brutalist Prompt Explorer

**Demo pública:** <https://neffex010.github.io/prompt-hub/>

Explorador estático de prompts open source con estética neo-brutalista. Sirve
un snapshot del catálogo de [f/prompts.chat](https://github.com/f/prompts.chat)
(~2.700 prompts), permite buscar con tolerancia a acentos y errores, configurar
variables, guardar favoritos e historial, y compartir un prompt ya relleno por
URL. Se instala como PWA y funciona sin conexión después de la primera visita.

No necesita build, backend ni cuenta. Todo el estado del usuario vive en su
navegador.

## Funcionalidades

- **Búsqueda difusa** por título y contenido, sin acentos y con varios términos.
- **Render por lotes** de 60 tarjetas con carga automática al hacer scroll.
- **Filtros** por categoría (dev, escritura, tutor), favoritos, prompts con
  variables y recientes.
- **Workspace local** con favoritos e historial persistidos en `localStorage`.
- **Export / import JSON** del workspace para moverlo entre navegadores.
- **Playground editable** con detección de placeholders `${var:desc}`,
  `[var]` y `{var}`.
- **Contador de tokens** con `gpt-tokenizer` cargado bajo demanda (fallback a
  estimación si el CDN falla).
- **URLs compartibles** con las variables rellenas:
  `#p=<id>&v=<base64url>`.
- **Deep links** a ChatGPT y Claude con el prompt precargado.
- **Atajos**: `/` enfoca la búsqueda, `Esc` la limpia.
- **Diseño responsive** y sanitización de todo contenido externo.
- **PWA instalable** con `manifest.webmanifest` e iconos propios.
- **Offline**: el service worker precarga el shell, los datos y los CDNs; tras
  la primera visita la app abre sin red.

## Cómo ejecutarlo

La app usa ES Modules, así que debe servirse por HTTP:

```bash
# Opción 1: Python
python -m http.server 8000

# Opción 2: npm script
npm run serve
```

Abre <http://localhost:8000>.

## Tests

```bash
npm test
```

Runner nativo de Node (`node --test`), sin dependencias. Cubre:

- Parser CSV (`js/csv.js`).
- Utilidades: fuzzy search, normalización, placeholders, IDs estables.
- Filtrado, flags y orden (`js/store.js`).
- Codificación de share links y deep links (`js/features/share.js`).
- Normalización del catálogo y validez de `data/prompts.json`
  (`tests/catalog.test.js`).
- Coherencia del precache con los archivos reales (`tests/pwa.test.js`).

Verificación de la fuente remota (requiere red):

```bash
npm run check-sources
```

## Estructura

```
.
├── index.html                  # Único punto de entrada
├── favicon.svg
├── manifest.webmanifest        # Manifiesto PWA
├── sw.js                       # Service worker (precache y estrategias)
├── css/
│   └── styles.css              # Estilos neo-brutalistas propios
├── data/
│   └── prompts.json            # Snapshot versionado del catálogo
├── icons/                      # Iconos PWA (192, 512, maskable, Apple)
├── js/
│   ├── tailwind.config.js      # Tema de Tailwind (CDN)
│   ├── config.js               # URL de datos, tiempos, keywords
│   ├── utils.js                # Helpers puros
│   ├── csv.js                  # Parser CSV sin dependencias
│   ├── catalog.js              # Normalización compartida build/runtime
│   ├── api.js                  # Snapshot primero, CSV remoto como fallback
│   ├── store.js                # Estado, búsqueda y filtros
│   ├── app.js                  # Arranque, eventos y orquestación
│   ├── features/
│   │   ├── storage.js          # localStorage con namespace
│   │   ├── favorites.js        # Favoritos
│   │   ├── history.js          # Historial reciente
│   │   ├── workspace.js        # Export / import JSON
│   │   ├── share.js            # URLs compartibles y deep links
│   │   ├── tokens.js           # Contador de tokens (carga diferida)
│   │   └── pwa.js              # Registro del service worker
│   └── ui/
│       ├── dom.js              # Referencias al DOM
│       ├── prompts.js          # Render por lotes y favoritos
│       ├── playground.js       # Probador + scorecard + share
│       ├── clipboard.js        # Copiado + feedback
│       └── toast.js            # Notificaciones
├── tests/                      # Tests con node:test
├── scripts/
│   ├── build-catalog.mjs       # Regenera data/prompts.json
│   ├── generate-icons.ps1      # Genera los PNG de la PWA (Windows)
│   └── check-sources.mjs       # Verificación semanal de la fuente
└── .github/
    ├── workflows/              # CI, deploy Pages, validate y refresh
    └── ISSUE_TEMPLATE/         # Bug, prompt, fuente
```

## Catálogo y PWA

### Snapshot del catálogo

La app carga `data/prompts.json` (snapshot versionado) en lugar de descargar el
CSV en cada visita. Ventajas: arranque más rápido, IDs estables mientras el
snapshot no cambie y disponibilidad si el repositorio de origen falla. Si el
snapshot no está disponible, `js/api.js` cae automáticamente al CSV remoto.

Para regenerarlo:

```bash
npm run build:catalog   # descarga prompts.chat y reescribe data/prompts.json
npm test                # valida el resultado
```

El script no reescribe el archivo si el contenido es idéntico. El workflow
`.github/workflows/refresh-catalog.yml` lo ejecuta cada lunes y abre un PR
cuando hay cambios; nunca publica directamente.

> Cambiar el snapshot puede cambiar el ID de un prompt (se deriva de título +
> texto), lo que invalida ese favorito concreto en los navegadores. Revisa el
> diff antes de mergear.

### Service worker

`sw.js` precarga el shell, `data/prompts.json` y los CDNs en `CORE` y
`CDN_ASSETS`. Estrategias:

- Navegación: network-first con timeout de 4 s y fallback al `index.html`
  cacheado.
- Mismo origen y CDNs: stale-while-revalidate.

Al añadir un módulo JS nuevo hay que declararlo en `CORE`; `tests/pwa.test.js`
falla si algún archivo de `js/` queda fuera. Al cambiar el shell, sube
`VERSION` en `sw.js` para invalidar la caché anterior.

## Deploy

GitHub Pages se despliega automáticamente en cada push a `main` mediante
`.github/workflows/deploy-pages.yml`. No hay build: el workflow copia
`index.html`, `css/`, `js/`, `data/`, `icons/`, `manifest.webmanifest`, `sw.js`,
`favicon.svg` y `.nojekyll` a `_site`, valida que el snapshot no esté vacío y
ejecuta `npm test`.

Para activarlo en un fork:

1. Settings → Pages → Source: **GitHub Actions**.
2. Push a `main`.
3. La URL será `https://<usuario>.github.io/<repo>/`.

Todas las rutas del proyecto son relativas para que funcione bajo un
subdirectorio.

## Datos y licencias

- **Código:** [MIT](LICENSE) © 2026 Luis Enrique.
- **Catálogo:** snapshot de
  [`f/prompts.chat/prompts.csv`](https://github.com/f/prompts.chat) versionado
  en `data/prompts.json`. Cada prompt pertenece a su autor original y conserva
  la licencia de la fuente.
- **Tailwind CSS, Lucide y Google Fonts:** cargados por CDN.
- **`gpt-tokenizer`:** cargado bajo demanda desde jsDelivr para contar tokens.

Este proyecto no empaqueta contenido GPL-3.0 de terceros. Si en el futuro se
integran nuevas fuentes, se mostrará su licencia y atribución.

## Contribuir

Lee [CONTRIBUTING.md](CONTRIBUTING.md) y usa las plantillas de issue para
proponer prompts o fuentes. Para reportes de seguridad, consulta
[SECURITY.md](SECURITY.md).

## Roadmap

- [x] **P0** — Pages, CI, búsqueda difusa, render por lotes, favoritos,
      historial, export/import, share por URL, tokens, filtro de variables.
- [ ] **P1** — PWA offline ✅, snapshot del catálogo ✅; pendientes: catálogo
      enriquecido en build (más fuentes, dedupe, atribución), command palette,
      i18n.
- [ ] **P2** — ejecutar y comparar prompts (Ollama, Groq, Gemini, OpenRouter),
      coste estimado, scorecard avanzado.
- [ ] **P3** — SSG por prompt, sitemap/JSON-LD, import desde Langfuse, analytics.
