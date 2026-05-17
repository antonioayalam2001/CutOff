'use client';
import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/authStore';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-950">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-2 border-white/10" />
            <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-t-primary-400 animate-spin" style={{ filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.3))' }} />
          </div>
          <p className="text-sm text-base-500 animate-pulse-soft tracking-wide">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
