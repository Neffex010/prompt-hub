#!/usr/bin/env node
/**
 * Verifica que la fuente del catálogo siga disponible y con el formato esperado.
 * Se ejecuta en CI de forma programada para detectar 404 silenciosos.
 */

const SOURCE_URL = 'https://raw.githubusercontent.com/f/prompts.chat/main/prompts.csv';

try {
  const response = await fetch(SOURCE_URL, {
    headers: { 'user-agent': 'prompt-hub-source-check' },
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const text = await response.text();
  const header = text.split('\n', 1)[0]?.trim() ?? '';
  const lines = text.split('\n').length;

  if (!header.startsWith('act,prompt')) {
    throw new Error(`Cabecera inesperada: "${header}"`);
  }

  if (lines < 100) {
    throw new Error(`Catálogo sospechosamente pequeño: ${lines} líneas`);
  }

  console.log(`OK ${SOURCE_URL}`);
  console.log(`Cabecera: ${header}`);
  console.log(`Filas (incluyendo cabecera): ${lines}`);
} catch (error) {
  console.error(`Fallo al validar la fuente: ${error.message}`);
  process.exitCode = 1;
}
