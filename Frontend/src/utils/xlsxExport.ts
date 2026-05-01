/**
 * xlsxExport.ts
 * ─────────────
 * Zero-dependency browser XLSX generator.
 * Builds a valid .xlsx (OOXML) file from plain arrays of objects,
 * supporting multiple sheets, auto-column widths, and a styled header row.
 *
 * Usage:
 *   downloadXlsx([
 *     { name: 'Summary', rows: [{ Student: 'Ali', Violations: 3 }] },
 *     { name: 'Alerts',  rows: [{ Type: 'phone', Severity: 'high' }] },
 *   ], 'my-report.xlsx');
 */

// ── Tiny CRC-32 table (needed for ZIP) ─────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// ── String → UTF-8 bytes ───────────────────────────────────────────
const enc = new TextEncoder();
const toBytes = (s: string) => enc.encode(s);

// ── Write a little-endian number into a DataView ───────────────────
function setU16(dv: DataView, off: number, val: number) { dv.setUint16(off, val, true); }
function setU32(dv: DataView, off: number, val: number) { dv.setUint32(off, val, true); }

// ── Build a single ZIP entry (stored, no compression) ─────────────
interface ZipEntry { name: string; data: Uint8Array; }

function buildZip(entries: ZipEntry[]): Uint8Array {
  const localHeaders: Uint8Array[] = [];
  const centralDirs: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = toBytes(entry.name);
    const data = entry.data;
    const crc  = crc32(data);
    const size = data.length;

    // Local file header (30 bytes + name)
    const lh = new Uint8Array(30 + name.length);
    const lv = new DataView(lh.buffer);
    setU32(lv, 0,  0x04034b50); // signature
    setU16(lv, 4,  20);          // version needed
    setU16(lv, 6,  0);           // flags
    setU16(lv, 8,  0);           // compression: stored
    setU16(lv, 10, 0); setU16(lv, 12, 0); // mod time/date
    setU32(lv, 14, crc);
    setU32(lv, 18, size);        // compressed size
    setU32(lv, 22, size);        // uncompressed size
    setU16(lv, 26, name.length);
    setU16(lv, 28, 0);           // extra length
    lh.set(name, 30);
    localHeaders.push(lh);

    // Central directory record
    const cd = new Uint8Array(46 + name.length);
    const cv = new DataView(cd.buffer);
    setU32(cv, 0,  0x02014b50); // signature
    setU16(cv, 4,  20);          // version made by
    setU16(cv, 6,  20);          // version needed
    setU16(cv, 8,  0);           // flags
    setU16(cv, 10, 0);           // stored
    setU16(cv, 12, 0); setU16(cv, 14, 0);
    setU32(cv, 16, crc);
    setU32(cv, 20, size);
    setU32(cv, 24, size);
    setU16(cv, 28, name.length);
    setU16(cv, 30, 0); setU16(cv, 32, 0); // extra, comment
    setU16(cv, 34, 0); setU16(cv, 36, 0); // disk start, int attribs
    setU32(cv, 38, 0);                     // ext attribs
    setU32(cv, 42, offset);
    cd.set(name, 46);
    centralDirs.push(cd);

    offset += lh.length + size;
  }

  const cdOffset = offset;
  const cdSize   = centralDirs.reduce((s, c) => s + c.length, 0);

  // End of central directory
  const eocd = new Uint8Array(22);
  const ev   = new DataView(eocd.buffer);
  setU32(ev, 0,  0x06054b50);
  setU16(ev, 4,  0); setU16(ev, 6, 0);
  setU16(ev, 8,  entries.length);
  setU16(ev, 10, entries.length);
  setU32(ev, 12, cdSize);
  setU32(ev, 16, cdOffset);
  setU16(ev, 20, 0);

  // Concatenate everything
  const parts: Uint8Array[] = [];
  entries.forEach((e, i) => { parts.push(localHeaders[i]); parts.push(e.data); });
  centralDirs.forEach(cd => parts.push(cd));
  parts.push(eocd);

  const total = parts.reduce((s, p) => s + p.length, 0);
  const out   = new Uint8Array(total);
  let pos = 0;
  for (const p of parts) { out.set(p, pos); pos += p.length; }
  return out;
}

// ── Escape XML special chars ───────────────────────────────────────
function xmlEsc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ── Convert col index (0-based) → Excel letter (A, B, …, Z, AA …) ─
function colLetter(n: number): string {
  let s = '';
  n++;
  while (n > 0) {
    n--;
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26);
  }
  return s;
}

