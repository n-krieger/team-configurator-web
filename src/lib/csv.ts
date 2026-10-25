/** Minimal RFC 4180 CSV reader/writer with delimiter detection (Excel uses ";" in many locales). */

export type Delimiter = ',' | ';' | '\t';

export function detectDelimiter(text: string): Delimiter {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  const counts = ([';', ',', '\t'] as const).map((d) => [d, firstLine.split(d).length] as const);
  counts.sort((x, y) => y[1] - x[1]);
  return counts[0][1] > 1 ? counts[0][0] : ',';
}

export function parseCsv(input: string, delimiter: Delimiter = detectDelimiter(input)): string[][] {
  const text = input.replace(/^﻿/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
    } else if (ch === '"' && field === '') {
      quoted = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += ch;
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  // Excel pads rows with empty cells; drop the trailing ones
  return rows.map((r) => {
    let end = r.length;
    while (end > 0 && r[end - 1].trim() === '') end--;
    return r.slice(0, end).map((c) => c.trim());
  });
}

function escape(value: string, delimiter: Delimiter): string {
  return /["\r\n]/.test(value) || value.includes(delimiter) || /^\s|\s$/.test(value)
    ? `"${value.replace(/"/g, '""')}"`
    : value;
}

export function toCsv(rows: string[][], delimiter: Delimiter): string {
  return rows.map((r) => r.map((c) => escape(c, delimiter)).join(delimiter)).join('\r\n') + '\r\n';
}
