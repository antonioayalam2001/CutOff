'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { useAuthStore } from '@/features/auth/store/authStore';
import { PASSWORD_POLICY_MESSAGE } from '@/lib/passwordPolicy';
import { registerSchema } from '@/lib/validation';
import { toast } from 'sonner';

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const { register: formRegister, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = handleSubmit(async ({ name, email, password }) => {
    try {
      await register(name, email, password);
      toast.success('Cuenta creada exitosamente');
      router.push('/dashboard');
    } catch {
      toast.error('Error al crear la cuenta');
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-950 px-4 relative overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="blob absolute -top-40 -right-40 w-[600px] h-[600px] bg-accent-500/10 blur-[100px]" />
        <div className="blob-delayed absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-primary-500/5 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-500/3 blur-[120px]" />
      </div>
      <div className="relative w-full max-w-md animate-slide-up">
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-accent-500/20 to-accent-500/5 border border-accent-500/20 flex items-center justify-center glow-accent">
            <span className="text-xl font-bold text-gradient-gold">CO</span>
          </div>
          <h1 className="text-4xl font-display font-bold tracking-wider text-gradient mb-2">CutOff</h1>
          <p className="text-sm text-base-400 tracking-wide">Regístrate para gestionar tus gastos</p>
        </div>
        <div className="glass-strong rounded-2xl p-8">
          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            <Input label="Nombre" {...formRegister('name')} error={errors.name?.message} />
            <Input label="Email" type="email" {...formRegister('email')} error={errors.email?.message} />
            <Input label="Contraseña" type="password" {...formRegister('password')} error={errors.password?.message} minLength={12} />
            <p className="-mt-2 text-xs text-base-500">{PASSWORD_POLICY_MESSAGE}</p>
            <Button type="submit" isLoading={isSubmitting} className="w-full">Crear cuenta</Button>
          </form>
          <p className="text-sm text-base-500 text-center mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-primary-400 hover:text-primary-300 transition-colors font-medium">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
