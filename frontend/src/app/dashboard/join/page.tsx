'use client';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { Button } from '@/shared/ui/Button';

export default function JoinPage() {
  const router = useRouter();
  return (
    <ProtectedRoute>
      <div className="text-center py-16 animate-fade-in">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-base-800 flex items-center justify-center">
          <svg className="w-8 h-8 text-base-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
        </div>
        <p className="text-base-400 mb-6">Usa el botón &ldquo;Unirse con código&rdquo; desde el dashboard</p>
        <Button variant="secondary" onClick={() => router.push('/dashboard')}>Volver al dashboard</Button>
      </div>
    </ProtectedRoute>
  );
}
