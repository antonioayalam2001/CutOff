'use client';
import { useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { GroupTabs } from '@/features/groups/components/GroupTabs';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { CardForm } from '@/features/cards/components/CardForm';
import { DataTable } from '@/shared/components/DataTable';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { useCards, useCreateCard, useDeleteCard } from '@/features/cards/hooks/useCards';
import { useGroup } from '@/features/groups/hooks/useGroups';
import { useAuthStore } from '@/features/auth/store/authStore';
import { Card } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';

export default function CardsPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const user = useAuthStore((s) => s.user);
  const { data: group } = useGroup(groupId);
  const { data: cards, isLoading, isError, error } = useCards(groupId);
  const createCard = useCreateCard(groupId);
  const deleteCard = useDeleteCard(groupId);
  const [showCreate, setShowCreate] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const isOwner = group?.ownerId === user?.id;

  const columns = useMemo<ColumnDef<Card>[]>(() => [
    { header: 'Nombre', accessorKey: 'name' },
    {
      header: 'Últimos 4',
      accessorKey: 'lastFourDigits',
      cell: (info) => <span className="font-mono text-base-400">•••• {info.getValue() as string}</span>,
    },
    { header: 'Día de corte', accessorKey: 'cutOffDay' },
    { header: 'Día de pago', accessorKey: 'paymentDeadlineDay' },
    ...(isOwner
      ? [
          {
            header: 'Acciones',
            cell: ({ row }) => (
              <button
                onClick={() => setConfirmDeleteId(row.original.id)}
                className="text-red-400 hover:text-red-300 transition-colors text-sm font-medium"
              >
                Eliminar
              </button>
            ),
          } as ColumnDef<Card>,
        ]
      : []),
  ], [isOwner]);

  const handleCreateSubmit = useCallback(async (data: { name: string; lastFourDigits: string; cutOffDay: number; paymentDeadlineDay: number; bankProfileId?: string }) => {
    try {
      await createCard.mutateAsync(data);
      toast.success('Tarjeta creada');
      setShowCreate(false);
    } catch {
      toast.error('Error al crear tarjeta');
    }
  }, [createCard]);

  const handleCloseModal = useCallback(() => setShowCreate(false), []);

  const handleDeleteConfirm = useCallback(() => {
    if (confirmDeleteId) {
      deleteCard.mutate(confirmDeleteId, {
        onSuccess: () => toast.success('Tarjeta eliminada'),
        onError: () => toast.error('Error al eliminar'),
      });
    }
    setConfirmDeleteId(null);
  }, [confirmDeleteId, deleteCard]);

  const handleDeleteDialogChange = useCallback((open: boolean) => { if (!open) setConfirmDeleteId(null); }, []);

  return (
    <ProtectedRoute>
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-display text-base-100">{group?.name}</h1>
        <GroupTabs groupId={groupId} />

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-base-100">Tarjetas</h2>
          {isOwner && <Button onClick={() => setShowCreate(true)} size="sm">Agregar tarjeta</Button>}
        </div>

        <div className="bg-base-900 rounded-2xl border border-base-800 overflow-hidden">
          <DataTable columns={columns} data={cards || []} isLoading={isLoading} error={isError ? (error instanceof Error ? error.message : 'Error al cargar tarjetas') : null} />
        </div>

        <Modal isOpen={showCreate} onClose={handleCloseModal} title="Nueva tarjeta">
          <CardForm onSubmit={handleCreateSubmit} isLoading={createCard.isPending} />
        </Modal>

        <ConfirmDialog
          open={confirmDeleteId !== null}
          onOpenChange={handleDeleteDialogChange}
          title="Eliminar tarjeta"
          description="¿Estás seguro de eliminar esta tarjeta? Esta acción no se puede deshacer."
          confirmLabel="Eliminar"
          isLoading={deleteCard.isPending}
          onConfirm={handleDeleteConfirm}
        />
      </div>
    </ProtectedRoute>
  );
}
