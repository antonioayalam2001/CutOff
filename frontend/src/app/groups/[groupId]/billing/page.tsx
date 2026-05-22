'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { GroupTabs } from '@/features/groups/components/GroupTabs';
import { BillingSummary } from '@/features/billing/components/BillingSummary';
import { useBilling } from '@/features/billing/hooks/useBilling';
import { useGroup } from '@/features/groups/hooks/useGroups';
import { Button } from '@/shared/ui/Button';
import { exportBillingPdf } from '@/features/billing/lib/exportBillingPdf';
import { toast } from 'sonner';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export default function BillingPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { data: group } = useGroup(groupId);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [view, setView] = useState<'users' | 'cards'>('users');
  const [isExporting, setIsExporting] = useState(false);
  const { data: billing, isLoading, isError, error } = useBilling(groupId, year, month);

  const handleExportPdf = async () => {
    if (!group || !billing) return;
    setIsExporting(true);
    try {
      await exportBillingPdf({
        groupName: group.name,
        year,
        month,
        billing,
      });
      toast.success('PDF exportado');
    } catch {
      toast.error('No se pudo generar el PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6 cinematic-stagger">
        <h1 className="ui-page-title">{group?.name}</h1>
        <GroupTabs groupId={groupId} />

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="ui-section-title">Resumen de facturación</h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex gap-1 p-0.5 bg-base-800 rounded-xl border border-base-700">
              <button
                onClick={() => setView('users')}
                className={`motion-press px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg ${
                  view === 'users'
                    ? 'bg-primary-500/20 text-primary-400 shadow-sm'
                    : 'text-base-400 hover:text-base-200'
                }`}
              >
                Usuarios
              </button>
              <button
                onClick={() => setView('cards')}
                className={`motion-press px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg ${
                  view === 'cards'
                    ? 'bg-primary-500/20 text-primary-400 shadow-sm'
                    : 'text-base-400 hover:text-base-200'
                }`}
              >
                Tarjetas
              </button>
            </div>
            <Button
              variant="secondary"
              size="sm"
              isLoading={isExporting}
              disabled={!billing || isLoading}
              onClick={handleExportPdf}
            >
              Exportar PDF
            </Button>
          </div>
        </div>

        <div className="ui-toolbar">
          <button
            onClick={() => setYear((y) => y - 1)}
            className="ui-chip flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-base-100 font-semibold text-lg min-w-[80px] text-center">{year}</span>
          <button
            onClick={() => setYear((y) => y + 1)}
            className="ui-chip flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {(year !== now.getFullYear() || month !== now.getMonth() + 1) && (
            <button
              onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth() + 1); }}
              className="motion-press px-3 py-1.5 rounded-lg text-sm font-medium bg-primary-500/10 text-primary-400 border border-primary-500/20 hover:bg-primary-500/20 hover:border-primary-500/30"
            >
              Hoy
            </button>
          )}
        </div>

        <div className="flex gap-1.5 sm:gap-2 flex-wrap">
          {MONTHS.map((name, i) => {
            const m = i + 1;
            return (
              <button
                key={m}
                onClick={() => setMonth(m)}
                className={`px-2.5 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium ${
                  month === m
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'bg-base-800 text-base-400 border border-base-700 hover:text-base-200 hover:border-base-600 motion-press'
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-base-900 rounded-2xl border border-base-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-base-800">
                  <div className="h-6 w-32 bg-base-800 rounded-md animate-shimmer bg-gradient-to-r from-base-800 via-base-700 to-base-800 bg-[length:200%_100%]" />
                </div>
                <div className="p-6 space-y-4">
                  {Array.from({ length: 2 }).map((_, j) => (
                    <div key={j} className="border border-base-800 rounded-xl p-5">
                      <div className="h-5 w-48 bg-base-800 rounded-md animate-shimmer bg-gradient-to-r from-base-800 via-base-700 to-base-800 bg-[length:200%_100%] mb-4" />
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-20 bg-base-800 rounded-xl animate-shimmer bg-gradient-to-r from-base-800 via-base-700 to-base-800 bg-[length:200%_100%]" />
                        <div className="h-20 bg-base-800 rounded-xl animate-shimmer bg-gradient-to-r from-base-800 via-base-700 to-base-800 bg-[length:200%_100%]" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-16 bg-base-900 rounded-2xl border border-base-800">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-base-400 mb-2">Error al cargar facturación</p>
            <p className="text-sm text-base-500">{error instanceof Error ? error.message : 'Intenta de nuevo más tarde'}</p>
          </div>
        ) : billing ? (
          <BillingSummary data={billing} view={view} />
        ) : (
          <div className="text-center py-16 bg-base-900 rounded-2xl border border-base-800">
            <p className="text-base-500">No hay datos de facturación disponibles</p>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
