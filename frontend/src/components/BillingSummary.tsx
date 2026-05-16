'use client';
import { useState, useMemo, useCallback } from 'react';

interface BillingExpense {
  id: string;
  concept: string;
  amount: number;
  transactionDate: string;
  isMSI: boolean;
  totalInstallments: number | null;
  currentInstallment: number | null;
  installmentGroupId: string | null;
  cycle: 'current' | 'next';
}

interface CardBillingSummary {
  cardId: string;
  cardName: string;
  lastFourDigits: string;
  cutOffDay: number;
  paymentDeadlineDay: number;
  currentCycleTotal: number;
  nextCycleTotal: number;
  expenses: BillingExpense[];
}

interface UserBillingSummary {
  userId: string;
  userName: string;
  cards: CardBillingSummary[];
  totalCurrentCycle: number;
  totalNextCycle: number;
}

interface BillingResponse {
  summary: UserBillingSummary[];
}

interface Props {
  data: BillingResponse;
  view: 'users' | 'cards';
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
}

function CycleBadge({ cycle }: { cycle: 'current' | 'next' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
      cycle === 'current'
        ? 'bg-primary-500/10 text-primary-400 border-primary-500/20'
        : 'bg-accent-500/10 text-accent-400 border-accent-500/20'
    }`}>
      {cycle === 'current' ? 'Actual' : 'Siguiente'}
    </span>
  );
}

interface ExpenseTableProps {
  expenses: BillingExpense[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

function ExpenseTable({ expenses, selected, onToggle, onSelectAll, onDeselectAll }: ExpenseTableProps) {
  const allSelected = expenses.length > 0 && selected.size === expenses.length;
  return (
    <div>
      <div className="border-t border-base-700 overflow-x-auto">
        <table className="min-w-full divide-y divide-base-700">
          <thead className="bg-base-950/50">
            <tr>
              <th className="px-3 sm:px-5 py-2.5 text-left text-xs font-medium text-base-400 uppercase tracking-wider w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={allSelected ? onDeselectAll : onSelectAll}
                  className="rounded border-base-600 bg-base-900 text-primary-500 focus:ring-primary-500/30 cursor-pointer"
                />
              </th>
              <th className="px-3 sm:px-5 py-2.5 text-left text-xs font-medium text-base-400 uppercase tracking-wider">Concepto</th>
              <th className="px-3 sm:px-5 py-2.5 text-right text-xs font-medium text-base-400 uppercase tracking-wider">Monto</th>
              <th className="px-3 sm:px-5 py-2.5 text-center text-xs font-medium text-base-400 uppercase tracking-wider">Fecha</th>
              <th className="px-3 sm:px-5 py-2.5 text-center text-xs font-medium text-base-400 uppercase tracking-wider">Ciclo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base-700">
            {expenses.map((exp) => (
              <tr
                key={exp.id}
                onClick={() => onToggle(exp.id)}
                className={`cursor-pointer transition-colors duration-150 ${
                  selected.has(exp.id) ? 'bg-primary-500/5' : 'hover:bg-base-800/30'
                }`}
              >
                <td className="px-3 sm:px-5 py-2.5">
                  <input
                    type="checkbox"
                    checked={selected.has(exp.id)}
                    onChange={() => onToggle(exp.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded border-base-600 bg-base-900 text-primary-500 focus:ring-primary-500/30 cursor-pointer"
                  />
                </td>
                <td className="px-3 sm:px-5 py-2.5 text-sm text-base-200 whitespace-normal break-words min-w-[120px]">
                  {exp.concept}
                  {exp.isMSI && (
                    <span className="ml-1.5 text-xs text-base-500 whitespace-nowrap">
                      ({exp.currentInstallment}/{exp.totalInstallments})
                    </span>
                  )}
                </td>
                <td className="px-3 sm:px-5 py-2.5 text-sm text-base-200 text-right font-medium whitespace-nowrap">
                  {formatCurrency(exp.amount)}
                </td>
                <td className="px-3 sm:px-5 py-2.5 text-sm text-base-500 text-center whitespace-nowrap">
                  {new Date(exp.transactionDate).toLocaleDateString('es-MX')}
                </td>
                <td className="px-3 sm:px-5 py-2.5 text-center">
                  <CycleBadge cycle={exp.cycle} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected.size > 0 && (
        <div className="sticky bottom-0 px-4 sm:px-5 py-3 bg-primary-500/10 border-t border-primary-500/20 flex items-center justify-between text-sm">
          <span className="text-base-200">
            <span className="font-medium text-primary-400">{selected.size}</span> {selected.size === 1 ? 'fila seleccionada' : 'filas seleccionadas'}
          </span>
          <span className="font-semibold text-base-100">
            Total: <span className="text-primary-400">{formatCurrency(expenses.filter((e) => selected.has(e.id)).reduce((s, e) => s + e.amount, 0))}</span>
          </span>
        </div>
      )}
    </div>
  );
}

export function BillingSummary({ data, view }: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Map<string, Set<string>>>(new Map());

  const toggleCollapse = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const getSelection = useCallback((parentId: string) => selected.get(parentId) || new Set<string>(), [selected]);

  const toggleExpense = useCallback((parentId: string, expenseId: string) => {
    setSelected((prev) => {
      const next = new Map(prev);
      const current = new Set(next.get(parentId) || []);
      if (current.has(expenseId)) current.delete(expenseId);
      else current.add(expenseId);
      if (current.size === 0) next.delete(parentId);
      else next.set(parentId, current);
      return next;
    });
  }, []);

  const selectAll = useCallback((parentId: string, expenseIds: string[]) => {
    setSelected((prev) => {
      const next = new Map(prev);
      next.set(parentId, new Set(expenseIds));
      return next;
    });
  }, []);

  const deselectAll = useCallback((parentId: string) => {
    setSelected((prev) => {
      const next = new Map(prev);
      next.delete(parentId);
      return next;
    });
  }, []);

  const cardViewData = useMemo(() => {
    const cardMap = new Map<string, {
      cardId: string;
      cardName: string;
      lastFourDigits: string;
      cutOffDay: number;
      paymentDeadlineDay: number;
      users: { userId: string; userName: string; expenses: BillingExpense[] }[];
    }>();
    for (const us of data.summary) {
      for (const card of us.cards) {
        if (!cardMap.has(card.cardId)) {
          cardMap.set(card.cardId, {
            cardId: card.cardId,
            cardName: card.cardName,
            lastFourDigits: card.lastFourDigits,
            cutOffDay: card.cutOffDay,
            paymentDeadlineDay: card.paymentDeadlineDay,
            users: [],
          });
        }
        cardMap.get(card.cardId)!.users.push({
          userId: us.userId,
          userName: us.userName,
          expenses: card.expenses,
        });
      }
    }
    return Array.from(cardMap.values());
  }, [data]);

  if (view === 'users') {
    return (
      <div className="space-y-4">
        {data.summary.map((us) => {
          const isCollapsed = collapsed.has(us.userId);
          const userSelected = getSelection(us.userId);
          return (
            <div key={us.userId} className="glass rounded-2xl overflow-hidden animate-slide-up">
              <button
                onClick={() => toggleCollapse(us.userId)}
                className="w-full flex items-center justify-between gap-2 px-4 sm:px-6 py-4 border-b border-base-700 bg-base-900/50 hover:bg-base-800/40 transition-all duration-150 text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-1.5 rounded-lg shrink-0 transition-colors duration-200 ${isCollapsed ? 'bg-base-800' : 'bg-primary-500/10'}`}>
                    <svg className={`w-4 h-4 text-base-400 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'text-primary-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-base-100 font-display truncate">{us.userName}</h3>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm shrink-0">
                  <span className="text-primary-400 font-medium whitespace-nowrap">{formatCurrency(us.totalCurrentCycle)}</span>
                  <span className="text-base-600 hidden sm:inline">|</span>
                  <span className="text-accent-400 font-medium whitespace-nowrap">{formatCurrency(us.totalNextCycle)}</span>
                </div>
              </button>

              {!isCollapsed && (
                <div className="p-6 space-y-4">
                  {us.cards.map((card) => {
                    const cardSelected = getSelection(card.cardId);
                    return (
                      <div key={card.cardId} className="border border-base-700 rounded-xl overflow-hidden shadow-sm">
                        <div className="px-5 py-3 bg-base-950/50 border-b border-base-700">
                          <p className="font-medium text-base-100">
                            {card.cardName} •••• {card.lastFourDigits}
                          </p>
                          <p className="text-xs text-base-400 mt-0.5">
                            Corte día {card.cutOffDay} | Pago día {card.paymentDeadlineDay}
                          </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-4 sm:p-5 bg-base-900">
                          <div className="text-center p-3 sm:p-4 bg-primary-500/5 rounded-xl border border-primary-500/10">
                            <p className="text-xs text-primary-400 font-semibold uppercase tracking-wider mb-1">Ciclo actual</p>
                            <p className="text-lg sm:text-xl font-bold text-primary-300">{formatCurrency(card.currentCycleTotal)}</p>
                          </div>
                          <div className="text-center p-3 sm:p-4 bg-accent-500/5 rounded-xl border border-accent-500/10">
                            <p className="text-xs text-accent-400 font-semibold uppercase tracking-wider mb-1">Siguiente ciclo</p>
                            <p className="text-lg sm:text-xl font-bold text-accent-300">{formatCurrency(card.nextCycleTotal)}</p>
                          </div>
                        </div>
                        {card.expenses.length > 0 && (
                          <ExpenseTable
                            expenses={card.expenses}
                            selected={cardSelected}
                            onToggle={(id) => toggleExpense(card.cardId, id)}
                            onSelectAll={() => selectAll(card.cardId, card.expenses.map((e) => e.id))}
                            onDeselectAll={() => deselectAll(card.cardId)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {cardViewData.map((card) => {
        const isCollapsed = collapsed.has(card.cardId);
        const totalCurrent = card.users.reduce((s, u) => s + u.expenses.filter((e) => e.cycle === 'current').reduce((s2, e) => s2 + e.amount, 0), 0);
        const totalNext = card.users.reduce((s, u) => s + u.expenses.filter((e) => e.cycle === 'next').reduce((s2, e) => s2 + e.amount, 0), 0);
        return (
          <div key={card.cardId} className="glass rounded-2xl overflow-hidden animate-slide-up">
            <button
              onClick={() => toggleCollapse(card.cardId)}
              className="w-full flex items-center justify-between gap-2 px-4 sm:px-6 py-4 border-b border-base-700 bg-base-900/50 hover:bg-base-800/40 transition-all duration-150 text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`p-1.5 rounded-lg shrink-0 transition-colors duration-200 ${isCollapsed ? 'bg-base-800' : 'bg-primary-500/10'}`}>
                  <svg className={`w-4 h-4 text-base-400 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'text-primary-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-base-100 font-display">{card.cardName}</h3>
                  <p className="text-xs text-base-400">•••• {card.lastFourDigits} | Corte día {card.cutOffDay} | Pago día {card.paymentDeadlineDay}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm shrink-0">
                <span className="text-primary-400 font-medium whitespace-nowrap">{formatCurrency(totalCurrent)}</span>
                <span className="text-base-600 hidden sm:inline">|</span>
                <span className="text-accent-400 font-medium whitespace-nowrap">{formatCurrency(totalNext)}</span>
              </div>
            </button>

            {!isCollapsed && (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="text-center p-3 sm:p-4 bg-primary-500/5 rounded-xl border border-primary-500/10">
                    <p className="text-xs text-primary-400 font-semibold uppercase tracking-wider mb-1">Ciclo actual</p>
                    <p className="text-lg sm:text-xl font-bold text-primary-300">{formatCurrency(totalCurrent)}</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-accent-500/5 rounded-xl border border-accent-500/10">
                    <p className="text-xs text-accent-400 font-semibold uppercase tracking-wider mb-1">Siguiente ciclo</p>
                    <p className="text-lg sm:text-xl font-bold text-accent-300">{formatCurrency(totalNext)}</p>
                  </div>
                </div>

                {card.users.map((user) => {
                  const userSelected = getSelection(user.userId);
                  if (user.expenses.length === 0) return null;
                  return (
                    <div key={user.userId} className="border border-base-700 rounded-xl overflow-hidden">
                      <div className="px-5 py-2.5 bg-base-950/50 border-b border-base-700 flex items-center justify-between">
                        <p className="text-sm font-medium text-base-200">{user.userName}</p>
                        <p className="text-xs text-base-400">
                          {formatCurrency(user.expenses.filter((e) => e.cycle === 'current').reduce((s, e) => s + e.amount, 0))} actual
                          {' | '}
                          {formatCurrency(user.expenses.filter((e) => e.cycle === 'next').reduce((s, e) => s + e.amount, 0))} siguiente
                        </p>
                      </div>
                      <ExpenseTable
                        expenses={user.expenses}
                        selected={userSelected}
                        onToggle={(id) => toggleExpense(user.userId, id)}
                        onSelectAll={() => selectAll(user.userId, user.expenses.map((e) => e.id))}
                        onDeselectAll={() => deselectAll(user.userId)}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
