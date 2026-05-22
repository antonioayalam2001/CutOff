'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import api from '@/lib/api';
import { PASSWORD_POLICY_MESSAGE } from '@/lib/passwordPolicy';
import { resetPasswordSchema } from '@/lib/validation';
import { toast } from 'sonner';

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [error, setError] = useState('');
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: token || '', password: '', confirmPassword: '' },
  });

  useEffect(() => {
    if (!token) {
      setError('Token de recuperación no encontrado');
    } else {
      setValue('token', token);
    }
  }, [token, setValue]);

  const onSubmit = handleSubmit(async ({ token: formToken, password }) => {
    try {
      await api.post('/auth/reset-password', { token: formToken, password });
      toast.success('Contraseña restablecida exitosamente');
      router.push('/login');
    } catch {
      toast.error('El enlace es inválido o ha expirado');
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-950 px-4 relative overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="blob absolute -top-40 -left-40 w-[600px] h-[600px] bg-primary-500/10 blur-[100px]" />
        <div className="blob-delayed absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-accent-500/5 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-500/3 blur-[120px]" />
      </div>
      <div className="relative w-full max-w-md animate-slide-up">
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-500/5 border border-primary-500/20 flex items-center justify-center glow">
            <svg className="w-7 h-7 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-display font-bold tracking-wider text-gradient mb-2">Nueva contraseña</h1>
          <p className="text-sm text-base-400 tracking-wide">Ingresa tu nueva contraseña</p>
        </div>
        <div className="glass-strong rounded-2xl p-8">
          {error ? (
            <div className="text-center space-y-5">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-base-200 font-medium">Enlace inválido</p>
              <p className="text-sm text-base-500">Este enlace de recuperación no es válido o ha expirado.</p>
              <Link
                href="/forgot-password"
                className="inline-block text-sm text-primary-400 hover:text-primary-300 transition-colors font-medium"
              >
                Solicitar un nuevo enlace
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5" noValidate>
              <input type="hidden" {...register('token')} />
              <Input
                label="Nueva contraseña"
                type="password"
                {...register('password')}
                error={errors.password?.message}
                minLength={12}
              />
              <p className="-mt-2 text-xs text-base-500">{PASSWORD_POLICY_MESSAGE}</p>
              <Input
                label="Confirmar contraseña"
                type="password"
                {...register('confirmPassword')}
                error={errors.confirmPassword?.message}
                minLength={12}
              />
              <Button type="submit" isLoading={isSubmitting} className="w-full">
                Restablecer contraseña
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
