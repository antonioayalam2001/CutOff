'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { GroupTabs } from '@/components/GroupTabs';
import { Button } from '@/components/ui/Button';
import { ExpenseForm } from '@/components/ExpenseForm';
import { useCards } from '@/hooks/useCards';
import { useCreateExpense } from '@/hooks/useExpenses';
import { useGroup, useGroupMembers } from '@/hooks/useGroups';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

export default function NewExpensePage() {
  const { groupId } = useParams<{ groupId: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: group, isLoading: isGroupLoading, isError: isGroupError, error: groupError } = useGroup(groupId);
  const { data: cards, isLoading: isCardsLoading } = useCards(groupId);
  const { data: members, isLoading: isMembersLoading } = useGroupMembers(groupId);
  const createExpense = useCreateExpense(groupId);
  const [keepAdding, setKeepAdding] = useState(false);

  const isOwner = group?.ownerId === user?.id;
  const ready = !isGroupLoading && !isCardsLoading && !isMembersLoading;

  if (isGroupError) {
    return (
      <ProtectedRoute>
        <div className="text-center py-16 bg-base-900 rounded-2xl border border-base-800 animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-base-400 mb-2">Error al cargar el grupo</p>
          <p className="text-sm text-base-500">{groupError instanceof Error ? groupError.message : 'Intenta de nuevo más tarde'}</p>
        </div>
      </ProtectedRoute>
    );
  }

  if (!ready) {
    return (
      <ProtectedRoute>
        <div className="space-y-6 animate-fade-in">
          <div className="h-8 w-48 bg-base-800 rounded-lg animate-shimmer bg-gradient-to-r from-base-800 via-base-700 to-base-800 bg-[length:200%_100%]" />
          <div className="max-w-lg mx-auto">
            <div className="bg-base-900 rounded-2xl border border-base-800 p-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 bg-base-800 rounded-xl animate-shimmer bg-gradient-to-r from-base-800 via-base-700 to-base-800 bg-[length:200%_100%] mb-3" />
              ))}
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }
  const memberOptions = (members || [])
    .filter((m) => m.status === 'Aprobado')
    .map((m) => ({ userId: m.userId, userName: m.user.name }));

  return (
    <ProtectedRoute>
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-display text-base-100">{group?.name}</h1>
        <GroupTabs groupId={groupId} />

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-base-100">Registrar gasto</h2>
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver
          </Button>
        </div>

        <div className="max-w-lg mx-auto">
          <div className="bg-base-900 rounded-2xl border border-base-800 p-6">
            <ExpenseForm
              cards={cards || []}
              isOwner={isOwner}
              members={memberOptions}
              onSubmit={async (data) => {
                try {
                  await createExpense.mutateAsync(data);
                  toast.success('Gasto registrado');
                  if (!keepAdding) {
                    router.push(`/groups/${groupId}/expenses`);
                  }
                } catch {
                  toast.error('Error al registrar el gasto');
                }
              }}
              isLoading={createExpense.isPending}
            />
          </div>

          <label className="flex items-center justify-center gap-3 mt-4 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={keepAdding}
                onChange={(e) => setKeepAdding(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-10 h-6 rounded-full transition-colors duration-200 ${keepAdding ? 'bg-primary-500' : 'bg-base-700'}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 mt-1 ${keepAdding ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
            </div>
            <span className="text-sm text-base-400 group-hover:text-base-300 transition-colors">
              Seguir agregando gastos
            </span>
          </label>
        </div>
      </div>
    </ProtectedRoute>
  );
}
