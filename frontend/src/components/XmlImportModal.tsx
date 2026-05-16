'use client';
import { useState, useRef, useMemo, memo, useCallback, startTransition } from 'react';
import { createPortal } from 'react-dom';
import { parseXml, ParsedTransaction } from '@/lib/xml-parser';
import { parseFile } from '@/lib/api';
import { Card } from '@/types';
import { Select } from '@/components/ui/Select';

interface MemberOption {
  userId: string;
  userName: string;
}

interface PreviewRow {
  id: string;
  date: string;
  amount: number;
  concept: string;
  userId: string;
}

interface Props {
  cards: Card[];
  members: MemberOption[];
  currentUserId: string;
  isOwner: boolean;
  onSave: (rows: { cardId: string; userId: string; concept: string; amount: number; transactionDate: string }[]) => Promise<void>;
  onClose: () => void;
}

let rowIdCounter = 0;
const nextId = () => `row_${++rowIdCounter}`;

interface ImportRowProps {
  id: string;
  date: string;
  amount: number;
  concept: string;
  userId: string;
  isOwner: boolean;
  memberOptions: { value: string; label: string }[];
  cardName: string;
  inputClass: string;
  editRef: React.MutableRefObject<Map<string, { date: string; amount: string; concept: string; userId: string }>>;
  onRemove: (id: string) => void;
  onUserChange: (id: string, userId: string) => void;
}

const ImportRow = memo(function ImportRow({
  id, date, amount, concept, userId,
  isOwner, memberOptions, cardName, inputClass,
  editRef, onRemove, onUserChange,
}: ImportRowProps) {
  return (
    <tr className="hover:bg-base-800/30 transition-colors">
      <td className="px-3 py-2">
        <input
          type="date"
          defaultValue={date}
          onChange={(e) => {
            const ref = editRef.current.get(id);
            if (ref) ref.date = e.target.value;
          }}
          className={inputClass}
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="number"
          step="0.01"
          defaultValue={amount}
          onChange={(e) => {
            const ref = editRef.current.get(id);
            if (ref) ref.amount = e.target.value;
          }}
          className={inputClass}
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="text"
          defaultValue={concept}
          onChange={(e) => {
            const ref = editRef.current.get(id);
            if (ref) ref.concept = e.target.value;
          }}
          placeholder="Escribe el concepto"
          className={inputClass}
        />
      </td>
      {isOwner ? (
        <td className="px-3 py-2 min-w-[150px]">
          <select
            value={userId}
            onChange={(e) => onUserChange(id, e.target.value)}
            className="w-full px-2 py-1 text-xs bg-base-800 border border-base-700 rounded-lg text-base-100 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 cursor-pointer"
          >
            <option value="" disabled>¿Quién?</option>
            {memberOptions.map((o) => (
              <option key={o.value} value={o.value} className="bg-base-800">
                {o.label}
              </option>
            ))}
          </select>
        </td>
      ) : (
        <td className="px-3 py-2 text-sm text-base-400">
          {memberOptions.find((m) => m.value === userId)?.label || 'Tú'}
        </td>
      )}
      <td className="px-3 py-2 text-center">
        <span className="text-base-400 text-xs">{cardName || '-'}</span>
      </td>
      <td className="px-3 py-2 text-center">
        <button
          onClick={() => onRemove(id)}
          className="text-base-500 hover:text-red-400 transition-colors p-1"
          title="Eliminar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </td>
    </tr>
  );
});

