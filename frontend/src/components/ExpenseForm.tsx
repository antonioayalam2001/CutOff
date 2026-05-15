'use client';
import { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Card } from '@/types';

interface Props {
  cards: Card[];
  isOwner: boolean;
  members: { userId: string; userName: string }[];
  onSubmit: (data: {
    cardId: string;
    userId?: string;
    concept: string;
    amount: number;
    transactionDate: string;
    isMSI?: boolean;
    totalInstallments?: number;
  }) => Promise<void>;
  isLoading?: boolean;
}

export function ExpenseForm({ cards, isOwner, members, onSubmit, isLoading }: Props) {
  const [cardId, setCardId] = useState('');
  const [userId, setUserId] = useState('');
  const [concept, setConcept] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [isMSI, setIsMSI] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState('3');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      cardId,
      userId: isOwner && userId ? userId : undefined,
      concept,
      amount: parseFloat(amount),
      transactionDate,
      isMSI: isMSI || undefined,
      totalInstallments: isMSI ? parseInt(totalInstallments, 10) : undefined,
    });

    setConcept('');
    setAmount('');
    setCardId('');
    setIsMSI(false);
  };

  const cardOptions = cards.map((c) => ({ value: c.id, label: `${c.name} (••••${c.lastFourDigits})` }));
  const memberOptions = members.map((m) => ({ value: m.userId, label: m.userName }));

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Select
        label="Tarjeta"
        value={cardId}
        onChange={setCardId}
        options={cardOptions}
        placeholder="Seleccionar tarjeta"
      />

      {isOwner && (
        <Select
          label="Asignar a"
          value={userId}
          onChange={setUserId}
          options={memberOptions}
          placeholder="Seleccionar usuario"
        />
      )}

      <Input label="Concepto" value={concept} onChange={(e) => setConcept(e.target.value)} required />

      <Input
        label="Monto"
        type="number"
        step="0.01"
        min="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />

      <Input
        label="Fecha de transacción"
        type="date"
        value={transactionDate}
        onChange={(e) => setTransactionDate(e.target.value)}
        required
      />

      <label className="flex items-center gap-3 cursor-pointer group">
        <div className="relative">
          <input
            type="checkbox"
            id="isMSI"
            checked={isMSI}
            onChange={(e) => setIsMSI(e.target.checked)}
            className="sr-only"
          />
          <div className={`w-10 h-6 rounded-full transition-colors duration-200 ${isMSI ? 'bg-primary-500' : 'bg-base-700'}`}>
            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 mt-1 ${isMSI ? 'translate-x-5' : 'translate-x-1'}`} />
          </div>
        </div>
        <span className="text-sm text-base-300 group-hover:text-base-200 transition-colors">
          Meses Sin Intereses (MSI)
        </span>
      </label>

      {isMSI && (
        <Input
          label="Número de parcialidades"
          type="number"
          min={2}
          max={48}
          value={totalInstallments}
          onChange={(e) => setTotalInstallments(e.target.value)}
          required
        />
      )}

      <Button type="submit" isLoading={isLoading} className="w-full">
        Registrar gasto
      </Button>
    </form>
  );
}
