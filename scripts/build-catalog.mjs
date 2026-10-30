#!/usr/bin/env node
/**
 * Genera `data/prompts.json` a partir del CSV público de prompts.chat.
 *
 * El snapshot se sirve junto a la app para que:
 *  - los IDs de los prompts no cambien mientras no actualicemos la copia,
 *  - la carga sea más rápida (JSON frente a CSV),
 *  - la demo funcione aunque el repositorio de origen no esté disponible.
 *
 * Si el contenido no cambió, no reescribe el archivo (evita ruido en git).
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { normalizeCatalogEntries } from '../js/catalog.js';
import { parseCSV } from '../js/csv.js';

const SOURCE_URL = 'https://raw.githubusercontent.com/f/prompts.chat/main/prompts.csv';
const OUTPUT_PATH = fileURLToPath(new URL('../data/prompts.json', import.meta.url));

/** Mínimo razonable para detectar una descarga truncada o un 200 vacío. */
const MIN_PROMPTS = 100;

async function downloadRows() {
  const response = await fetch(SOURCE_URL, {
    headers: { 'user-agent': 'prompt-hub-catalog-builder' },
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`No se pudo descargar el catálogo (HTTP ${response.status}).`);
  }

  const csv = await response.text();
  const rows = parseCSV(csv);

  if (rows.length < MIN_PROMPTS) {
    throw new Error(`Catálogo sospechosamente pequeño: ${rows.length} filas.`);
  }

  return rows;
}

async function readPrevious() {
  try {
    return JSON.parse(await readFile(OUTPUT_PATH, 'utf8'));
  } catch {
    return null;
  }
}

async function main() {
  const prompts = normalizeCatalogEntries(await downloadRows());

  if (prompts.length < MIN_PROMPTS) {
    throw new Error(`Normalización produjo solo ${prompts.length} prompts.`);
  }

  const previous = await readPrevious();

  if (previous && JSON.stringify(previous.prompts) === JSON.stringify(prompts)) {
    console.log(`Sin cambios: ${prompts.length} prompts.`);
    return;
  }

  const payload = {
    source: SOURCE_URL,
    generatedAt: new Date().toISOString(),
    count: prompts.length,
    prompts,
  };

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(payload)}\n`, 'utf8');

  console.log(`Snapshot actualizado: ${prompts.length} prompts en data/prompts.json`);
}

await main().catch((error) => {
  console.error(`Fallo al generar el snapshot: ${error.message}`);
  process.exitCode = 1;
});
