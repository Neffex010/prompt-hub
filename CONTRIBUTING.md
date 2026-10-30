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
CSV, las utilidades puras, el filtrado/orden y la codificación de enlaces
compartidos. No hay dependencias instaladas.

Antes de abrir un PR, comprueba también la sintaxis:

```bash
find js scripts -name '*.js' -o -name '*.mjs' | xargs -n1 node --check
```

## Estructura

```
index.html            Markup único
css/styles.css        Estilos neo-brutalistas propios
js/
  config.js           Constantes (URL de datos, tiempos, categorías)
  utils.js            Funciones puras (escape, fuzzy, placeholders, hash)
  csv.js              Parser CSV sin dependencias
  api.js              Fetch + normalización del catálogo
  store.js            Estado y filtrado
  app.js              Orquestación y eventos
  features/           Persistencia y lógica de producto
    storage.js        localStorage con namespace
    favorites.js      Favoritos
    history.js        Historial reciente
    workspace.js      Export/import JSON
    share.js          URLs compartibles y deep links
    tokens.js         Contador de tokens (carga diferida)
  ui/                 Render y widgets
tests/                Tests con node:test
scripts/              Verificación de fuentes
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
