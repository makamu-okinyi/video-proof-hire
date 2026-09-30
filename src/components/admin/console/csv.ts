/** Client-side CSV export (RFC 4180 quoting, UTF-8 BOM so Excel opens it correctly). */

export type CsvCell = string | number | boolean | null | undefined;

function esc(cell: CsvCell): string {
  const s = cell === null || cell === undefined ? '' : String(cell);
  // Neutralise spreadsheet formula injection for text that starts with = + - @
  const safe = /^[=+\-@]/.test(s) && Number.isNaN(Number(s)) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(headers: string[], rows: CsvCell[][]): string {
  return [headers, ...rows].map((r) => r.map(esc).join(',')).join('\r\n');
}

export function downloadCsv(filename: string, headers: string[], rows: CsvCell[][]) {
  const blob = new Blob(['﻿' + toCsv(headers, rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  requestAnimationFrame(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}
