'use client';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Toggle } from '@/shared/ui/Toggle';
import { Checkbox } from '@/shared/ui/Checkbox';
import { Card, ExpenseSplit } from '@/types';
import { expenseFormSchema } from '@/lib/validation';

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

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="relative pt-4">
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-base-800" />
      </div>
      <div className="relative flex justify-start">
        <span className="pr-3 text-xs font-medium tracking-widest uppercase text-base-500 bg-base-900">{label}</span>
      </div>
    </div>
  );
}

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

export function ExpenseForm({ cards, isOwner, members, onSubmit, onSubmitEdit, isLoading, initialData }: Props) {
  const isEditMode = !!initialData;
  const isSimpleExpense = initialData && !initialData.isMSI && !initialData.isRecurring && !initialData.isSplit;

  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const {
    register,
    control,
    handleSubmit: handleFormSubmit,
    setError,
    clearErrors,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      cardId: initialData?.cardId || '',
      userId: initialData?.userId || '',
      concept: initialData?.concept || '',
      amount: initialData && !initialData.isSplit ? initialData.amount : '',
      totalAmount: initialData?.isSplit ? initialData.amount : '',
      transactionDate: initialData?.transactionDate || today,
      totalInstallments: String(initialData?.totalInstallments || '3'),
      recurringMonths: String(initialData?.recurringTotalMonths || '3'),
    },
  });

  const [isMSI, setIsMSI] = useState(initialData?.isMSI || false);
  const [isRecurring, setIsRecurring] = useState(initialData?.isRecurring || false);
  const [isSplit, setIsSplit] = useState(initialData?.isSplit || false);
  const [selectedSplitUsers, setSelectedSplitUsers] = useState<Set<string>>(new Set());
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [equalSplit, setEqualSplit] = useState(true);
  const [splitError, setSplitError] = useState('');

  const currentCardId = watch('cardId');
  const currentUserId = watch('userId');
  const currentConcept = watch('concept');
  const currentAmount = watch('amount');
  const currentTotalAmount = watch('totalAmount');
  const currentTransactionDate = watch('transactionDate');
  const currentTotalInstallments = watch('totalInstallments');
  const currentRecurringMonths = watch('recurringMonths');

  useEffect(() => {
    if (initialData?.isSplit) {
      setIsSplit(true);
    }
  }, [initialData?.isSplit]);

  useEffect(() => {
    reset({
      cardId: initialData?.cardId || '',
      userId: initialData?.userId || '',
      concept: initialData?.concept || '',
      amount: initialData && !initialData.isSplit ? initialData.amount : '',
      totalAmount: initialData?.isSplit ? initialData.amount : '',
      transactionDate: initialData?.transactionDate || today,
      totalInstallments: String(initialData?.totalInstallments || '3'),
      recurringMonths: String(initialData?.recurringTotalMonths || '3'),
    });
  }, [initialData, reset, today]);

  const memberOptions = useMemo(() => members.map((m) => ({ value: m.userId, label: m.userName })), [members]);
  const memberMap = useMemo(() => new Map(members.map((m) => [m.userId, m.userName])), [members]);

  const splitTarget = useMemo(() => {
    if (!isSplit) return 0;
    if (isMSI && currentTotalInstallments) {
      return (parseFloat(currentTotalAmount || '0') || 0) / parseInt(currentTotalInstallments, 10);
    }
    return parseFloat(currentTotalAmount || '0') || 0;
  }, [isSplit, isMSI, currentTotalAmount, currentTotalInstallments]);

  const onSubmitForm = handleFormSubmit(async (data) => {
    setSplitError('');
    clearErrors();

    const normalizedUserId = isOwner && !isSplit && !initialData?.isSplit ? data.userId || undefined : undefined;
    if (isOwner && !isSplit && !initialData?.isSplit && !normalizedUserId) {
      setError('userId', { type: 'manual', message: 'Selecciona un usuario' });
      return;
    }

    if (!isSplit && !data.amount?.trim()) {
      setError('amount', { type: 'manual', message: 'Ingresa un monto' });
      return;
    }

    if (isSplit && !data.totalAmount?.trim()) {
      setError('totalAmount', { type: 'manual', message: 'Ingresa un total' });
      return;
    }

    if (isMSI && !data.totalInstallments?.trim()) {
      setError('totalInstallments', { type: 'manual', message: 'Ingresa las parcialidades' });
      return;
    }

    if (isRecurring && !data.recurringMonths?.trim()) {
      setError('recurringMonths', { type: 'manual', message: 'Ingresa los meses' });
      return;
    }

    if (isSplit && selectedSplitUsers.size < 2) {
      setSplitError('Selecciona al menos 2 usuarios para dividir el gasto');
      return;
    }

    if (isSplit && !splitTotalValid) {
      setSplitError('La suma de los importes no coincide con el total');
      return;
    }

    const payload: ExpenseFormData = {
      cardId: data.cardId,
      userId: normalizedUserId,
      concept: data.concept,
      amount: isSplit ? parseFloat(data.totalAmount || '0') : parseFloat(data.amount || '0'),
      transactionDate: data.transactionDate,
    };

    if (isMSI) {
      payload.isMSI = true;
      payload.totalInstallments = parseInt(data.totalInstallments || '0', 10);
    }

    if (isRecurring) {
      payload.isRecurring = true;
      payload.recurringMonths = parseInt(data.recurringMonths || '0', 10);
    }

    if (isSplit) {
      payload.isSplit = true;
      payload.splits = Array.from(selectedSplitUsers).map((uid) => ({
        userId: uid,
        amount: equalSplit ? splitTarget / selectedSplitUsers.size : parseFloat(customAmounts[uid] || '0'),
      }));
    }

    if (isEditMode && onSubmitEdit && initialData) {
      await onSubmitEdit(initialData.id, payload);
    } else if (onSubmit) {
      await onSubmit(payload);
    }

    if (!isEditMode) {
      reset({
        cardId: '',
        userId: '',
        concept: '',
        amount: '',
        totalAmount: '',
        transactionDate: today,
        totalInstallments: '3',
        recurringMonths: '3',
      });
      setIsMSI(false);
      setIsRecurring(false);
      setIsSplit(false);
      setSelectedSplitUsers(new Set());
      setCustomAmounts({});
      setEqualSplit(true);
      setSplitError('');
    }
  });

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
    <form onSubmit={onSubmitForm} className="space-y-5" noValidate>
      <SectionDivider label={isEditMode ? 'Editar gasto' : 'Información general'} />

      {isEditMode && (
        <div className="text-sm text-base-500 bg-base-900/50 rounded-xl border border-base-800/50 px-4 py-3">
          Editando gasto · {isBlockedExpense ? 'Campos bloqueados por tipo de gasto' : 'Todos los campos editables'}
        </div>
      )}

      <Controller
        control={control}
        name="cardId"
        render={({ field }) => (
          <Select
            label="Tarjeta"
            value={field.value}
            onChange={field.onChange}
            options={cards.map((c) => ({ value: c.id, label: `${c.name} (••••${c.lastFourDigits})` }))}
            placeholder="Seleccionar tarjeta"
            error={errors.cardId?.message}
            {...(isBlockedExpense ? { className: 'pointer-events-none opacity-50' } : {})}
          />
        )}
      />

      {isOwner && !isSplit && !initialData?.isSplit && (
        <Controller
          control={control}
          name="userId"
          render={({ field }) => (
            <Select
              label="Asignar a"
              value={field.value || ''}
              onChange={field.onChange}
              options={memberOptions}
              placeholder="Seleccionar usuario"
              error={errors.userId?.message}
            />
          )}
        />
      )}

      <Input label="Concepto" {...register('concept')} error={errors.concept?.message} />

      {isSplit || initialData?.isSplit ? (
        <Input
          label="Total"
          type="number"
          step="0.01"
          min="0.01"
          {...register('totalAmount')}
          error={errors.totalAmount?.message || (splitError && isSplit ? splitError : undefined)}
          {...(isBlockedExpense && !isSimpleExpense ? { className: 'pointer-events-none opacity-50' } : {})}
        />
      ) : (
        <Input
          label="Monto"
          type="number"
          step="0.01"
          min="0.01"
          {...register('amount')}
          error={errors.amount?.message}
          {...(isBlockedExpense && !isSimpleExpense ? { className: 'pointer-events-none opacity-50' } : {})}
        />
      )}

      <Input
        label="Fecha de transacción"
        type="date"
        {...register('transactionDate')}
        error={errors.transactionDate?.message}
        {...(isBlockedExpense && !isSimpleExpense ? { className: 'pointer-events-none opacity-50' } : {})}
      />

      {!isEditMode || isSimpleExpense ? (
        <>
          <SectionDivider label="Opciones de pago" />

          <div className="space-y-3 bg-base-900/60 rounded-xl border border-base-800/70 p-4">
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
                  {...register('totalInstallments')}
                  error={errors.totalInstallments?.message}
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
                      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleSplitUser(m.userId); } }}
                      role="option"
                      aria-selected={selectedSplitUsers.has(m.userId)}
                      tabIndex={0}
                      className="flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2 transition-colors hover:bg-base-800/60 focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:outline-none"
                    >
                      <Checkbox checked={selectedSplitUsers.has(m.userId)} onChange={() => toggleSplitUser(m.userId)} />
                      <span className="text-sm text-base-200">{m.userName}</span>
                    </div>
                  ))}
                </div>

                {selectedSplitUsers.size > 1 && (
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleEqualSplit}
                      className={`${equalSplit ? 'ui-chip-active' : 'ui-chip'} px-3 py-1.5 text-xs`}
                    >
                      Repartir equitativamente
                    </button>
                    <button
                      type="button"
                      onClick={handleCustomSplit}
                      className={`${!equalSplit ? 'ui-chip-active' : 'ui-chip'} px-3 py-1.5 text-xs`}
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
                            className="motion-press flex-1 w-full px-3 py-1.5 text-sm bg-base-800 border border-base-700 rounded-lg text-base-100 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 placeholder-base-500"
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
                  {...register('recurringMonths')}
                  error={errors.recurringMonths?.message}
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
        isLoading={isLoading || isSubmitting}
        className="w-full"
        disabled={(isSplit && (!splitTotalValid || selectedSplitUsers.size < 2))}
      >
        {isEditMode ? 'Guardar cambios' : 'Registrar gasto'}
      </Button>
    </form>
  );
}
