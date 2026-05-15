'use client';
import { useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { GroupTabs } from '@/components/GroupTabs';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/DataTable';
import { useGroup, useGroupMembers, useUpdateMemberStatus } from '@/hooks/useGroups';
import { useAuthStore } from '@/stores/authStore';
import { GroupMember, MemberStatus } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';

export default function MembersPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const user = useAuthStore((s) => s.user);
  const { data: group } = useGroup(groupId);
  const { data: members, isLoading, isError, error } = useGroupMembers(groupId);
  const updateStatus = useUpdateMemberStatus(groupId);

  const isOwner = group?.ownerId === user?.id;

  const handleStatusChange = (memberId: string, status: MemberStatus.APPROVED | MemberStatus.REJECTED) => {
    updateStatus.mutate(
      { memberId, status },
      {
        onSuccess: () => toast.success(`Miembro ${status === MemberStatus.APPROVED ? 'aprobado' : 'rechazado'}`),
        onError: () => toast.error('Error al actualizar estado'),
      },
    );
  };

  const columns: ColumnDef<GroupMember>[] = [
    { header: 'Nombre', cell: (info) => info.row.original.user?.name || 'Unknown' },
    { header: 'Email', cell: (info) => info.row.original.user?.email || '-' },
    {
      header: 'Estado',
      cell: (info) => <Badge status={info.row.original.status} />,
    },
    {
      header: 'Acciones',
      cell: (info) => {
        const member = info.row.original;
        if (!isOwner || member.userId === group?.ownerId) return null;
        if (member.status === MemberStatus.PENDING) {
          return (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleStatusChange(member.id, MemberStatus.APPROVED)}
                isLoading={updateStatus.isPending}
              >
                Aprobar
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleStatusChange(member.id, MemberStatus.REJECTED)}
                isLoading={updateStatus.isPending}
              >
                Rechazar
              </Button>
            </div>
          );
        }
        return null;
      },
    },
  ];

  return (
    <ProtectedRoute>
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-display text-base-100">{group?.name}</h1>
        <GroupTabs groupId={groupId} />

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-base-100">Miembros</h2>
        </div>

        <div className="bg-base-900 rounded-2xl border border-base-800 overflow-hidden">
          <DataTable columns={columns} data={members || []} isLoading={isLoading} error={isError ? (error instanceof Error ? error.message : 'Error al cargar miembros') : null} />
        </div>
      </div>
    </ProtectedRoute>
  );
}
