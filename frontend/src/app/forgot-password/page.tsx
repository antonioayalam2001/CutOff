'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      toast.error('Error al enviar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-3xl font-display font-bold tracking-wider text-gradient mb-2">Recuperar contraseña</h1>
          <p className="text-sm text-base-400 tracking-wide">Ingresa tu correo y te enviaremos un enlace</p>
        </div>
        <div className="glass-strong rounded-2xl p-8">
          {sent ? (
            <div className="text-center space-y-5">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
                <svg className="w-7 h-7 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-base-200 font-medium">Solicitud enviada</p>
              <p className="text-sm text-base-500">
                Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.
                Revisa también tu bandeja de spam.
              </p>
              <Link
                href="/login"
                className="inline-block text-sm text-primary-400 hover:text-primary-300 transition-colors font-medium"
              >
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-5">
                <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <Button type="submit" isLoading={isLoading} className="w-full">Enviar enlace</Button>
              </form>
              <p className="text-sm text-base-500 text-center mt-6">
                <Link href="/login" className="text-primary-400 hover:text-primary-300 transition-colors font-medium">
                  Volver al inicio de sesión
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
