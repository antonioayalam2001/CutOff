'use client';
import { memo, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { cardSchema } from '@/lib/validation';

interface Props {
  onSubmit: (data: FormData) => Promise<void>;
  isLoading?: boolean;
}

type FormData = z.infer<typeof cardSchema>;

export const CardForm = memo(function CardForm({ onSubmit, isLoading }: Props) {
  type CardFormInput = z.input<typeof cardSchema>;
  type CardFormOutput = z.output<typeof cardSchema>;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CardFormInput, undefined, CardFormOutput>({
    resolver: zodResolver(cardSchema),
    defaultValues: {
      name: '',
      lastFourDigits: '',
      cutOffDay: 1,
      paymentDeadlineDay: 1,
      bankProfileId: '',
    },
  });

  useEffect(() => {
    // Keep browser autofill from showing stale values after submit.
    reset({
      name: '',
      lastFourDigits: '',
      cutOffDay: 1,
      paymentDeadlineDay: 1,
      bankProfileId: '',
    });
  }, [reset]);

  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit({
      ...data,
      bankProfileId: data.bankProfileId || undefined,
    });
    reset({
      name: '',
      lastFourDigits: '',
      cutOffDay: 1,
      paymentDeadlineDay: 1,
      bankProfileId: '',
    });
  });

  return (
    <form onSubmit={handleFormSubmit} className="space-y-5" noValidate>
      <div className="relative pt-1">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-base-800" />
        </div>
        <div className="relative flex justify-start">
          <span className="pr-3 text-xs font-medium tracking-widest uppercase text-base-500 bg-base-900">Información de tarjeta</span>
        </div>
      </div>

      <Input label="Nombre de la tarjeta" {...register('name')} error={errors.name?.message} />
      <Input
        label="Últimos 4 dígitos"
        {...register('lastFourDigits')}
        error={errors.lastFourDigits?.message}
        maxLength={4}
        inputMode="numeric"
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Día de corte (1-31)"
          type="number"
          {...register('cutOffDay')}
          error={errors.cutOffDay?.message}
          min={1}
          max={31}
        />
        <Input
          label="Día de pago (1-31)"
          type="number"
          {...register('paymentDeadlineDay')}
          error={errors.paymentDeadlineDay?.message}
          min={1}
          max={31}
        />
      </div>
      <Controller
        control={control}
        name="bankProfileId"
        render={({ field }) => (
          <Select
            label="Perfil bancario (para importación de imágenes)"
            value={field.value || ''}
            onChange={field.onChange}
            options={[
              { value: '', label: 'Sin banco' },
              { value: 'santander', label: 'Santander' },
              { value: 'generico', label: 'Genérico' },
            ]}
            placeholder="Seleccionar perfil"
            portal={false}
            error={errors.bankProfileId?.message}
          />
        )}
      />
      <Button type="submit" isLoading={isLoading || isSubmitting} className="w-full">
        Guardar tarjeta
      </Button>
    </form>
  );
});
