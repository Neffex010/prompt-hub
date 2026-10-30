import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * El precache del service worker es una lista manual. Estos tests fallan
 * si alguien añade un módulo JS y olvida declararlo (lo que dejaría la app
 * a medias cuando no hay red).
 */

const ROOT = fileURLToPath(new URL('..', import.meta.url));

async function listJsFiles(dir = 'js') {
  const entries = await readdir(join(ROOT, dir), { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = `${dir}/${entry.name}`;

    if (entry.isDirectory()) {
      files.push(...(await listJsFiles(path)));
    } else if (entry.name.endsWith('.js')) {
      files.push(path);
    }
  }

  return files;
}

async function readCore() {
  const source = await readFile(join(ROOT, 'sw.js'), 'utf8');
  const match = source.match(/const CORE = \[([\s\S]*?)\];/);

  assert.ok(match, 'sw.js debe declarar la lista CORE');

  return [...match[1].matchAll(/'([^']+)'/g)].map((item) => item[1]);
}

test('CORE incluye todos los módulos JS del proyecto', async () => {
  const core = new Set(await readCore());
  const missing = (await listJsFiles()).filter((path) => !core.has(`./${path.split(sep).join('/')}`));

  assert.deepEqual(missing, [], `Faltan en sw.js: ${missing.join(', ')}`);
});

test('CORE incluye el shell, los datos y los iconos', async () => {
  const core = new Set(await readCore());

  for (const required of [
    './',
    './index.html',
    './manifest.webmanifest',
    './css/styles.css',
    './data/prompts.json',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/icon-maskable-512.png',
  ]) {
    assert.ok(core.has(required), `Falta ${required} en CORE`);
  }
});

test('CORE no tiene entradas duplicadas', async () => {
  const core = await readCore();

  assert.equal(new Set(core).size, core.length);
});

test('el manifest declara iconos 192, 512 y maskable', async () => {
  const manifest = JSON.parse(
    await readFile(join(ROOT, 'manifest.webmanifest'), 'utf8'),
  );

  const sizes = manifest.icons.map((icon) => `${icon.sizes}:${icon.purpose ?? 'any'}`);

  assert.ok(sizes.includes('192x192:any'));
  assert.ok(sizes.includes('512x512:any'));
  assert.ok(sizes.includes('512x512:maskable'));
  assert.equal(manifest.start_url, './');
});

test('los archivos de icono referenciados existen', async () => {
  const manifest = JSON.parse(
    await readFile(join(ROOT, 'manifest.webmanifest'), 'utf8'),
  );

  for (const icon of [...manifest.icons, { src: 'icons/apple-touch-icon.png' }]) {
    const path = join(ROOT, relative(ROOT, join(ROOT, icon.src)));
    const bytes = await readFile(path).then((buffer) => buffer.length);

    assert.ok(bytes > 500, `${icon.src} parece vacío`);
  }
});
