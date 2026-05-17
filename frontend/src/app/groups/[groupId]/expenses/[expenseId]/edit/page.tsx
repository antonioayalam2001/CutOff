'use client';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { GroupTabs } from '@/features/groups/components/GroupTabs';
import { Button } from '@/shared/ui/Button';
import { ExpenseForm } from '@/features/expenses/components/ExpenseForm';
import { useCards } from '@/features/cards/hooks/useCards';
import { useExpense, useUpdateExpense } from '@/features/expenses/hooks/useExpenses';
import { useGroup, useGroupMembers } from '@/features/groups/hooks/useGroups';
import { useAuthStore } from '@/features/auth/store/authStore';
import { toast } from 'sonner';

export default function EditExpensePage() {
  const { groupId, expenseId } = useParams<{ groupId: string; expenseId: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: group, isLoading: isGroupLoading, isError: isGroupError, error: groupError } = useGroup(groupId);
  const { data: cards, isLoading: isCardsLoading } = useCards(groupId);
  const { data: members, isLoading: isMembersLoading } = useGroupMembers(groupId);
  const { data: expense, isLoading: isExpenseLoading, isError: isExpenseError, error: expenseError } = useExpense(groupId, expenseId);
  const updateExpense = useUpdateExpense(groupId);

  const isOwner = group?.ownerId === user?.id;
  const ready = !isGroupLoading && !isCardsLoading && !isMembersLoading && !isExpenseLoading;

  if (isGroupError || isExpenseError) {
    return (
      <ProtectedRoute>
        <div className="text-center py-16 bg-base-900 rounded-2xl border border-base-800 animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-base-400 mb-2">Error al cargar datos</p>
          <p className="text-sm text-base-500">{(groupError || expenseError) instanceof Error ? ((groupError || expenseError) as Error).message : 'Intenta de nuevo más tarde'}</p>
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

  const initialData = expense
    ? {
        id: expense.id,
        cardId: expense.cardId,
        userId: expense.userId,
        concept: expense.concept,
        amount: String(expense.amount),
        transactionDate: expense.transactionDate,
        isMSI: expense.isMSI,
        totalInstallments: expense.totalInstallments,
        currentInstallment: expense.currentInstallment,
        isRecurring: expense.isRecurring,
        recurringTotalMonths: expense.recurringTotalMonths,
        recurringCurrentMonth: expense.recurringCurrentMonth,
        isSplit: expense.isSplit,
      }
    : undefined;

  return (
    <ProtectedRoute>
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-display text-base-100">{group?.name}</h1>
        <GroupTabs groupId={groupId} />

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-base-100">Editar gasto</h2>
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver
          </Button>
        </div>

        <div className="max-w-lg mx-auto">
          <div className="bg-base-900 rounded-2xl border border-base-800 p-6">
            {initialData && (
              <ExpenseForm
                cards={cards || []}
                isOwner={isOwner}
                members={memberOptions}
                initialData={initialData}
                onSubmitEdit={async (id, data) => {
                  try {
                    await updateExpense.mutateAsync({ expenseId: id, ...data });
                    toast.success('Gasto actualizado');
                    router.push(`/groups/${groupId}/expenses`);
                  } catch {
                    toast.error('Error al actualizar el gasto');
                  }
                }}
                isLoading={updateExpense.isPending}
              />
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
