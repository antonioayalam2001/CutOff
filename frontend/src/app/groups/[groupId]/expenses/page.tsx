'use client';
import { useState, useRef, useCallback, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { GroupTabs } from '@/features/groups/components/GroupTabs';
import { Button } from '@/shared/ui/Button';
import { Select } from '@/shared/ui/Select';
import { Input } from '@/shared/ui/Input';
import { DataTable } from '@/shared/components/DataTable';
import { XmlImportModal } from '@/features/import/components/XmlImportModal';
import { useExpenses, useDeleteExpense, useUpdateExpense, useCreateExpenseBulk, useDeleteExpensesBulk } from '@/features/expenses/hooks/useExpenses';
import { useCards } from '@/features/cards/hooks/useCards';
import { useGroup, useGroupMembers } from '@/features/groups/hooks/useGroups';
import { useAuthStore } from '@/features/auth/store/authStore';
import { Expense } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { DateRange, DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';

function ExpensesContent() {
  const { groupId } = useParams<{ groupId: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const { data: group } = useGroup(groupId);
  const { data: cards } = useCards(groupId);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const selectedCardId = searchParams.get('card') || null;
  const dateFrom = searchParams.get('from') || undefined;
  const dateTo = searchParams.get('to') || undefined;
  const searchQuery = searchParams.get('q') || '';
  const [searchInput, setSearchInput] = useState(searchQuery);
  useEffect(() => { setSearchInput(searchQuery); }, [searchQuery]);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchQuery) updateURL({ q: searchInput || null, page: '1' });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);
  const userFilterParam = searchParams.get('user') || '';
  const selectedUserIds = new Set(userFilterParam ? userFilterParam.split(',') : []);

  const updateURL = useCallback((updates: Record<string, string | null | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, router, pathname]);

  const setPage = useCallback((p: number | ((prev: number) => number)) => {
    const next = typeof p === 'function' ? p(page) : p;
    updateURL({ page: next > 1 ? String(next) : null });
  }, [page, updateURL]);

  const setLimit = useCallback((l: number) => {
    updateURL({ limit: l !== 10 ? String(l) : null, page: '1' });
  }, [updateURL]);

  const goToPage = useCallback((nextPage: number) => {
    updateURL({ page: nextPage > 1 ? String(nextPage) : null });
  }, [updateURL]);

  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    dateFrom || dateTo ? { from: dateFrom ? new Date(dateFrom) : undefined, to: dateTo ? new Date(dateTo) : undefined } : undefined,
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { data: paginated, isLoading, isError, error } = useExpenses(groupId, {
    page, limit, dateFrom, dateTo, cardId: selectedCardId || undefined, search: searchQuery || undefined,
  });
  const { data: members } = useGroupMembers(groupId);
  const deleteExpense = useDeleteExpense(groupId);
  const deleteExpensesBulk = useDeleteExpensesBulk(groupId);
  const updateExpense = useUpdateExpense(groupId);
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
  const expenses = (paginated?.data || []).filter(
    (e) => selectedUserIds.size === 0 || selectedUserIds.has(e.userId),
  );
  const total = paginated?.total || 0;
  const totalPages = paginated?.totalPages || 0;



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

  const toLocalDate = (iso: string) => iso.split('T')[0];

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
    const next = new Set(selectedUserIds);
    if (next.has(userId)) next.delete(userId);
    else next.add(userId);
    const val = next.size > 0 ? Array.from(next).join(',') : null;
    updateURL({ user: val, page: '1' });
  };

  const clearUserFilter = () => updateURL({ user: null, page: '1' });

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
            {(() => { const [y,m,d] = row.original.transactionDate.split('T')[0].split('-'); return `${d}/${m}/${y}`; })()}
          </span>
        );
      },
    },

    {
      header: 'Tipo',
      id: 'type',
      cell: ({ row }) => {
        const e = row.original;
        const badges: React.ReactNode[] = [];
        if (e.isMSI) {
          badges.push(
            <span key="msi" className="text-xs bg-accent-500/10 text-accent-400 px-2.5 py-0.5 rounded-full border border-accent-500/20 font-medium">
              MSI {e.currentInstallment}/{e.totalInstallments}
            </span>,
          );
        }
        if (e.isRecurring) {
          badges.push(
            <span key="rec" className="text-xs bg-cyan-500/10 text-cyan-400 px-2.5 py-0.5 rounded-full border border-cyan-500/20 font-medium">
              Recurrente {e.recurringCurrentMonth}/{e.recurringTotalMonths}
            </span>,
          );
        }
        if (e.isSplit) {
          badges.push(
            <span key="split" className="text-xs bg-violet-500/10 text-violet-400 px-2.5 py-0.5 rounded-full border border-violet-500/20 font-medium">
              Compartido
            </span>,
          );
        }
        return badges.length > 0 ? (
          <div className="flex flex-wrap gap-1">{badges}</div>
        ) : (
          <span className="text-xs text-base-600">-</span>
        );
      },
    },
    {
      header: 'Usuario',
      id: 'users',
      cell: ({ row }) => {
        const e = row.original;
        if (e.isSplit && e.splitUsers && e.splitUsers.length > 0) {
          return (
            <div className="flex flex-wrap gap-1">
              {e.splitUsers.map((u) => (
                <span key={u.id} className="text-xs bg-primary-500/10 text-primary-400 px-2 py-0.5 rounded-full border border-primary-500/20">
                  {u.name}
                </span>
              ))}
            </div>
          );
        }
        if (isOwner && !e.isSplit) {
          return (
            <Select
              value={e.userId}
              onChange={(v) => handleUserChange(e.id, v)}
              options={approvedMembers.map((m) => ({ value: m.userId, label: m.user.name }))}
              compact
            />
          );
        }
        return <span className="text-sm text-base-400">{e.user?.name || '-'}</span>;
      },
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
                  <Link
                    href={`/groups/${groupId}/expenses/${expense.id}/edit`}
                    className="text-base-400 hover:text-primary-300 transition-colors p-1.5 rounded-lg hover:bg-primary-500/10"
                    title="Vista detallada"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </Link>
                  <button
                    onClick={() => startEditing(expense)}
                    className="text-primary-400 hover:text-primary-300 transition-colors p-1.5 rounded-lg hover:bg-primary-500/10"
                    title="Editar rápido"
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
      <div className="space-y-6 cinematic-stagger">
        <h1 className="ui-page-title">{group?.name}</h1>
        <GroupTabs groupId={groupId} />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h2 className="ui-section-title">Gastos</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowXmlImport(true)}
                className="motion-press px-3 py-1.5 text-sm font-medium bg-base-800 text-base-300 border border-base-700 hover:text-base-100 hover:border-base-600 rounded-xl flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Importar
            </button>
            <Link href={`/groups/${groupId}/expenses/new`}>
              <Button size="sm">Registrar gasto</Button>
            </Link>
          </div>
        </div>

        <div className="ui-toolbar">
          <div className="relative w-full sm:w-auto">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por concepto..."
                className="w-full sm:w-56 pl-9 pr-3 py-1.5 text-sm bg-base-800 border border-base-700 rounded-lg text-base-100 placeholder-base-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 motion-press"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => updateURL({ card: null, page: '1' })}
                className={`${
                  selectedCardId === null
                    ? 'ui-chip-active'
                    : 'ui-chip'
                }`}
            >
              Todas
            </button>
            {cards?.map((card) => (
              <button
                key={card.id}
                onClick={() => updateURL({ card: card.id !== selectedCardId ? card.id : null, page: '1' })}
                  className={`${
                    selectedCardId === card.id
                      ? 'ui-chip-active'
                      : 'ui-chip'
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
               className={`motion-press flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium ${
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
                  onClick={(e) => { e.stopPropagation(); setDateRange(undefined); updateURL({ from: null, to: null, page: '1' }); setShowDatePicker(false); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); setDateRange(undefined); updateURL({ from: null, to: null, page: '1' }); setShowDatePicker(false); } }}
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
                      const from = range?.from ? format(range.from, 'yyyy-MM-dd') : null;
                      const to = range?.to ? format(range.to, 'yyyy-MM-dd') : null;
                      updateURL({ from, to, page: '1' });
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
               className="motion-press flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium bg-base-800 text-base-400 border border-base-700 hover:text-base-200 hover:border-base-600"
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

        <div className="ui-panel">
          <DataTable
            columns={columns}
            data={expenses}
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
              onChange={(v) => { setLimit(Number(v)); }}
              options={[5, 10, 20, 50].map((n) => ({ value: String(n), label: String(n) }))}
              compact
            />
            <span className="text-sm text-base-500">de {total}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => goToPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="ui-chip disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p, idx, arr) => (
                <div key={p} className="flex items-center">
                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span className="px-1 text-base-600">...</span>
                  )}
                  <button
                    type="button"
                    onClick={() => goToPage(p)}
                    className={`px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium ${
                      p === page
                        ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                        : 'bg-base-800 text-base-400 border border-base-700 hover:text-base-200 hover:border-base-600 motion-press'
                    }`}
                    aria-current={p === page ? 'page' : undefined}
                  >
                    {p}
                  </button>
                </div>
              ))}
            <button
              type="button"
              onClick={() => goToPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="ui-chip disabled:opacity-40 disabled:cursor-not-allowed"
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

export default function ExpensesPage() {
  return (
    <Suspense fallback={null}>
      <ExpensesContent />
    </Suspense>
  );
}
