'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { useAuthStore } from '@/features/auth/store/authStore';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Inicio de sesión exitoso');
      router.push('/dashboard');
    } catch {
      toast.error('Credenciales inválidas');
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
            <span className="text-xl font-bold text-gradient">CO</span>
          </div>
          <h1 className="text-4xl font-display font-bold tracking-wider text-gradient mb-2">CutOff</h1>
          <p className="text-sm text-base-400 tracking-wide">Inicia sesión para continuar</p>
        </div>
        <div className="glass-strong rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <div className="text-right -mt-2">
              <Link href="/forgot-password" className="text-xs text-base-500 hover:text-primary-400 transition-colors">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <Button type="submit" isLoading={isLoading} className="w-full">Iniciar sesión</Button>
          </form>
          <p className="text-sm text-base-500 text-center mt-6">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="text-primary-400 hover:text-primary-300 transition-colors font-medium">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
