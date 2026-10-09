import { zip, strToU8 } from 'fflate';

type Row = Record<string, unknown>;

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  let s = typeof value === 'object' ? JSON.stringify(value) : String(value);
  // Neutralise spreadsheet formula injection.
  if (/^[=+\-@\t\r]/.test(s) && typeof value === 'string') s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Rows to RFC 4180 CSV (UTF-8 BOM so Excel reads accents correctly). */
export function toCsv(rows: Row[]): string {
  if (!rows.length) return '';
  const cols = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  return '﻿' + [cols.join(','), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(','))].join('\r\n');
}

const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
  'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov', 'application/pdf': 'pdf',
};

async function fetchMedia(url: string): Promise<{ data: Uint8Array; ext: string } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const type = (res.headers.get('content-type') || '').split(';')[0];
    return { data: new Uint8Array(await res.arrayBuffer()), ext: EXT_BY_TYPE[type] || 'bin' };
  } catch {
    return null;
  }
}

/** Builds a ZIP: data.json (everything), one CSV per list, and the user's uploaded media. */
export async function buildExportZip(data: Record<string, unknown>): Promise<Blob> {
  const files: Record<string, Uint8Array> = {
    'data.json': strToU8(JSON.stringify(data, null, 2)),
  };
  const readme = ['Your Donjo data export', '', 'data.json: everything in one structured file.', 'csv/: one spreadsheet per list (open in Excel or Google Sheets).', 'media/: files you uploaded (profile photo, company logo, videos).', ''];

  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value) && value.length) {
      const rows = value.map((v) => (v !== null && typeof v === 'object' ? (v as Row) : { value: v }));
      files[`csv/${key}.csv`] = strToU8(toCsv(rows));
    }
  }

  const media: { name: string; url: string }[] = [];
  const profile = data.profile as Row | null;
  const employer = data.employerProfile as Row | null;
  if (typeof profile?.avatar === 'string') media.push({ name: 'profile-photo', url: profile.avatar });
  if (typeof employer?.companyLogoUrl === 'string') media.push({ name: 'company-logo', url: employer.companyLogoUrl });
  for (const v of (data.videos as Row[] | undefined) ?? []) {
    if (typeof v.videoUrl === 'string') media.push({ name: `video-${String(v.id)}`, url: v.videoUrl });
  }
  const skipped: string[] = [];
  for (const m of media) {
    const got = await fetchMedia(m.url);
    if (got) files[`media/${m.name}.${got.ext}`] = got.data;
    else skipped.push(`${m.name}: ${m.url}`);
  }
  if (skipped.length) readme.push('Some files could not be downloaded and are listed here by link:', ...skipped, '');
  files['README.txt'] = strToU8(readme.join('\n'));

  const bytes = await new Promise<Uint8Array>((resolve, reject) =>
    zip(files, { level: 0 }, (err, out) => (err ? reject(err) : resolve(out)))
  );
  return new Blob([bytes], { type: 'application/zip' });
}
