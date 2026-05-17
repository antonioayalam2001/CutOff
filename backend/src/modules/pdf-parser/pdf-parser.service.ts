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
  const dmy = s.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  const dmy2 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy2) {
    const d = dmy2[1].padStart(2, '0');
    const m = dmy2[2].padStart(2, '0');
    return `${dmy2[3]}-${m}-${d}`;
  }
  const mon = s.match(/^(\d{2})-([A-Za-z]{3,4})-(\d{4})$/);
  if (mon) {
    const m = MONTH_MAP[mon[2].toLowerCase().slice(0, 3)];
    if (m) return `${mon[3]}-${m}-${mon[1]}`;
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

function parseOcrText(text: string): ParsedTransaction[] {
  const results: ParsedTransaction[] = [];
  const seen = new Set<string>();
  const dateQueue: string[] = [];
  const DATE_PATTERN = /(\d{2}-[A-Za-z]{3,4}-\d{4})|(\d{2}[/-]\d{2}[/-]\d{4})/;

  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const dateMatch = trimmed.match(DATE_PATTERN);
    const amounts = [...trimmed.matchAll(/([\d,]+\.\d{2})/g)]
      .map((m) => parseAmountFromOcr(m[1]))
      .filter((n): n is number => n !== null);

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

@Injectable()
export class PdfParserService {
  async extractFromImage(buffer: Buffer): Promise<{ transactions: ParsedTransaction[]; ocrRaw: string }> {
    const Tesseract = await import('tesseract.js');
    const worker = await Tesseract.createWorker('spa+eng', Tesseract.OEM.LSTM_ONLY, {
      logger: () => {},
    });

    try {
      await worker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
      });
      const { data } = await worker.recognize(buffer);
      const transactions = parseOcrText(data.text);
      return { transactions, ocrRaw: data.text };
    } finally {
      await worker.terminate();
    }
  }
}
