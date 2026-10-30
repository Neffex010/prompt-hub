import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildChatGptUrl,
  buildClaudeUrl,
  buildShareUrl,
  decodeShareValues,
  encodeShareValues,
  parseShareHash,
} from '../js/features/share.js';

test('encodeShareValues devuelve cadena vacía sin valores', () => {
  assert.equal(encodeShareValues({}), '');
  assert.equal(encodeShareValues({ a: '', b: '   ' }), '');
});

test('encodeShareValues / decodeShareValues hacen roundtrip UTF-8', () => {
  const values = {
    tema: 'Programación funcional',
    tono: 'formal',
    emoji: '🚀',
  };

  const encoded = encodeShareValues(values);

  assert.match(encoded, /^[A-Za-z0-9_-]+$/);
  assert.deepEqual(decodeShareValues(encoded), values);
});

test('decodeShareValues tolera entradas inválidas', () => {
  assert.deepEqual(decodeShareValues(''), {});
  assert.deepEqual(decodeShareValues('no-es-base64url'), {});
});

test('buildShareUrl incluye id y valores', () => {
  const url = buildShareUrl(
    'p_abc',
    { tema: 'APIs' },
    'https://example.com/prompt-hub/',
  );

  assert.ok(url.startsWith('https://example.com/prompt-hub/#'));
  assert.ok(url.includes('p=p_abc'));
  assert.ok(url.includes('v='));
});

test('buildShareUrl omite v cuando no hay valores', () => {
  const url = buildShareUrl('p_abc', {}, 'https://example.com/');

  assert.equal(url, 'https://example.com/#p=p_abc');
});

test('parseShareHash extrae id y valores', () => {
  const url = buildShareUrl(
    'p_abc',
    { tema: 'APIs' },
    'https://example.com/base/',
  );
  const parsed = parseShareHash(new URL(url).hash);

  assert.equal(parsed.promptId, 'p_abc');
  assert.deepEqual(parsed.values, { tema: 'APIs' });
});

test('parseShareHash devuelve null sin hash o sin id', () => {
  assert.equal(parseShareHash(''), null);
  assert.equal(parseShareHash('#'), null);
  assert.equal(parseShareHash('#v=abc'), null);
});

test('deep links codifican el texto', () => {
  const text = 'Hola mundo & "comillas"';

  assert.equal(
    buildChatGptUrl(text),
    `https://chatgpt.com/?q=${encodeURIComponent(text)}`,
  );
  assert.equal(
    buildClaudeUrl(text),
    `https://claude.ai/new?q=${encodeURIComponent(text)}`,
  );
});
