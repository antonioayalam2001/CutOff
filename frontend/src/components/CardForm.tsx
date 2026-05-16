'use client';
import { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface Props {
  onSubmit: (data: {
    name: string;
    lastFourDigits: string;
    cutOffDay: number;
    paymentDeadlineDay: number;
    bankProfileId?: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

export function CardForm({ onSubmit, isLoading }: Props) {
  const [name, setName] = useState('');
  const [lastFourDigits, setLastFourDigits] = useState('');
  const [cutOffDay, setCutOffDay] = useState('');
  const [paymentDeadlineDay, setPaymentDeadlineDay] = useState('');
  const [bankProfileId, setBankProfileId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cutOff = parseInt(cutOffDay, 10);
    const payment = parseInt(paymentDeadlineDay, 10);

    if (cutOff === payment) {
      setError('El día de corte y el día de pago no pueden ser iguales');
      return;
    }

    await onSubmit({
      name,
      lastFourDigits,
      cutOffDay: cutOff,
      paymentDeadlineDay: payment,
      bankProfileId: bankProfileId || undefined,
    });

    setName('');
    setLastFourDigits('');
    setCutOffDay('');
    setPaymentDeadlineDay('');
    setBankProfileId('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input label="Nombre de la tarjeta" value={name} onChange={(e) => setName(e.target.value)} required />
      <Input
        label="Últimos 4 dígitos"
        value={lastFourDigits}
        onChange={(e) => setLastFourDigits(e.target.value.replace(/\D/g, '').slice(0, 4))}
        maxLength={4}
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Día de corte (1-31)"
          type="number"
          min={1}
          max={31}
          value={cutOffDay}
          onChange={(e) => setCutOffDay(e.target.value)}
          required
        />
        <Input
          label="Día de pago (1-31)"
          type="number"
          min={1}
          max={31}
          value={paymentDeadlineDay}
          onChange={(e) => setPaymentDeadlineDay(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-base-300 mb-1.5">Perfil bancario (para importar PDF)</label>
        <select
          value={bankProfileId}
          onChange={(e) => setBankProfileId(e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm bg-base-900 border border-base-700 rounded-xl text-base-100 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 cursor-pointer"
        >
          <option value="">Sin banco</option>
          <option value="santander">Santander</option>
          <option value="generico">Genérico</option>
        </select>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" isLoading={isLoading} className="w-full">
        Guardar tarjeta
      </Button>
    </form>
  );
}
