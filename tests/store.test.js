import test from 'node:test';
import assert from 'node:assert/strict';

import {
  filterPrompts,
  getPromptById,
  setPrompts,
  state,
} from '../js/store.js';

const basePrompts = [
  {
    id: 'a',
    act: 'Linux Terminal',
    prompt: 'Act as ${role:experto} and run commands',
    category: 'code',
  },
  {
    id: 'b',
    act: 'English Translator',
    prompt: 'Translate [text] to English',
    category: 'write',
  },
  {
    id: 'c',
    act: 'Math Teacher',
    prompt: 'Explain {topic} simply',
    category: 'teach',
  },
  {
    id: 'd',
    act: 'Travel Guide',
    prompt: 'Suggest places to visit',
    category: 'general',
  },
];

test.beforeEach(() => {
  setPrompts(basePrompts);
  state.currentFilter = 'all';
  state.onlyFavorites = false;
  state.onlyVariables = false;
  state.onlyRecent = false;
});

test('filterPrompts busca por título', () => {
  const result = filterPrompts({ query: 'linux', category: 'all' });

  assert.deepEqual(result.map((item) => item.id), ['a']);
});

test('filterPrompts busca por contenido', () => {
  const result = filterPrompts({ query: 'commands', category: 'all' });

  assert.deepEqual(result.map((item) => item.id), ['a']);
});

test('filterPrompts ignora acentos', () => {
  setPrompts([
    {
      id: 'x',
      act: 'Programación funcional',
      prompt: 'Explica el tema',
      category: 'code',
    },
  ]);

  const result = filterPrompts({ query: 'programacion', category: 'all' });

  assert.equal(result.length, 1);
});

test('filterPrompts filtra por categoría', () => {
  const result = filterPrompts({ query: '', category: 'teach' });

  assert.deepEqual(result.map((item) => item.id), ['c']);
});

test('filterPrompts filtra solo favoritos', () => {
  const result = filterPrompts({
    category: 'all',
    onlyFavorites: true,
    favoriteIds: new Set(['b', 'd']),
  });

  assert.deepEqual(result.map((item) => item.id), ['b', 'd']);
});

test('filterPrompts filtra prompts con variables', () => {
  const result = filterPrompts({ category: 'all', onlyVariables: true });

  assert.deepEqual(result.map((item) => item.id), ['a', 'b', 'c']);
});

test('filterPrompts ordena por recencia cuando onlyRecent está activo', () => {
  const result = filterPrompts({
    category: 'all',
    onlyRecent: true,
    recentIds: ['d', 'a'],
  });

  assert.deepEqual(result.map((item) => item.id), ['d', 'a']);
});

test('filterPrompts ordena A-Z', () => {
  const result = filterPrompts({ category: 'all', sort: 'az' });

  assert.deepEqual(
    result.map((item) => item.act),
    ['English Translator', 'Linux Terminal', 'Math Teacher', 'Travel Guide'],
  );
});

test('filterPrompts ordena por longitud descendente', () => {
  const result = filterPrompts({ category: 'all', sort: 'length' });

  assert.equal(result[0].id, 'a');
});

test('filterPrompts devuelve [] sin coincidencias', () => {
  const result = filterPrompts({ query: 'kubernetes', category: 'all' });

  assert.deepEqual(result, []);
});

test('filterPrompts persiste los flags en el estado', () => {
  filterPrompts({
    category: 'all',
    onlyFavorites: true,
    onlyVariables: true,
    onlyRecent: true,
  });

  assert.equal(state.onlyFavorites, true);
  assert.equal(state.onlyVariables, true);
  assert.equal(state.onlyRecent, true);
});

test('getPromptById devuelve el prompt o null', () => {
  assert.equal(getPromptById('a').act, 'Linux Terminal');
  assert.equal(getPromptById('no-existe'), null);
});
