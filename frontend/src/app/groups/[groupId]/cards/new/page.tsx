'use client';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { GroupTabs } from '@/components/GroupTabs';
import { CardForm } from '@/components/CardForm';
import { useCreateCard } from '@/hooks/useCards';
import { useGroup } from '@/hooks/useGroups';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { useEffect } from 'react';

export default function NewCardPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: group, isLoading, isError, error } = useGroup(groupId);
  const createCard = useCreateCard(groupId);

  useEffect(() => {
    if (group && group.ownerId !== user?.id) {
      toast.error('Solo el administrador puede crear tarjetas');
      router.push(`/groups/${groupId}/cards`);
    }
  }, [group, user, groupId, router]);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="space-y-6 animate-fade-in">
          <div className="h-8 w-48 bg-base-800 rounded-lg animate-shimmer bg-gradient-to-r from-base-800 via-base-700 to-base-800 bg-[length:200%_100%]" />
          <div className="max-w-md mx-auto">
            <div className="bg-base-900 rounded-2xl border border-base-800 p-6">
              <div className="h-6 w-32 bg-base-800 rounded-md animate-shimmer bg-gradient-to-r from-base-800 via-base-700 to-base-800 bg-[length:200%_100%] mb-4" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 bg-base-800 rounded-xl animate-shimmer bg-gradient-to-r from-base-800 via-base-700 to-base-800 bg-[length:200%_100%] mb-3" />
              ))}
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (isError) {
    return (
      <ProtectedRoute>
        <div className="text-center py-16 bg-base-900 rounded-2xl border border-base-800 animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-base-400 mb-2">Error al cargar el grupo</p>
          <p className="text-sm text-base-500">{error instanceof Error ? error.message : 'Intenta de nuevo más tarde'}</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-display text-base-100">{group?.name}</h1>
        <GroupTabs groupId={groupId} />
        <div className="max-w-md mx-auto">
          <div className="bg-base-900 rounded-2xl border border-base-800 p-6">
            <h2 className="text-lg font-semibold text-base-100 mb-4 font-display">Nueva tarjeta</h2>
            <CardForm
              onSubmit={async (data) => {
                try {
                  await createCard.mutateAsync(data);
                  toast.success('Tarjeta creada');
                  router.push(`/groups/${groupId}/cards`);
                } catch {
                  toast.error('Error al crear tarjeta');
                }
              }}
              isLoading={createCard.isPending}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