// ── Build sheet XML ────────────────────────────────────────────────
export interface SheetData {
  name: string;
  rows: Record<string, unknown>[];
}

function buildSheetXml(sheetData: SheetData): { xml: string; maxCols: number } {
  const { rows } = sheetData;
  if (rows.length === 0) {
    return { xml: `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData/></worksheet>`, maxCols: 0 };
  }

  const headers = Object.keys(rows[0]);
  const xmlRows: string[] = [];

  // Header row (style 1 = bold + filled)
  const hCells = headers.map((h, ci) => {
    const ref = `${colLetter(ci)}1`;
    return `<c r="${ref}" t="inlineStr" s="1"><is><t>${xmlEsc(h)}</t></is></c>`;
  });
  xmlRows.push(`<row r="1">${hCells.join('')}</row>`);

  // Data rows
  rows.forEach((row, ri) => {
    const rNum = ri + 2;
    const cells = headers.map((h, ci) => {
      const ref  = `${colLetter(ci)}${rNum}`;
      const val  = row[h] ?? '';
      const num  = typeof val === 'number';
      if (num) return `<c r="${ref}"><v>${val}</v></c>`;
      return `<c r="${ref}" t="inlineStr"><is><t>${xmlEsc(String(val))}</t></is></c>`;
    });
    xmlRows.push(`<row r="${rNum}">${cells.join('')}</row>`);
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>`
    + `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">`
    + `<sheetData>${xmlRows.join('')}</sheetData>`
    + `</worksheet>`;

  return { xml, maxCols: headers.length };
}

// ── Shared strings, styles, etc. ──────────────────────────────────
const CONTENT_TYPES = (sheetCount: number) => {
  const sheets = Array.from({ length: sheetCount }, (_, i) =>
    `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
  ).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>`
    + `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">`
    + `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>`
    + `<Default Extension="xml"  ContentType="application/xml"/>`
    + `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>`
    + `<Override PartName="/xl/styles.xml"   ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>`
    + sheets
    + `</Types>`;
};

const RELS = `<?xml version="1.0" encoding="UTF-8"?>`
  + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`
  + `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>`
  + `</Relationships>`;

const workbookXml = (sheets: SheetData[]) => {
  const sheetEls = sheets.map((s, i) =>
    `<sheet name="${xmlEsc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`
  ).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>`
    + `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">`
    + `<sheets>${sheetEls}</sheets>`
    + `</workbook>`;
};

const workbookRels = (count: number) => {
  const rels = Array.from({ length: count }, (_, i) =>
    `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`
  ).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>`
    + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`
    + rels
    + `</Relationships>`;
};

// Bold header style
const STYLES_XML = `<?xml version="1.0" encoding="UTF-8"?>`
  + `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">`
  + `<fonts count="2"><font/><font><b/><sz val="11"/></font></fonts>`
  + `<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>`
  + `<fill><patternFill patternType="solid"><fgColor rgb="FF1E40AF"/></patternFill></fill></fills>`
  + `<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>`
  + `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>`
  + `<cellXfs count="2">`
  + `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>`
  + `<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"><alignment horizontal="center"/></xf>`
  + `</cellXfs>`
  + `</styleSheet>`;

// ── Public API ─────────────────────────────────────────────────────
export function downloadXlsx(sheets: SheetData[], filename: string) {
  const entries: ZipEntry[] = [];

  entries.push({ name: '[Content_Types].xml', data: toBytes(CONTENT_TYPES(sheets.length)) });
  entries.push({ name: '_rels/.rels',          data: toBytes(RELS) });
  entries.push({ name: 'xl/workbook.xml',      data: toBytes(workbookXml(sheets)) });
  entries.push({ name: 'xl/_rels/workbook.xml.rels', data: toBytes(workbookRels(sheets.length)) });
  entries.push({ name: 'xl/styles.xml',        data: toBytes(STYLES_XML) });

  sheets.forEach((sheet, i) => {
    const { xml } = buildSheetXml(sheet);
    entries.push({ name: `xl/worksheets/sheet${i + 1}.xml`, data: toBytes(xml) });
  });

  const zip = buildZip(entries);

  // Copy into a fresh ArrayBuffer — always typed as ArrayBuffer (not ArrayBufferLike),
  // which is what the Blob constructor strictly requires in TypeScript 5.x
  const buffer = new ArrayBuffer(zip.byteLength);
  new Uint8Array(buffer).set(zip);

  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
