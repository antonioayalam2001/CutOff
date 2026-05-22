'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { useAuthStore } from '@/features/auth/store/authStore';
import { loginSchema } from '@/lib/validation';
import { toast } from 'sonner';

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    try {
      await login(email, password);
      toast.success('Inicio de sesión exitoso');
      router.push('/dashboard');
    } catch {
      toast.error('Credenciales inválidas');
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
            <span className="text-xl font-bold text-gradient">CO</span>
          </div>
          <h1 className="text-4xl font-display font-bold tracking-wider text-gradient mb-2">CutOff</h1>
          <p className="text-sm text-base-400 tracking-wide">Inicia sesión para continuar</p>
        </div>
        <div className="glass-strong rounded-2xl p-8">
          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
            <Input label="Contraseña" type="password" {...register('password')} error={errors.password?.message} />
            <div className="text-right -mt-2">
              <Link href="/forgot-password" className="text-xs text-base-500 hover:text-primary-400 transition-colors">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <Button type="submit" isLoading={isSubmitting} className="w-full">Iniciar sesión</Button>
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
