'use client';
import { useState } from 'react';
import { BillingResponse } from '@/types';

interface Props {
  data: BillingResponse;
}

export function BillingSummary({ data }: Props) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (userId: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {data.summary.map((userSummary) => {
        const isCollapsed = collapsed.has(userSummary.userId);
        return (
          <div
            key={userSummary.userId}
            className="bg-base-900 rounded-2xl border border-base-700 overflow-hidden shadow-card animate-slide-up"
          >
            <button
              onClick={() => toggle(userSummary.userId)}
              className="w-full flex items-center justify-between gap-2 px-4 sm:px-6 py-4 border-b border-base-700 bg-base-900/50 hover:bg-base-800/40 transition-all duration-150 text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`p-1.5 rounded-lg shrink-0 transition-colors duration-200 ${isCollapsed ? 'bg-base-800' : 'bg-primary-500/10'}`}>
                  <svg
                    className={`w-4 h-4 text-base-400 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'text-primary-400'}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-base-100 font-display truncate">{userSummary.userName}</h3>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm shrink-0">
                <span className="text-primary-400 font-medium whitespace-nowrap">{formatCurrency(userSummary.totalCurrentCycle)}</span>
                <span className="text-base-600 hidden sm:inline">|</span>
                <span className="text-accent-400 font-medium whitespace-nowrap">{formatCurrency(userSummary.totalNextCycle)}</span>
              </div>
            </button>

            {!isCollapsed && (
              <div className="p-6 space-y-4">
                {userSummary.cards.map((card) => (
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
                      <div className="border-t border-base-700 overflow-x-auto">
                        <table className="min-w-full divide-y divide-base-700">
                          <thead className="bg-base-950/50">
                            <tr>
                              <th className="px-3 sm:px-5 py-2.5 text-left text-xs font-medium text-base-400 uppercase tracking-wider">Concepto</th>
                              <th className="px-3 sm:px-5 py-2.5 text-right text-xs font-medium text-base-400 uppercase tracking-wider">Monto</th>
                              <th className="px-3 sm:px-5 py-2.5 text-center text-xs font-medium text-base-400 uppercase tracking-wider">Fecha</th>
                              <th className="px-3 sm:px-5 py-2.5 text-center text-xs font-medium text-base-400 uppercase tracking-wider">Ciclo</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-base-700">
                            {card.expenses.map((exp) => (
                              <tr key={exp.id} className="hover:bg-base-800/30 transition-colors duration-150">
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
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                    exp.cycle === 'current'
                                      ? 'bg-primary-500/10 text-primary-400 border-primary-500/20'
                                      : 'bg-accent-500/10 text-accent-400 border-accent-500/20'
                                  }`}>
                                    {exp.cycle === 'current' ? 'Actual' : 'Siguiente'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
