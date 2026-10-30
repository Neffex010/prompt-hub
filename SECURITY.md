# Seguridad

## Versiones soportadas

Este es un proyecto estático sin backend. Solo la rama `main` recibe
actualizaciones.

| Versión | Soporte |
| --- | --- |
| `main` | ✅ |

## Reportar una vulnerabilidad

No abras un issue público para problemas de seguridad. Usa
[GitHub Security Advisories](https://github.com/Neffex010/prompt-hub/security/advisories/new)
o escribe a **cabrera.luisenrique008@gmail.com**.

Incluye:

- Descripción del problema y su impacto.
- Pasos para reproducirlo.
- Navegador, sistema y URL afectada.
- Prueba de concepto, si la tienes.

Intentamos responder en un plazo de 7 días.

## Alcance y consideraciones

- **No hay secretos en el repositorio**. La app no usa claves de API.
- El contenido del catálogo es externo y se sanitiza antes de inyectarse en el
  DOM con `escapeHTML`.
- El workspace del usuario (favoritos e historial) se guarda en
  `localStorage` y nunca se envía a un servidor.
- Los enlaces compartidos codifican variables en el hash de la URL. No metas
  datos sensibles en una URL compartida: el hash puede quedar en el historial
  del navegador y en el portapapeles.
- Si en el futuro se añaden integraciones de IA con claves de usuario, deberán
  guardarse localmente y nunca incluirse en el repositorio.

## Dependencias

La demo carga Tailwind, Lucide y Google Fonts por CDN. No hay dependencias de
npm en runtime. Dependabot vigila las GitHub Actions.
