import { Injectable } from '@nestjs/common';

export interface ParsedTransaction {
  date: string;
  amount: number;
}

const MONTH_MAP: Record<string, string> = {
  jan: '01',
  ene: '01',
  feb: '02',
  mar: '03',
  apr: '04',
  abr: '04',
  may: '05',
  jun: '06',
  jul: '07',
  aug: '08',
  ago: '08',
  sep: '09',
  oct: '10',
  nov: '11',
  dec: '12',
  dic: '12',
};

function normalizeDate(str: string): string | null {
  const s = str.trim();
  const isoMatch = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const dmy = s.match(/^(\d{1,2})\s*[\/\-]\s*(\d{1,2})\s*[\/\-]\s*(\d{4})$/);
  if (dmy) {
    const d = dmy[1].padStart(2, '0');
    const m = dmy[2].padStart(2, '0');
    return `${dmy[3]}-${m}-${d}`;
  }
  const dmy2 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy2) {
    const d = dmy2[1].padStart(2, '0');
    const m = dmy2[2].padStart(2, '0');
    return `${dmy2[3]}-${m}-${d}`;
  }
  const mon = s.match(/^(\d{1,2})\s*-\s*([A-Za-z]{3,4})\s*-\s*(\d{4})$/);
  if (mon) {
    const m = MONTH_MAP[mon[2].toLowerCase().slice(0, 3)];
    if (m) return `${mon[3]}-${m}-${mon[1].padStart(2, '0')}`;
  }
  return null;
}

function parseAmountFromOcr(str: string): number | null {
  let s = str.trim();
  s = s.replace(/^[\$]+/, '');
  s = s.replace(/[MX\s]/g, '');
  const negativo = s.startsWith('-');
  if (negativo) s = s.slice(1);
  s = s.replace(/^\(/, '').replace(/\)$/, '');
  const withCommaDot = s.match(/^([\d,]+)\.(\d{2})$/);
  if (withCommaDot) {
    const n = parseFloat(withCommaDot[1].replace(/,/g, '') + '.' + withCommaDot[2]);
    if (!isNaN(n) && n > 0) return negativo ? -n : n;
  }
  const withDotComma = s.match(/^([\d.]+),(\d{2})$/);
  if (withDotComma) {
    const n = parseFloat(withDotComma[1].replace(/\./g, '') + '.' + withDotComma[2]);
    if (!isNaN(n) && n > 0) return negativo ? -n : n;
  }
  const clean = s.replace(/[^\d.,-]/g, '');
  const n = parseFloat(clean.replace(/,/g, ''));
  if (!isNaN(n) && n > 0) return negativo ? -n : n;
  return null;
}

function tryParseDollarAmount(line: string): number | null {
  const m = line.match(/\$[^0-9]*(\d{3,5})(?:\D|$)/);
  if (!m) return null;
  const digits = m[1];
  if (digits.length < 3) return null;
  const withDecimal = digits.slice(0, -2) + '.' + digits.slice(-2);
  const n = parseFloat(withDecimal);
  if (!isNaN(n) && n > 0 && n < 100000) return n;
  return null;
}

function extractAmounts(line: string): number[] {
  const strict = [...line.matchAll(/([\d,]+\.\d{2})/g)]
    .map((m) => parseAmountFromOcr(m[1]))
    .filter((n): n is number => n !== null);
  if (strict.length > 0) return strict;
  const fallback = tryParseDollarAmount(line);
  return fallback !== null ? [fallback] : [];
}

function parseOcrText(text: string): ParsedTransaction[] {
  const results: ParsedTransaction[] = [];
  const seen = new Set<string>();
  const dateQueue: string[] = [];
  const DATE_PATTERN = /(\d{1,2}\s*-\s*[A-Za-z]{3,4}\s*-\s*\d{4})|(\d{1,2}\s*[\/-]\s*\d{1,2}\s*[\/-]\s*\d{4})/;

  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const dateMatch = trimmed.match(DATE_PATTERN);
    const amounts = extractAmounts(trimmed);

    if (dateMatch) {
      const date = normalizeDate(dateMatch[1] || dateMatch[2]);
      if (date) {
        if (amounts.length > 0) {
          for (const amount of amounts) {
            const key = `${date}|${amount}`;
            if (!seen.has(key)) {
              seen.add(key);
              results.push({ date, amount });
            }
          }
        } else {
          dateQueue.push(date);
        }
        continue;
      }
    }

    if (amounts.length > 0) {
      for (const amount of amounts) {
        const pairedDate = dateQueue.shift();
        if (!pairedDate) break;
        const key = `${pairedDate}|${amount}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({ date: pairedDate, amount });
        }
      }
    }
  }

  return results;
}

async function preprocessImage(buffer: Buffer): Promise<Buffer> {
  try {
    const sharp = await import('sharp');
    const img = sharp.default(buffer).grayscale().threshold(150).png();
    return await img.toBuffer();
  } catch {
    return buffer;
  }
}

@Injectable()
export class PdfParserService {
  async extractFromImage(buffer: Buffer): Promise<{ transactions: ParsedTransaction[]; ocrRaw: string }> {
    const Tesseract = await import('tesseract.js');

    const processedBuffer = await preprocessImage(buffer);

    const worker = await Tesseract.createWorker('spa+eng', Tesseract.OEM.LSTM_ONLY, {
      logger: () => {},
    });

    try {
      await worker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
      });
      const { data } = await worker.recognize(processedBuffer);
      const transactions = parseOcrText(data.text);
      return { transactions, ocrRaw: data.text };
    } finally {
      await worker.terminate();
    }
  }
}
