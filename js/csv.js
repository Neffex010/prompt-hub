/**
 * Parser CSV mínimo (RFC 4180) sin dependencias.
 * Soporta campos entre comillas, comas y saltos de línea embebidos.
 */

/**
 * Convierte texto CSV en un array de objetos usando la primera fila como cabecera.
 * @param {string} text
 * @returns {Array<Record<string, string>>}
 */
export function parseCSV(text = '') {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  const source = text.replace(/^\uFEFF/, '');

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];

    if (inQuotes) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }

  // Última fila sin salto de línea final
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  if (rows.length === 0) return [];

  const header = rows.shift().map((key) => key.trim());

  return rows
    .filter((cells) => cells.some((cell) => cell !== ''))
    .map((cells) => {
      const record = {};
      header.forEach((key, index) => {
        record[key] = cells[index] ?? '';
      });
      return record;
    });
}
