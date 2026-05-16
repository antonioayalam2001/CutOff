'use client';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Card, ExpenseSplit } from '@/types';

interface ExpenseFormData {
  cardId: string;
  userId?: string;
  concept: string;
  amount: number;
  transactionDate: string;
  isMSI?: boolean;
  totalInstallments?: number;
  isRecurring?: boolean;
  recurringMonths?: number;
  isSplit?: boolean;
  splits?: ExpenseSplit[];
}

interface InitialExpenseData {
  id: string;
  cardId: string;
  userId?: string;
  concept: string;
  amount: string;
  transactionDate: string;
  isMSI: boolean;
  totalInstallments?: number | null;
  currentInstallment?: number | null;
  isRecurring: boolean;
  recurringTotalMonths?: number | null;
  recurringCurrentMonth?: number | null;
  isSplit: boolean;
}

interface Props {
  cards: Card[];
  isOwner: boolean;
  members: { userId: string; userName: string }[];
  onSubmit?: (data: ExpenseFormData) => Promise<void>;
  onSubmitEdit?: (expenseId: string, data: ExpenseFormData) => Promise<void>;
  isLoading?: boolean;
  initialData?: InitialExpenseData;
}

function Toggle({ id, checked, onChange, label, disabled }: { id: string; checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <label htmlFor={id} className={`flex items-center gap-3 cursor-pointer group select-none ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
      <div className="relative">
        <input type="checkbox" id={id} checked={checked} onChange={(e) => { if (!disabled) onChange(e.target.checked); }} className="sr-only" disabled={disabled} />
        <div className={`w-11 h-6 rounded-full transition-colors duration-300 flex items-center shrink-0 ${checked ? 'bg-primary-500' : 'bg-base-700'}`}>
          <div className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-300 ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
        </div>
      </div>
      <span className="text-sm text-base-300 group-hover:text-base-200 transition-colors">{label}</span>
    </label>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="relative pt-4">
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-base-800" />
      </div>
      <div className="relative flex justify-start">
        <span className="pr-3 text-xs font-medium tracking-widest uppercase text-base-500 bg-base-950">{label}</span>
      </div>
    </div>
  );
}

export function ExpenseForm({ cards, isOwner, members, onSubmit, onSubmitEdit, isLoading, initialData }: Props) {
  const isEditMode = !!initialData;
  const isSimpleExpense = initialData && !initialData.isMSI && !initialData.isRecurring && !initialData.isSplit;

  const [cardId, setCardId] = useState(initialData?.cardId || '');
  const [userId, setUserId] = useState(initialData?.userId || '');
  const [concept, setConcept] = useState(initialData?.concept || '');
  const [amount, setAmount] = useState(initialData && !initialData.isSplit ? initialData.amount : '');
  const [totalAmount, setTotalAmount] = useState(initialData?.isSplit ? initialData.amount : '');
  const [transactionDate, setTransactionDate] = useState(
    initialData?.transactionDate || (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })(),
  );
  const [isMSI, setIsMSI] = useState(initialData?.isMSI || false);
  const [totalInstallments, setTotalInstallments] = useState(String(initialData?.totalInstallments || '3'));
  const [isRecurring, setIsRecurring] = useState(initialData?.isRecurring || false);
  const [recurringMonths, setRecurringMonths] = useState(String(initialData?.recurringTotalMonths || '3'));
  const [isSplit, setIsSplit] = useState(initialData?.isSplit || false);
  const [selectedSplitUsers, setSelectedSplitUsers] = useState<Set<string>>(new Set());
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [equalSplit, setEqualSplit] = useState(true);

  useEffect(() => {
    if (initialData?.isSplit) {
      setIsSplit(true);
    }
  }, [initialData?.isSplit]);

  const memberOptions = useMemo(() => members.map((m) => ({ value: m.userId, label: m.userName })), [members]);
  const memberMap = useMemo(() => new Map(members.map((m) => [m.userId, m.userName])), [members]);

  const splitTarget = useMemo(() => {
    if (!isSplit) return 0;
    if (isMSI && totalInstallments) {
      return (parseFloat(totalAmount) || 0) / parseInt(totalInstallments, 10);
    }
    return parseFloat(totalAmount) || 0;
  }, [isSplit, isMSI, totalAmount, totalInstallments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data: ExpenseFormData = {
      cardId,
      userId: isOwner && userId ? userId : undefined,
      concept,
      amount: isSplit ? parseFloat(totalAmount) : parseFloat(amount),
      transactionDate,
    };

    if (isMSI) {
      data.isMSI = true;
      data.totalInstallments = parseInt(totalInstallments, 10);
    }

    if (isRecurring) {
      data.isRecurring = true;
      data.recurringMonths = parseInt(recurringMonths, 10);
    }

    if (isSplit) {
      data.isSplit = true;
      data.splits = Array.from(selectedSplitUsers).map((uid) => ({
        userId: uid,
        amount: equalSplit ? splitTarget / selectedSplitUsers.size : parseFloat(customAmounts[uid] || '0'),
      }));
    }

    if (isEditMode && onSubmitEdit && initialData) {
      await onSubmitEdit(initialData.id, data);
    } else if (onSubmit) {
      await onSubmit(data);
    }

    if (!isEditMode) {
      setConcept('');
      setAmount('');
      setTotalAmount('');
      setCardId('');
      setIsMSI(false);
      setIsRecurring(false);
      setIsSplit(false);
      setSelectedSplitUsers(new Set());
      setCustomAmounts({});
      setEqualSplit(true);
    }
  };

  const toggleSplitUser = useCallback((uid: string) => {
    setSelectedSplitUsers((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid); else next.add(uid);
      return next;
    });
    setCustomAmounts((prev) => {
      const next = { ...prev };
      if (next[uid] !== undefined) delete next[uid];
      return next;
    });
  }, []);

  const handleEqualSplit = useCallback(() => {
    setEqualSplit(true);
    setCustomAmounts({});
  }, []);

  const handleCustomSplit = useCallback(() => {
    setEqualSplit(false);
    const perUser = splitTarget / (selectedSplitUsers.size || 1);
    const amounts: Record<string, string> = {};
    selectedSplitUsers.forEach((uid) => {
      amounts[uid] = perUser ? perUser.toFixed(2) : '0';
    });
    setCustomAmounts(amounts);
  }, [splitTarget, selectedSplitUsers]);

  const splitSum = useMemo(() => {
    if (!isSplit || selectedSplitUsers.size === 0) return 0;
    if (equalSplit) return splitTarget;
    return Object.values(customAmounts).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  }, [isSplit, selectedSplitUsers, equalSplit, customAmounts, splitTarget]);

  const splitTotalValid = isSplit && selectedSplitUsers.size > 0 && Math.abs(splitSum - splitTarget) < 0.01;

  const isBlockedExpense = initialData && (initialData.isMSI || initialData.isRecurring || initialData.isSplit);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <SectionDivider label={isEditMode ? 'Editar gasto' : 'Información general'} />

      {isEditMode && (
        <div className="text-sm text-base-500 bg-base-900/50 rounded-xl border border-base-800/50 px-4 py-3">
          Editando gasto · {isBlockedExpense ? 'Campos bloqueados por tipo de gasto' : 'Todos los campos editables'}
        </div>
      )}

      <Select
        label="Tarjeta"
        value={cardId}
        onChange={setCardId}
        options={cards.map((c) => ({ value: c.id, label: `${c.name} (••••${c.lastFourDigits})` }))}
        placeholder="Seleccionar tarjeta"
        {...(isBlockedExpense ? { className: 'pointer-events-none opacity-50' } : {})}
      />

      {isOwner && !isSplit && !initialData?.isSplit && (
        <Select
          label="Asignar a"
          value={userId}
          onChange={setUserId}
          options={memberOptions}
          placeholder="Seleccionar usuario"
        />
      )}

      <Input label="Concepto" value={concept} onChange={(e) => setConcept(e.target.value)} required />

      {isSplit || initialData?.isSplit ? (
        <Input
          label="Total"
          type="number"
          step="0.01"
          min="0.01"
          value={totalAmount}
          onChange={(e) => setTotalAmount(e.target.value)}
          required
          {...(isBlockedExpense && !isSimpleExpense ? { className: 'pointer-events-none opacity-50' } : {})}
        />
      ) : (
        <Input
          label="Monto"
          type="number"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          {...(isBlockedExpense && !isSimpleExpense ? { className: 'pointer-events-none opacity-50' } : {})}
        />
      )}

      <Input
        label="Fecha de transacción"
        type="date"
        value={transactionDate}
        onChange={(e) => setTransactionDate(e.target.value)}
        required
        {...(isBlockedExpense && !isSimpleExpense ? { className: 'pointer-events-none opacity-50' } : {})}
      />

      {!isEditMode || isSimpleExpense ? (
        <>
          <SectionDivider label="Opciones de pago" />

          <div className="space-y-3 bg-base-900/50 rounded-xl border border-base-800/50 p-4">
            {(!isEditMode || !initialData?.isMSI) && (
              <Toggle id="isMSI" checked={isMSI} onChange={(v) => { setIsMSI(v); if (v) setIsRecurring(false); }} label="Meses Sin Intereses (MSI)" disabled={!isSimpleExpense && isEditMode} />
            )}

            {isMSI && (
              <div className="pl-14 animate-slide-down">
                <Input
                  label="Número de parcialidades"
                  type="number"
                  min={2}
                  max={48}
                  value={totalInstallments}
                  onChange={(e) => setTotalInstallments(e.target.value)}
                  required
                />
              </div>
            )}

            {isOwner && (!isEditMode || isSimpleExpense) && (
              <Toggle id="isSplit" checked={isSplit} onChange={(v) => setIsSplit(v)} label="Gasto compartido" disabled={!isSimpleExpense && isEditMode} />
            )}

            {isSplit && (
              <div className="pl-14 space-y-3 animate-slide-down">
                <p className="text-xs font-medium text-base-500 tracking-wider uppercase">Seleccionar usuarios</p>
                <div className="space-y-0.5 max-h-40 overflow-y-auto">
                  {members.map((m) => (
                    <div
                      key={m.userId}
                      onClick={() => toggleSplitUser(m.userId)}
                      className="flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2 transition-colors hover:bg-base-800/60"
                    >
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${selectedSplitUsers.has(m.userId) ? 'bg-primary-500 border-primary-500' : 'border-base-600'}`}>
                        {selectedSplitUsers.has(m.userId) && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm text-base-200">{m.userName}</span>
                    </div>
                  ))}
                </div>

                {selectedSplitUsers.size > 1 && (
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleEqualSplit}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${equalSplit ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'bg-base-800 text-base-400 border border-base-700 hover:text-base-200'}`}
                    >
                      Repartir equitativamente
                    </button>
                    <button
                      type="button"
                      onClick={handleCustomSplit}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${!equalSplit ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'bg-base-800 text-base-400 border border-base-700 hover:text-base-200'}`}
                    >
                      Personalizar
                    </button>
                  </div>
                )}

                {!equalSplit && selectedSplitUsers.size > 0 && (
                  <div className="space-y-2 pt-1">
                    {Array.from(selectedSplitUsers).map((uid) => (
                      <div key={uid} className="flex items-center gap-3">
                        <span className="text-sm text-base-400 w-28 truncate shrink-0">{memberMap.get(uid) || uid}</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={customAmounts[uid] || ''}
                          onChange={(e) => setCustomAmounts((prev) => ({ ...prev, [uid]: e.target.value }))}
                          className="flex-1 w-full px-3 py-1.5 text-sm bg-base-800 border border-base-700 rounded-lg text-base-100 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all placeholder-base-500"
                          placeholder="Monto"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {selectedSplitUsers.size > 0 && (
                  <div className="text-xs">
                    <p className={splitTotalValid ? 'text-green-400' : 'text-red-400'}>
                      {isMSI ? `Suma por mes: $${splitSum.toFixed(2)}` : `Suma: $${splitSum.toFixed(2)}`}
                      {' '}{splitTotalValid ? '✓' : `≠ $${splitTarget.toFixed(2)}`}
                    </p>
                  </div>
                )}
              </div>
            )}

            {(!isEditMode || isSimpleExpense) && (
              <Toggle id="isRecurring" checked={isRecurring} onChange={(v) => { setIsRecurring(v); if (v) setIsMSI(false); }} label="Gasto recurrente" disabled={!isSimpleExpense && isEditMode} />
            )}

            {isRecurring && (
              <div className="pl-14 animate-slide-down">
                <Input
                  label="Número de meses"
                  type="number"
                  min={2}
                  max={60}
                  value={recurringMonths}
                  onChange={(e) => setRecurringMonths(e.target.value)}
                  required
                />
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-base-900/50 rounded-xl border border-base-800/50 p-4 text-sm text-base-400 space-y-1">
          {initialData?.isMSI && <p>MSI: {initialData.currentInstallment}/{initialData.totalInstallments}</p>}
          {initialData?.isRecurring && <p>Recurrente: mes {initialData.recurringCurrentMonth}/{initialData.recurringTotalMonths}</p>}
          {initialData?.isSplit && <p>Gasto compartido (no se puede cambiar a no-compartido desde edición)</p>}
        </div>
      )}

      <Button
        type="submit"
        isLoading={isLoading}
        className="w-full"
        disabled={(isSplit && (!splitTotalValid || selectedSplitUsers.size < 2))}
      >
        {isEditMode ? 'Guardar cambios' : 'Registrar gasto'}
      </Button>
    </form>
  );
}
