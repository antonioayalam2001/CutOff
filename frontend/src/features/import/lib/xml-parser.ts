export interface ParsedTransaction {
  date: string;
  amount: number;
}

function normalizeDate(str: string): string | null {
  const s = str.trim();
  // ISO datetime: 2026-01-18T12:00:00
  const isoMatch = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = s.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  return null;
}

function parseAmount(str: string): number | null {
  let s = str.trim();
  s = s.replace(/^[\$]+/, '');
  s = s.replace(/[MX\s]/g, '');
  s = s.replace(',', '');
  const negativo = s.startsWith('-');
  if (negativo) s = s.slice(1);
  s = s.replace(/[()]/g, '');
  const n = parseFloat(s);
  if (isNaN(n) || n <= 0) return null;
  return negativo ? n : n;
}

const CONTAINER_LOCAL_NAMES = new Set([
  'movimiento', 'movimientos', 'movimientosdelcliente',
  'movimientodelclientefiscal',
  'trn', 'transaction',
  'detalle', 'detalles',
  'operacion', 'operaciones',
  'transaccion', 'transacciones',
  'pago', 'pagos',
  'registro', 'registros',
  'item',
]);

const DATE_LOCAL_NAMES = new Set([
  'fecha', 'fechaoperacion', 'fechamovimiento', 'fechacontable',
  'fechavalor', 'date',
]);

const AMOUNT_LOCAL_NAMES = new Set([
  'importe', 'monto', 'amount', 'valor', 'cargo', 'cargos',
]);

function getAttrOrText(el: Element, attrName: string, localNames: Set<string>): string | null {
  const attr = el.getAttribute(attrName);
  if (attr !== null && attr.trim()) return attr.trim();

  for (const child of Array.from(el.children)) {
    if (localNames.has(child.localName.toLowerCase())) {
      const text = child.textContent;
      if (text && text.trim()) return text.trim();
    }
  }
  return null;
}

export function parseXml(xmlText: string): ParsedTransaction[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'text/xml');

  if (doc.querySelector('parsererror')) throw new Error('El archivo XML no es válido');

  const results: ParsedTransaction[] = [];
  const seen = new Set<string>();

  const walk = (el: Element) => {
    if (CONTAINER_LOCAL_NAMES.has(el.localName.toLowerCase())) {
      const fechaRaw = getAttrOrText(el, 'fecha', DATE_LOCAL_NAMES);
      const importeRaw = getAttrOrText(el, 'importe', AMOUNT_LOCAL_NAMES);

      if (fechaRaw && importeRaw) {
        const date = normalizeDate(fechaRaw);
        const amount = parseAmount(importeRaw);
        if (date && amount !== null) {
          const key = `${date}|${amount}`;
          if (!seen.has(key)) {
            seen.add(key);
            results.push({ date, amount });
          }
        }
      }
    }

    for (const child of Array.from(el.children)) {
      walk(child);
    }
  };

  for (const child of Array.from(doc.children)) {
    if (child instanceof Element) walk(child);
  }

  return results;
}
