'use client';
import { useParams } from 'next/navigation';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { GroupTabs } from '@/features/groups/components/GroupTabs';
import { InviteCodeDisplay } from '@/features/groups/components/InviteCodeDisplay';
import { useGroup } from '@/features/groups/hooks/useGroups';
import { useExpenses } from '@/features/expenses/hooks/useExpenses';
import { useAuthStore } from '@/features/auth/store/authStore';

function StatCard({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="bg-base-900 rounded-2xl border border-base-800 p-6 animate-slide-up">
      <p className="text-sm text-base-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold font-display ${className || 'text-base-100'}`}>{value}</p>
    </div>
  );
}

export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const user = useAuthStore((s) => s.user);
  const { data: group, isLoading, isError, error } = useGroup(groupId);
  const { data: paginated } = useExpenses(groupId, { page: 1, limit: 100 });
  const expenses = paginated?.data;

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="space-y-6 animate-fade-in">
          <div className="h-8 w-48 bg-base-800 rounded-lg animate-shimmer bg-gradient-to-r from-base-800 via-base-700 to-base-800 bg-[length:200%_100%]" />
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-base-900 rounded-2xl border border-base-800 p-6">
                <div className="h-4 w-16 bg-base-800 rounded-md animate-shimmer bg-gradient-to-r from-base-800 via-base-700 to-base-800 bg-[length:200%_100%] mb-2" />
                <div className="h-8 w-24 bg-base-800 rounded-md animate-shimmer bg-gradient-to-r from-base-800 via-base-700 to-base-800 bg-[length:200%_100%]" />
              </div>
            ))}
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

  const isOwner = group?.ownerId === user?.id;
  const userExpenses = (expenses || []).filter((e) => e.userId === user?.id);
  const totalSpent = userExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const formatCurrency = (v: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);

  return (
    <ProtectedRoute>
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display text-base-100">{group?.name}</h1>
          <p className="text-sm text-base-500 mt-1">
            {isOwner ? 'Eres el administrador del grupo' : 'Miembro del grupo'}
          </p>
        </div>

        {isOwner && group?.inviteCode && <InviteCodeDisplay code={group.inviteCode} />}

        <GroupTabs groupId={groupId} />

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Miembros" value={`${group?.members?.length || 0}`} />
          <StatCard label="Mis gastos" value={`${userExpenses.length}`} />
          <StatCard label="Total gastado" value={formatCurrency(totalSpent)} className="text-primary-400" />
        </div>
      </div>
    </ProtectedRoute>
  );
}
