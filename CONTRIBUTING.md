# Contribuir a PROMPT.HUB

Gracias por querer mejorar el proyecto. Esta guía explica cómo está organizado
y qué esperamos de un cambio.

## Requisitos

- Node.js 20 o superior (solo para tests y scripts; la app no necesita build).
- Python o cualquier servidor HTTP estático para probar en local.
- Git.

## Puesta en marcha

```bash
git clone https://github.com/Neffex010/prompt-hub.git
cd prompt-hub
python -m http.server 8000
```

Abre <http://localhost:8000>. La app debe servirse por HTTP porque usa
ES Modules.

## Tests

```bash
npm test
```

Usamos el runner nativo de Node (`node --test`). Los tests cubren el parser
CSV, las utilidades puras, el filtrado/orden, la codificación de enlaces
compartidos, la normalización del catálogo y la coherencia del precache con los
archivos reales. No hay dependencias instaladas.

Antes de abrir un PR, comprueba también la sintaxis:

```bash
find js scripts -name '*.js' -o -name '*.mjs' | xargs -n1 node --check
```

## Estructura

```
index.html            Markup único
manifest.webmanifest  Manifiesto PWA
sw.js                 Service worker (precache + estrategias)
css/styles.css        Estilos neo-brutalistas propios
data/prompts.json     Snapshot del catálogo (generado, versionado)
icons/                Iconos PWA
js/
  config.js           Constantes (URL de datos, tiempos, categorías)
  utils.js            Funciones puras (escape, fuzzy, placeholders, hash)
  csv.js              Parser CSV sin dependencias
  catalog.js          Normalización compartida build/runtime
  api.js              Snapshot primero, CSV remoto como fallback
  store.js            Estado y filtrado
  app.js              Orquestación y eventos
  features/           Persistencia y lógica de producto
    storage.js        localStorage con namespace
    favorites.js      Favoritos
    history.js        Historial reciente
    workspace.js      Export/import JSON
    share.js          URLs compartibles y deep links
    tokens.js         Contador de tokens (carga diferida)
    pwa.js            Registro del service worker
  ui/                 Render y widgets
tests/                Tests con node:test
scripts/              Snapshot, iconos y verificación de fuentes
```

## Reglas de código

- **Vanilla JS y ES Modules**. No introduzcas frameworks ni build step para la
  demo.
- **Rutas relativas** (`js/app.js`, no `/js/app.js`) para que funcione en
  GitHub Pages bajo `/prompt-hub/`.
- **Sanitiza** cualquier texto que venga de datos externos con `escapeHTML`.
- **No hardcodees secretos**. Cualquier API key debe quedarse en el navegador
  del usuario y nunca en el repositorio.
- Mantén la estética neo-brutalista: bordes negros gruesos, sombras duras,
  tipografías Space Grotesk / JetBrains Mono.
- Añade tests para lógica pura nueva.
- **Service worker**: si creas un módulo en `js/`, decláralo en la lista `CORE`
  de `sw.js`. `tests/pwa.test.js` falla si falta. Si cambias el shell, sube
  `VERSION` en `sw.js` para invalidar la caché anterior.

## Actualizar el catálogo

El catálogo que sirve la app es `data/prompts.json`, un snapshot generado desde
prompts.chat:

```bash
npm run build:catalog
npm test
```

- El script no reescribe el archivo si el contenido no cambió.
- `refresh-catalog.yml` lo ejecuta cada lunes y abre un PR con el diff.
- No edites `data/prompts.json` a mano: se regenera.
- Los IDs de prompt se derivan de título + texto, así que un cambio de contenido
  invalida ese favorito concreto. Revisa el diff antes de mergear.

Si tocas la normalización, hazlo en `js/catalog.js`: la usan tanto el script de
build como la app, de modo que el snapshot y el fallback remoto producen los
mismos IDs.

## Añadir una categoría

1. Añade sus palabras clave en `CATEGORY_KEYWORDS` (`js/config.js`).
2. Añade la etiqueta visible en `CATEGORY_LABELS` (`js/ui/prompts.js`).
3. Añade el botón con `data-filter` en `index.html`.
4. Actualiza los tests de `detectCategory` si aplica.

## Proponer prompts o fuentes

- Usa las plantillas de issue: **Sugerir un prompt** o **Proponer una fuente**.
- Para contenido de terceros necesitamos **licencia compatible** y atribución.
- Contenido GPL-3.0 se enlaza, no se copia.
- No envíes prompts con datos personales, credenciales o contenido ilegal.

## Pull requests

- Un cambio por PR, con descripción clara y pasos de prueba.
- Commits descriptivos (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).
- El PR debe pasar CI (`npm test` + verificación de sintaxis).
- Si tocas la UI, adjunta captura o describe el antes/después.

## Licencia

Al contribuir aceptas que tu código se publique bajo la licencia MIT del
proyecto. El contenido del catálogo mantiene la licencia de su fuente.
