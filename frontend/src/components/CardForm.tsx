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
  }) => Promise<void>;
  isLoading?: boolean;
}

export function CardForm({ onSubmit, isLoading }: Props) {
  const [name, setName] = useState('');
  const [lastFourDigits, setLastFourDigits] = useState('');
  const [cutOffDay, setCutOffDay] = useState('');
  const [paymentDeadlineDay, setPaymentDeadlineDay] = useState('');
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
    });

    setName('');
    setLastFourDigits('');
    setCutOffDay('');
    setPaymentDeadlineDay('');
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
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" isLoading={isLoading} className="w-full">
        Guardar tarjeta
      </Button>
    </form>
  );
}
