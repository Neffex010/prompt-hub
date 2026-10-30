import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  normalizeCatalogEntries,
  parseCatalogPayload,
} from '../js/catalog.js';
import { createPromptId } from '../js/utils.js';

const raw = [
  { act: '  Linux Terminal  ', prompt: 'run commands' },
  { act: 'Linux Terminal', prompt: 'run commands' },
  { act: '', prompt: 'sin título' },
  { act: 'Vacío', prompt: '' },
  { act: 'Vacío 2', prompt: '   ' },
  { act: null, prompt: null },
  { act: 'Essay Writer', prompt: 'write a novel' },
];

test('normalizeCatalogEntries recorta el título y descarta prompts vacíos', () => {
  const prompts = normalizeCatalogEntries(raw);

  assert.deepEqual(
    prompts.map((item) => item.act),
    ['Linux Terminal', 'Sin Título', 'Vacío 2', 'Essay Writer'],
  );
});

test('normalizeCatalogEntries deduplica por id', () => {
  const prompts = normalizeCatalogEntries(raw);
  const ids = prompts.map((item) => item.id);

  assert.equal(new Set(ids).size, ids.length);
  assert.equal(prompts[0].id, createPromptId('Linux Terminal', 'run commands'));
});

test('normalizeCatalogEntries asigna categoría', () => {
  const byTitle = Object.fromEntries(
    normalizeCatalogEntries(raw).map((item) => [item.act, item.category]),
  );

  assert.equal(byTitle['Linux Terminal'], 'code');
  assert.equal(byTitle['Essay Writer'], 'write');
});

test('normalizeCatalogEntries tolera entradas inválidas', () => {
  assert.deepEqual(normalizeCatalogEntries([]), []);
  assert.deepEqual(normalizeCatalogEntries([null, 'texto', 42]), []);
});

test('parseCatalogPayload acepta el objeto con metadatos y el array plano', () => {
  const fromObject = parseCatalogPayload({ count: 1, prompts: raw });
  const fromArray = parseCatalogPayload(raw);

  assert.equal(fromObject.length, fromArray.length);
});

test('parseCatalogPayload rechaza formatos desconocidos', () => {
  assert.throws(() => parseCatalogPayload(null), /formato esperado/);
  assert.throws(() => parseCatalogPayload({ prompts: 'no' }), /formato esperado/);
  assert.throws(() => parseCatalogPayload({}), /formato esperado/);
});

test('el snapshot versionado es válido y coincide con su propio conteo', async () => {
  const payload = JSON.parse(
    await readFile(new URL('../data/prompts.json', import.meta.url), 'utf8'),
  );

  assert.equal(payload.source, 'https://raw.githubusercontent.com/f/prompts.chat/main/prompts.csv');
  assert.equal(typeof payload.generatedAt, 'string');
  assert.ok(Number.isFinite(Date.parse(payload.generatedAt)));
  assert.ok(payload.count > 1000);
  assert.equal(payload.count, payload.prompts.length);

  const ids = new Set(payload.prompts.map((item) => item.id));

  assert.equal(ids.size, payload.prompts.length);
  assert.equal(
    payload.prompts[0].id,
    createPromptId(payload.prompts[0].act, payload.prompts[0].prompt),
  );
});
