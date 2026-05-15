'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { GroupTabs } from '@/components/GroupTabs';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { CardForm } from '@/components/CardForm';
import { DataTable } from '@/components/DataTable';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useCards, useCreateCard, useDeleteCard } from '@/hooks/useCards';
import { useGroup } from '@/hooks/useGroups';
import { useAuthStore } from '@/stores/authStore';
import { Card } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';

export default function CardsPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: group } = useGroup(groupId);
  const { data: cards, isLoading, isError, error } = useCards(groupId);
  const createCard = useCreateCard(groupId);
  const deleteCard = useDeleteCard(groupId);
  const [showCreate, setShowCreate] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const isOwner = group?.ownerId === user?.id;

  const columns: ColumnDef<Card>[] = [
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
  ];

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

        <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Nueva tarjeta">
          <CardForm
            onSubmit={async (data) => {
              try {
                await createCard.mutateAsync(data);
                toast.success('Tarjeta creada');
                setShowCreate(false);
              } catch {
                toast.error('Error al crear tarjeta');
              }
            }}
            isLoading={createCard.isPending}
          />
        </Modal>

        <ConfirmDialog
          open={confirmDeleteId !== null}
          onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}
          title="Eliminar tarjeta"
          description="¿Estás seguro de eliminar esta tarjeta? Esta acción no se puede deshacer."
          confirmLabel="Eliminar"
          isLoading={deleteCard.isPending}
          onConfirm={() => {
            if (confirmDeleteId) {
              deleteCard.mutate(confirmDeleteId, {
                onSuccess: () => toast.success('Tarjeta eliminada'),
                onError: () => toast.error('Error al eliminar'),
              });
            }
            setConfirmDeleteId(null);
          }}
        />
      </div>
    </ProtectedRoute>
  );
}