export function XmlImportModal({ cards, members, currentUserId, isOwner, onSave, onClose }: Props) {
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [cardId, setCardId] = useState('');
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editRef = useRef<Map<string, { date: string; amount: string; concept: string; userId: string }>>(new Map());

  const memberOptions = useMemo(() => members.map((m) => ({ value: m.userId, label: m.userName })), [members]);
  const cardOptions = useMemo(() => cards.map((c) => ({ value: c.id, label: c.name })), [cards]);
  const cardMap = useMemo(() => new Map(cards.map((c) => [c.id, c.name])), [cards]);
  const cardName = useMemo(() => cardMap.get(cardId) || '', [cardMap, cardId]);

  const selectedCard = useMemo(() => cards.find((c) => c.id === cardId), [cards, cardId]);

  const initEditRef = (parsed: ParsedTransaction[]) => {
    const map = new Map<string, { date: string; amount: string; concept: string; userId: string }>();
    const newRows: PreviewRow[] = [];
    parsed.forEach((t) => {
      const id = nextId();
      const userId = isOwner ? '' : currentUserId;
      map.set(id, { date: t.date, amount: String(t.amount), concept: '', userId });
      newRows.push({ id, date: t.date, amount: t.amount, concept: '', userId });
    });
    editRef.current = map;
    setRows(newRows);
  };

  const handleFile = async (file: File) => {
    setError('');
    const isXml = file.name.endsWith('.xml');
    const isImage = /\.(png|jpg|jpeg)$/i.test(file.name);

    if (!isXml && !isImage) {
      setError('Solo se permiten archivos XML o imágenes (PNG/JPG)');
      return;
    }

    let parsed: ParsedTransaction[];

    if (isXml) {
      const text = await file.text();
      try {
        parsed = parseXml(text);
      } catch (e) {
        setError((e as Error).message);
        return;
      }
    } else {
      setProcessing(true);
      try {
        parsed = await parseFile(file, selectedCard?.bankProfileId || 'generico');
      } catch (e: any) {
        const errData = e?.response?.data;
        if (errData?.ocrRaw) {
          console.log('=== OCR RAW TEXT ===');
          console.log(errData.ocrRaw);
          console.log('=== END OCR RAW ===');
        }
        setError(errData?.message || 'Error al procesar el archivo');
        setProcessing(false);
        return;
      }
      setProcessing(false);
    }

    if (parsed.length === 0) {
      setError('No se encontraron transacciones en el archivo');
      return;
    }
    initEditRef(parsed);
    setStep('preview');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const removeRow = useCallback((id: string) => {
    editRef.current.delete(id);
    setRows((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const handleUserChange = useCallback((id: string, userId: string) => {
    const ref = editRef.current.get(id);
    if (ref) ref.userId = userId;
    startTransition(() => {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, userId } : r)));
    });
  }, []);

  const handleSave = async () => {
    if (!cardId) { setError('Selecciona una tarjeta'); return; }
    const allRows = rows.map((r) => {
      const ref = editRef.current.get(r.id);
      return {
        ...r,
        date: ref?.date ?? r.date,
        amount: parseFloat(ref?.amount ?? String(r.amount)) || 0,
        concept: ref?.concept ?? r.concept,
        userId: ref?.userId ?? r.userId,
      };
    });
    const invalid = allRows.find((r) => !r.concept.trim() || !r.userId);
    if (invalid) {
      setError('Todos los gastos deben tener concepto y usuario');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave(allRows.map((r) => ({
        cardId,
        userId: r.userId,
        concept: r.concept.trim(),
        amount: r.amount,
        transactionDate: r.date,
      })));
      onClose();
    } catch {
      setError('Error al guardar los gastos');
    } finally {
      setSaving(false);
    }
  };

  const totalAmount = useMemo(() => rows.reduce((s, r) => s + r.amount, 0), [rows]);
  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);

  const inputClass = 'w-full px-2 py-1 text-sm bg-base-800 border border-base-700 rounded-lg text-base-100 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20';

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-base-900 border border-base-700 rounded-2xl shadow-2xl animate-scale-in p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-base-100 font-display">Importar gastos</h2>
          <button onClick={onClose} className="text-base-500 hover:text-base-300 transition-colors p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <div className="max-w-xs">
          <Select
            label="Tarjeta"
            value={cardId}
            onChange={setCardId}
            options={cardOptions}
            placeholder="Seleccionar tarjeta"
            required
          />
        </div>

        {step === 'upload' && (
          <>
            {processing ? (
              <div className="border-2 border-dashed border-base-700 rounded-xl p-12 text-center">
                <div className="inline-flex items-center gap-3 mb-3">
                  <svg className="animate-spin h-8 w-8 text-primary-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-base-300 font-medium">Procesando imagen...</span>
                </div>
                <p className="text-base-600 text-sm">Extrayendo transacciones con OCR</p>
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-base-700 hover:border-primary-500/50 rounded-xl p-12 text-center cursor-pointer transition-colors"
              >
                <svg className="w-10 h-10 mx-auto text-base-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-base-300 font-medium">Arrastra un archivo XML o imagen aquí o haz clic para seleccionar</p>
                <p className="text-base-600 text-sm mt-1">XML de estado de cuenta o imagen (PNG/JPG)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xml,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
              </div>
            )}
          </>
        )}

        {step === 'preview' && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-base-400">
                {rows.length} gasto{rows.length !== 1 ? 's' : ''} encontrado{rows.length !== 1 ? 's' : ''}
                {' — '}Total: <span className="text-primary-400 font-medium">{formatCurrency(totalAmount)}</span>
              </p>
              <button
                onClick={() => { setStep('upload'); setRows([]); setError(''); }}
                className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
              >
                Subir otro archivo
              </button>
            </div>

            <div className="overflow-x-auto border border-base-800 rounded-xl">
              <table className="min-w-full divide-y divide-base-800 text-sm">
                <thead className="bg-base-900/50">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-base-400 uppercase tracking-wider">Fecha</th>
                    <th className="px-3 py-2.5 text-right text-xs font-medium text-base-400 uppercase tracking-wider">Monto</th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-base-400 uppercase tracking-wider">Concepto</th>
                    {isOwner && <th className="px-3 py-2.5 text-left text-xs font-medium text-base-400 uppercase tracking-wider">Usuario</th>}
                    <th className="px-3 py-2.5 text-center text-xs font-medium text-base-400 uppercase tracking-wider">Tarjeta</th>
                    <th className="px-3 py-2.5 text-center text-xs font-medium text-base-400 uppercase tracking-wider" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-800">
                  {rows.map((row) => (
                    <ImportRow
                      key={row.id}
                      {...row}
                      isOwner={isOwner}
                      memberOptions={memberOptions}
                      cardName={cardName}
                      inputClass={inputClass}
                      editRef={editRef}
                      onRemove={removeRow}
                      onUserChange={handleUserChange}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-base-400 hover:text-base-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || rows.length === 0}
                className="px-5 py-2 text-sm font-medium bg-primary-500 hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-all"
              >
                {saving ? 'Guardando...' : `Guardar ${rows.length} gasto${rows.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
