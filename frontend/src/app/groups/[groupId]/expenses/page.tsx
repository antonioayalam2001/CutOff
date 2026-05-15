'use client';
import { useMemo, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { GroupTabs } from '@/components/GroupTabs';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { DataTable } from '@/components/DataTable';
import { XmlImportModal } from '@/components/XmlImportModal';
import { useExpenses, useDeleteExpense, useUpdateExpense, useCreateExpenseBulk, useDeleteExpensesBulk } from '@/hooks/useExpenses';
import { useCards } from '@/hooks/useCards';
import { useGroup, useGroupMembers } from '@/hooks/useGroups';
import { useAuthStore } from '@/stores/authStore';
import { Expense } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { DateRange, DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { ConfirmDialog } from '@/components/ConfirmDialog';

export default function ExpensesPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: group } = useGroup(groupId);
  const { data: cards } = useCards(groupId);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const dateFrom = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
  const dateTo = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined;
  const { data: paginated, isLoading, isError, error } = useExpenses(groupId, { page, limit, dateFrom, dateTo });
  const { data: members } = useGroupMembers(groupId);
  const deleteExpense = useDeleteExpense(groupId);
  const deleteExpensesBulk = useDeleteExpensesBulk(groupId);
  const updateExpense = useUpdateExpense(groupId);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [showUserFilter, setShowUserFilter] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editRef = useRef({ concept: '', amount: '', transactionDate: '' });
  const [editCardId, setEditCardId] = useState('');
  const [editUserId, setEditUserId] = useState('');
  const [showXmlImport, setShowXmlImport] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const createExpenseBulk = useCreateExpenseBulk(groupId);

  const isOwner = group?.ownerId === user?.id;
  const formatCurrency = (v: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);

  const approvedMembers = (members || []).filter((m) => m.status === 'Aprobado');
  const expenses = paginated?.data || [];
  const total = paginated?.total || 0;
  const totalPages = paginated?.totalPages || 0;

  const filteredExpenses = useMemo(() => {
    let result = expenses;
    if (selectedCardId) {
      result = result.filter((e) => e.cardId === selectedCardId);
    }
    if (selectedUserIds.size > 0) {
      result = result.filter((e) => selectedUserIds.has(e.userId));
    }
    return result;
  }, [expenses, selectedCardId, selectedUserIds]);

  const handleDelete = (expenseId: string) => {
    setConfirmDeleteId(expenseId);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    setShowBulkConfirm(true);
  };

  const handleUserChange = (expenseId: string, newUserId: string) => {
    updateExpense.mutate(
      { expenseId, userId: newUserId },
      {
        onSuccess: () => toast.success('Usuario actualizado'),
        onError: () => toast.error('Error al actualizar el usuario'),
      },
    );
  };

  const toLocalDate = (iso: string) => {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const startEditing = (expense: Expense) => {
    setEditingId(expense.id);
    editRef.current = {
      concept: expense.concept,
      amount: expense.amount,
      transactionDate: toLocalDate(expense.transactionDate),
    };
    setEditCardId(expense.cardId);
    setEditUserId(expense.userId);
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const saveEditing = (expenseId: string) => {
    const { concept, amount, transactionDate } = editRef.current;
    updateExpense.mutate(
      {
        expenseId,
        concept,
        amount: parseFloat(amount),
        transactionDate,
        cardId: editCardId,
        userId: editUserId,
      },
      {
        onSuccess: () => {
          toast.success('Gasto actualizado');
          cancelEditing();
        },
        onError: () => toast.error('Error al actualizar el gasto'),
      },
    );
  };

  const toggleUserFilter = (userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const clearUserFilter = () => setSelectedUserIds(new Set());

  const inputClass = 'w-full px-2 py-1 text-sm bg-base-800 border border-base-700 rounded-lg text-base-100 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20';

  const columns: ColumnDef<Expense>[] = [
    {
      header: 'Concepto',
      accessorKey: 'concept',
      cell: ({ row }) => {
        const isEditing = editingId === row.original.id;
        return isEditing ? (
          <input
            key={`concept-${editingId}`}
            type="text"
            defaultValue={editRef.current.concept}
            onChange={(e) => { editRef.current.concept = e.target.value; }}
            className={inputClass}
          />
        ) : (
          <span>{row.original.concept}</span>
        );
      },
    },
    {
      header: 'Monto',
      accessorKey: 'amount',
      cell: ({ row }) => {
        const isEditing = editingId === row.original.id;
        return isEditing ? (
          <input
            key={`amount-${editingId}`}
            type="number"
            step="0.01"
            defaultValue={editRef.current.amount}
            onChange={(e) => { editRef.current.amount = e.target.value; }}
            className={inputClass}
          />
        ) : (
          <span className="font-medium text-base-200">
            {formatCurrency(parseFloat(row.original.amount as string))}
          </span>
        );
      },
    },
    {
      header: 'Fecha',
      accessorKey: 'transactionDate',
      cell: ({ row }) => {
        const isEditing = editingId === row.original.id;
        return isEditing ? (
          <input
            key={`date-${editingId}`}
            type="date"
            defaultValue={editRef.current.transactionDate}
            onChange={(e) => { editRef.current.transactionDate = e.target.value; }}
            className={inputClass}
          />
        ) : (
          <span className="text-base-500">
            {new Date(row.original.transactionDate).toLocaleDateString('es-MX')}
          </span>
        );
      },
    },
    ...(isOwner
      ? [
          {
            header: 'Usuario',
            id: 'user',
            cell: ({ row }: { row: any }) => {
              const expense = row.original;
              if (editingId === expense.id) {
                return (
                  <Select
                    key={`user-${editingId}`}
                    value={editUserId}
                    onChange={(v) => setEditUserId(v)}
                    options={approvedMembers.map((m) => ({ value: m.userId, label: m.user.name }))}
                    compact
                  />
                );
              }
              return (
                <Select
                  value={expense.userId}
                  onChange={(v) => handleUserChange(expense.id, v)}
                  options={approvedMembers.map((m) => ({ value: m.userId, label: m.user.name }))}
                  compact
                />
              );
            },
          } as ColumnDef<Expense>,
        ]
      : []),
    {
      header: 'MSI',
      accessorKey: 'isMSI',
      cell: (info) =>
        info.getValue() ? (
          <span className="text-xs bg-accent-500/10 text-accent-400 px-2.5 py-0.5 rounded-full border border-accent-500/20 font-medium">
            {info.row.original.currentInstallment}/{info.row.original.totalInstallments}
          </span>
        ) : (
          <span className="text-xs text-base-600">-</span>
        ),
    },
    {
      header: 'Tarjeta',
      cell: ({ row }) => {
        if (editingId === row.original.id) {
          return (
            <Select
              key={`card-${editingId}`}
              value={editCardId}
              onChange={(v) => setEditCardId(v)}
              options={(cards || []).map((c) => ({ value: c.id, label: c.name }))}
              compact
            />
          );
        }
        return <span className="text-base-400">{row.original.card?.name || '-'}</span>;
      },
    },
    ...(isOwner
      ? [
          {
            header: 'Acciones',
            id: 'actions',
            cell: ({ row }: { row: any }) => {
              const expense = row.original;
              if (editingId === expense.id) {
                return (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => saveEditing(expense.id)}
                      className="text-green-400 hover:text-green-300 transition-colors p-1.5 rounded-lg hover:bg-green-500/10"
                      title="Guardar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="text-base-400 hover:text-base-200 transition-colors p-1.5 rounded-lg hover:bg-base-800"
                      title="Cancelar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              }
              return (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startEditing(expense)}
                    className="text-primary-400 hover:text-primary-300 transition-colors p-1.5 rounded-lg hover:bg-primary-500/10"
                    title="Editar gasto"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="text-red-400 hover:text-red-300 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
                    title="Eliminar gasto"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              );
            },
          } as ColumnDef<Expense>,
        ]
      : []),
  ];

  return (
    <ProtectedRoute>
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-display text-base-100">{group?.name}</h1>
        <GroupTabs groupId={groupId} />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-base-100">Gastos</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowXmlImport(true)}
              className="px-3 py-1.5 text-sm font-medium bg-base-800 text-base-300 border border-base-700 hover:text-base-100 hover:border-base-600 rounded-xl transition-all flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Importar XML
            </button>
            <Link href={`/groups/${groupId}/expenses/new`}>
              <Button size="sm">Registrar gasto</Button>
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCardId(null)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedCardId === null
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'bg-base-800 text-base-400 border border-base-700 hover:text-base-200 hover:border-base-600'
              }`}
            >
              Todas
            </button>
            {cards?.map((card) => (
              <button
                key={card.id}
                onClick={() => setSelectedCardId(card.id)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedCardId === card.id
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'bg-base-800 text-base-400 border border-base-700 hover:text-base-200 hover:border-base-600'
                }`}
              >
                {card.name}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-base-700 mx-1 hidden sm:block" />

          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                dateRange
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'bg-base-800 text-base-400 border border-base-700 hover:text-base-200 hover:border-base-600'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {dateRange?.from && dateRange?.to
                ? `${format(dateRange.from, 'dd/MM')} - ${format(dateRange.to, 'dd/MM')}`
                : dateRange?.from
                  ? format(dateRange.from, 'dd/MM/yyyy')
                  : 'Filtrar por fecha'}
              {dateRange && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); setDateRange(undefined); setShowDatePicker(false); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); setDateRange(undefined); setShowDatePicker(false); } }}
                  className="text-base-500 hover:text-base-200 transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </span>
              )}
            </button>
            {showDatePicker && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowDatePicker(false)} />
                <div className="absolute top-full mt-2 left-0 right-0 sm:left-0 sm:right-auto z-20 bg-base-900 border border-base-700 rounded-xl shadow-2xl p-3 animate-scale-in max-w-[90vw] sm:max-w-none">
                  <DayPicker
                    mode="range"
                    selected={dateRange}
                    onSelect={(range) => {
                      setDateRange(range);
                      setPage(1);
                      if (range?.to) setShowDatePicker(false);
                    }}
                    locale={undefined}
                  />
                </div>
              </>
            )}
          </div>

          <div className="w-px h-6 bg-base-700 mx-1 hidden sm:block" />

          <div className="relative">
            <button
              onClick={() => setShowUserFilter(!showUserFilter)}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium bg-base-800 text-base-400 border border-base-700 hover:text-base-200 hover:border-base-600 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {selectedUserIds.size === 0
                ? 'Filtrar por usuario'
                : `${selectedUserIds.size} usuario${selectedUserIds.size > 1 ? 's' : ''}`}
              {selectedUserIds.size > 0 && (
                <span className="ml-1 text-xs bg-primary-500/20 text-primary-400 px-1.5 py-0.5 rounded-full">
                  {selectedUserIds.size}
                </span>
              )}
            </button>

            {showUserFilter && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowUserFilter(false)} />
                <div className="absolute top-full mt-2 left-0 z-20 bg-base-900 border border-base-700 rounded-xl shadow-2xl p-2 min-w-[200px] animate-scale-in">
                  {approvedMembers.length === 0 ? (
                    <p className="text-sm text-base-500 px-3 py-2">No hay usuarios</p>
                  ) : (
                    <>
                      {selectedUserIds.size > 0 && (
                        <button
                          onClick={clearUserFilter}
                          className="w-full text-left px-3 py-1.5 text-sm text-primary-400 hover:text-primary-300 hover:bg-base-800 rounded-lg transition-colors"
                        >
                          Limpiar filtro
                        </button>
                      )}
                      {approvedMembers.map((m) => (
                        <button
                          key={m.userId}
                          onClick={() => toggleUserFilter(m.userId)}
                          className="flex items-center gap-3 w-full text-left px-3 py-1.5 hover:bg-base-800 rounded-lg cursor-pointer transition-colors"
                        >
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
                            selectedUserIds.has(m.userId)
                              ? 'bg-primary-500 border-primary-500'
                              : 'border-base-600'
                          }`}>
                            {selectedUserIds.has(m.userId) && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className="text-sm text-base-200">{m.user.name}</span>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {isOwner && selectedIds.size > 0 && (
          <div className="flex items-center gap-2 flex-wrap px-4 py-2 bg-red-500/5 border border-red-500/10 rounded-xl">
            <span className="text-sm text-base-300">
              {selectedIds.size} gasto{selectedIds.size !== 1 ? 's' : ''} seleccionado{selectedIds.size !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-sm text-base-500 hover:text-base-200 transition-colors ml-2"
            >
              Cancelar
            </button>
            <div className="flex-1" />
            <Button
              size="sm"
              variant="danger"
              isLoading={deleteExpensesBulk.isPending}
              onClick={handleDeleteSelected}
            >
              Eliminar seleccionados
            </Button>
          </div>
        )}

        <div className="bg-base-900 rounded-2xl border border-base-800 overflow-hidden">
          <DataTable
            columns={columns}
            data={filteredExpenses}
            isLoading={isLoading}
            error={isError ? (error instanceof Error ? error.message : 'Error al cargar gastos') : null}
            selectedIds={isOwner ? selectedIds : undefined}
            onSelectionChange={isOwner ? setSelectedIds : undefined}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-base-500">Mostrar</span>
            <Select
              value={String(limit)}
              onChange={(v) => { setLimit(Number(v)); setPage(1); }}
              options={[5, 10, 20, 50].map((n) => ({ value: String(n), label: String(n) }))}
              compact
            />
            <span className="text-sm text-base-500">de {total}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-base-800 text-base-400 border border-base-700 hover:text-base-200 hover:border-base-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p, idx, arr) => (
                <span key={p} className="flex items-center">
                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span className="px-1 text-base-600">...</span>
                  )}
                <button
                  onClick={() => setPage(p)}
                  className={`px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    p === page
                      ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                      : 'bg-base-800 text-base-400 border border-base-700 hover:text-base-200 hover:border-base-600'
                  }`}
                >
                  {p}
                </button>
                </span>
              ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-base-800 text-base-400 border border-base-700 hover:text-base-200 hover:border-base-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {showXmlImport && (
        <XmlImportModal
          cards={cards || []}
          members={approvedMembers.map((m) => ({ userId: m.userId, userName: m.user.name }))}
          currentUserId={user?.id || ''}
          isOwner={isOwner}
          onClose={() => setShowXmlImport(false)}
          onSave={async (rows) => {
            await createExpenseBulk.mutateAsync(rows);
            toast.success(`${rows.length} gasto${rows.length !== 1 ? 's' : ''} importado${rows.length !== 1 ? 's' : ''}`);
          }}
        />
      )}

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}
        title="Eliminar gasto"
        description="¿Estás seguro de eliminar este gasto? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        isLoading={deleteExpense.isPending}
        onConfirm={() => {
          if (confirmDeleteId) {
            deleteExpense.mutate(confirmDeleteId, {
              onSuccess: () => toast.success('Gasto eliminado'),
              onError: () => toast.error('Error al eliminar el gasto'),
            });
          }
          setConfirmDeleteId(null);
        }}
      />

      <ConfirmDialog
        open={showBulkConfirm}
        onOpenChange={setShowBulkConfirm}
        title="Eliminar gastos seleccionados"
        description={`¿Estás seguro de eliminar ${selectedIds.size} gasto${selectedIds.size !== 1 ? 's' : ''} seleccionado${selectedIds.size !== 1 ? 's' : ''}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar todo"
        isLoading={deleteExpensesBulk.isPending}
        onConfirm={() => {
          deleteExpensesBulk.mutate(Array.from(selectedIds), {
            onSuccess: () => {
              toast.success(`${selectedIds.size} gasto${selectedIds.size !== 1 ? 's' : ''} eliminado${selectedIds.size !== 1 ? 's' : ''}`);
              setSelectedIds(new Set());
            },
            onError: () => toast.error('Error al eliminar los gastos'),
          });
          setShowBulkConfirm(false);
        }}
      />
    </ProtectedRoute>
  );
}
