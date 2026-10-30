# PROMPT.HUB // Neo-Brutalist Prompt Explorer

Explorador de prompts con estética neo-brutalista. Consume el catálogo open source
de [f/prompts.chat](https://github.com/f/prompts.chat) y permite buscar, filtrar,
ordenar, probar variables y copiar prompts.

## Estructura del proyecto

```
.
├── index.html              # Único punto de entrada (markup)
├── favicon.svg             # Icono de la app
├── css/
│   └── styles.css          # Estilos personalizados neo-brutalistas
├── js/
│   ├── tailwind.config.js  # Tema de Tailwind (CDN)
│   ├── config.js           # Constantes: URL de la API, tiempos, keywords
│   ├── utils.js            # Helpers: escape, debounce, placeholders
│   ├── csv.js              # Parser CSV sin dependencias
│   ├── api.js              # Capa de datos: fetch + normalización
│   ├── store.js            # Estado central, filtrado y orden
│   ├── app.js              # Arranque, eventos y orquestación
│   └── ui/                 # Módulos de interfaz
│       ├── dom.js          # Referencias al DOM
│       ├── prompts.js      # Render del grid de tarjetas
│       ├── playground.js   # Probador de variables
│       ├── clipboard.js    # Copiado al portapapeles + feedback
│       └── toast.js        # Notificaciones flotantes
└── README.md
```

### Responsabilidades

| Capa | Archivo(s) | Qué hace |
| --- | --- | --- |
| Configuración | `js/config.js` | Valores configurables sin tocar la lógica |
| Datos | `js/api.js`, `js/csv.js` | Obtiene, parsea y normaliza los prompts |
| Estado | `js/store.js` | Catálogo, filtros y orden |
| Utilidades | `js/utils.js` | Funciones puras reutilizables |
| UI | `js/ui/*` | Render y widgets concretos |
| Orquestación | `js/app.js` | Conecta eventos con estado y UI |

## Cómo ejecutarlo

El proyecto usa **ES Modules**, por lo que debe servirse por HTTP (abrirlo con
doble clic desde `file://` puede bloquear los módulos en algunos navegadores).

```bash
# Opción 1: Python
python -m http.server 8000

# Opción 2: Node
npx serve .
```

Luego abre <http://localhost:8000>.

## Notas

- Tailwind y Lucide se cargan por CDN; la app requiere conexión a internet.
- Los prompts se piden a `PROMPTS_CSV_URL` (definida en `js/config.js`) y se
  parsean en el navegador con `js/csv.js`.
- Los placeholders soportados son `${variable:descripcion}`, `[variable]` y
  `{variable}`.
- Para agregar una categoría nueva: añade sus keywords en `CATEGORY_KEYWORDS`
  (`js/config.js`) y un botón con el `data-filter` correspondiente en `index.html`.
