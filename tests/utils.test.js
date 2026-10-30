import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createPromptId,
  detectCategory,
  escapeHTML,
  estimateTokens,
  extractPlaceholders,
  formatCount,
  fuzzyScore,
  hasPlaceholders,
  normalizeText,
  replacePlaceholders,
} from '../js/utils.js';

test('escapeHTML neutraliza etiquetas y comillas', () => {
  assert.equal(
    escapeHTML('<script>alert("x")</script>'),
    '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;',
  );
});

test('normalizeText elimina acentos y unifica mayúsculas', () => {
  assert.equal(normalizeText('Programación ÁRBOL'), 'programacion arbol');
});

test('fuzzyScore encuentra coincidencias directas y sin acentos', () => {
  assert.ok(fuzzyScore('Linux Terminal', 'linux') > 0);
  assert.ok(fuzzyScore('Programación funcional', 'programacion') > 0);
  assert.ok(fuzzyScore('English Translator', 'translator') > 0);
});

test('fuzzyScore soporta subsecuencias y varios términos', () => {
  assert.ok(fuzzyScore('translation', 'trsl') > 0);
  assert.ok(fuzzyScore('Senior Python Developer', 'python dev') > 0);
});

test('fuzzyScore devuelve 0 cuando no hay coincidencia', () => {
  assert.equal(fuzzyScore('Linux Terminal', 'kubernetes'), 0);
  assert.equal(fuzzyScore('abc', 'xyz'), 0);
});

test('fuzzyScore no aplica subsecuencias a términos largos', () => {
  const longPrompt =
    'You are a helpful assistant. Write a detailed report about the latest trends in technology and summarize the results for the team.';

  assert.equal(fuzzyScore(longPrompt, 'translator'), 0);
});

test('createPromptId es determinista y distingue contenido', () => {
  const a = createPromptId('Act', 'Haz algo');
  const b = createPromptId('Act', 'Haz algo');
  const c = createPromptId('Act', 'Haz otra cosa');

  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.match(a, /^p_[a-z0-9]+$/);
});

test('extractPlaceholders soporta los tres formatos y deduplica', () => {
  const prompt = 'Act as ${role:experto} about [topic] with {tone} and ${role:repetido}';

  assert.deepEqual(extractPlaceholders(prompt), ['role', 'topic', 'tone']);
});

test('hasPlaceholders detecta cada formato', () => {
  assert.equal(hasPlaceholders('Hola ${name}'), true);
  assert.equal(hasPlaceholders('Hola [name]'), true);
  assert.equal(hasPlaceholders('Hola {name}'), true);
  assert.equal(hasPlaceholders('Hola mundo'), false);
});

test('replacePlaceholders rellena valores y conserva los vacíos', () => {
  const prompt = 'Escribe ${tema:desc} en [idioma] con {tono}';

  assert.equal(
    replacePlaceholders(prompt, { tema: 'APIs', idioma: 'español', tono: 'formal' }),
    'Escribe APIs en español con formal',
  );

  assert.equal(
    replacePlaceholders(prompt, { tema: 'APIs' }),
    'Escribe APIs en [idioma] con [tono]',
  );
});

test('formatCount usa separadores de miles', () => {
  assert.match(formatCount(12345), /^12[.,\s]?345$/);
});

test('estimateTokens usa ~4 caracteres por token', () => {
  assert.equal(estimateTokens(''), 0);
  assert.equal(estimateTokens('12345678'), 2);
});

test('detectCategory clasifica por palabras clave', () => {
  assert.equal(detectCategory('Linux Terminal', 'run commands'), 'code');
  assert.equal(detectCategory('Essay Writer', 'write a novel'), 'write');
  assert.equal(detectCategory('Math Teacher', 'explain algebra'), 'teach');
  assert.equal(detectCategory('Travel Guide', 'suggest cities'), 'general');
});
