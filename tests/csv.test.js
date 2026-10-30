import test from 'node:test';
import assert from 'node:assert/strict';

import { parseCSV } from '../js/csv.js';

test('parseCSV devuelve [] con entrada vacía', () => {
  assert.deepEqual(parseCSV(''), []);
});

test('parseCSV lee cabecera y filas simples', () => {
  const rows = parseCSV('act,prompt\nLinux,run commands\nWriter,write text\n');

  assert.deepEqual(rows, [
    { act: 'Linux', prompt: 'run commands' },
    { act: 'Writer', prompt: 'write text' },
  ]);
});

test('parseCSV soporta BOM y CRLF', () => {
  const rows = parseCSV('\uFEFFact,prompt\r\nLinux,run commands\r\n');

  assert.deepEqual(rows, [{ act: 'Linux', prompt: 'run commands' }]);
});

test('parseCSV respeta comas dentro de comillas', () => {
  const rows = parseCSV('act,prompt\nTest,"hello, world"\n');

  assert.equal(rows[0].prompt, 'hello, world');
});

test('parseCSV desescapa comillas dobles', () => {
  const rows = parseCSV('act,prompt\nTest,"say ""hi"" now"\n');

  assert.equal(rows[0].prompt, 'say "hi" now');
});

test('parseCSV soporta saltos de línea embebidos', () => {
  const rows = parseCSV('act,prompt\nTest,"line one\nline two"\n');

  assert.equal(rows.length, 1);
  assert.equal(rows[0].prompt, 'line one\nline two');
});

test('parseCSV ignora filas completamente vacías', () => {
  const rows = parseCSV('act,prompt\n\nLinux,run commands\n\n');

  assert.equal(rows.length, 1);
});

test('parseCSV rellena columnas faltantes con cadena vacía', () => {
  const rows = parseCSV('act,prompt\nSolo titulo\n');

  assert.deepEqual(rows, [{ act: 'Solo titulo', prompt: '' }]);
});
