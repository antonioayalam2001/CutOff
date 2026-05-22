'use client';
import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { useAuthStore } from '@/features/auth/store/authStore';
import { PASSWORD_POLICY_MESSAGE, isStrongPassword } from '@/lib/passwordPolicy';
import { changePasswordSchema, profileSchema } from '@/lib/validation';
import { toast } from 'sonner';

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  return date.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const changePassword = useAuthStore((s) => s.changePassword);
  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '', email: user?.email || '' },
  });
  const passwordForm = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors, isSubmitting: isSavingProfile },
  } = profileForm;

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: isSavingPassword },
  } = passwordForm;

  useEffect(() => {
    void refreshProfile().catch(() => toast.error('No se pudo cargar el perfil'));
  }, [refreshProfile]);

  useEffect(() => {
    if (user) {
      resetProfile({ name: user.name, email: user.email });
    }
  }, [user, resetProfile]);

  const passwordHint = useMemo(() => PASSWORD_POLICY_MESSAGE, []);

  const onProfileSubmit = handleProfileSubmit(async ({ name, email }) => {
    try {
      await updateProfile({ name, email });
      toast.success('Perfil actualizado');
    } catch {
      toast.error('No se pudo actualizar el perfil');
    }
  });

  const onPasswordSubmit = handlePasswordSubmit(async ({ currentPassword, newPassword }) => {
    if (!isStrongPassword(newPassword)) {
      toast.error(PASSWORD_POLICY_MESSAGE);
      return;
    }
    try {
      await changePassword({ currentPassword, newPassword });
      toast.success('Contraseña actualizada');
      resetPassword({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      toast.error('No se pudo actualizar la contraseña');
    }
  });

  return (
    <ProtectedRoute>
      <div className="space-y-6 cinematic-stagger">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="ui-page-title">Perfil</h1>
            <p className="text-sm text-base-500 mt-1">Administra tu información personal y seguridad de acceso</p>
          </div>
          <Link href="/dashboard" className="ui-chip inline-flex items-center">
            Volver al dashboard
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="ui-panel p-6 space-y-5">
            <div>
              <h2 className="ui-section-title">Información de cuenta</h2>
              <p className="text-sm text-base-500 mt-1">Datos visibles en la app y asociados a tu sesión actual.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-base-800 bg-base-950/50 p-4">
                <p className="text-xs uppercase tracking-wider text-base-500">Nombre</p>
                <p className="mt-2 text-base-100 font-medium">{user?.name || '-'}</p>
              </div>
              <div className="rounded-xl border border-base-800 bg-base-950/50 p-4">
                <p className="text-xs uppercase tracking-wider text-base-500">Correo</p>
                <p className="mt-2 text-base-100 font-medium break-words">{user?.email || '-'}</p>
              </div>
              <div className="rounded-xl border border-base-800 bg-base-950/50 p-4">
                <p className="text-xs uppercase tracking-wider text-base-500">Creado</p>
                <p className="mt-2 text-base-100 font-medium">{formatDate(user?.createdAt)}</p>
              </div>
              <div className="rounded-xl border border-base-800 bg-base-950/50 p-4">
                <p className="text-xs uppercase tracking-wider text-base-500">Actualizado</p>
                <p className="mt-2 text-base-100 font-medium">{formatDate(user?.updatedAt)}</p>
              </div>
            </div>
          </div>

          <div className="ui-panel p-6">
            <h2 className="ui-section-title mb-4">Actualizar perfil</h2>
            <form onSubmit={onProfileSubmit} className="space-y-4" noValidate>
              <Input label="Nombre" {...registerProfile('name')} error={profileErrors.name?.message} />
              <Input label="Correo" type="email" {...registerProfile('email')} error={profileErrors.email?.message} />
              <Button type="submit" isLoading={isSavingProfile} className="w-full">
                Guardar cambios
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-base-800">
              <h2 className="ui-section-title mb-2">Cambiar contraseña</h2>
              <p className="text-sm text-base-500 mb-4">{passwordHint}</p>
              <form onSubmit={onPasswordSubmit} className="space-y-4" noValidate>
                <Input label="Contraseña actual" type="password" {...registerPassword('currentPassword')} error={passwordErrors.currentPassword?.message} />
                <Input label="Nueva contraseña" type="password" {...registerPassword('newPassword')} error={passwordErrors.newPassword?.message} minLength={12} />
                <Input label="Confirmar nueva contraseña" type="password" {...registerPassword('confirmPassword')} error={passwordErrors.confirmPassword?.message} minLength={12} />
                <Button type="submit" variant="secondary" isLoading={isSavingPassword} className="w-full">
                  Actualizar contraseña
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
