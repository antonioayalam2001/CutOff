'use client';
import { useMemo } from 'react';
import { useReactTable, getCoreRowModel, flexRender, ColumnDef } from '@tanstack/react-table';

interface DataTableProps<T extends { id: string }> {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  error?: string | null;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-base-800 rounded-md animate-shimmer bg-gradient-to-r from-base-800 via-base-700 to-base-800 bg-[length:200%_100%]" />
        </td>
      ))}
    </tr>
  );
}

function Checkbox({ checked, onChange, indeterminate }: { checked: boolean; onChange: () => void; indeterminate?: boolean }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
        checked || indeterminate
          ? 'bg-primary-500 border-primary-500'
          : 'border-base-600 hover:border-base-500'
      }`}
    >
      {indeterminate ? (
        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 12h14" />
        </svg>
      ) : checked ? (
        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      ) : null}
    </button>
  );
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  isLoading,
  error,
  selectedIds,
  onSelectionChange,
}: DataTableProps<T>) {
  const allSelected = data.length > 0 && data.every((row) => selectedIds?.has(row.id));
  const someSelected = !allSelected && data.some((row) => selectedIds?.has(row.id));

  const toggleAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) {
      const next = new Set(selectedIds);
      data.forEach((row) => next.delete(row.id));
      onSelectionChange(next);
    } else {
      const next = new Set(selectedIds);
      data.forEach((row) => next.add(row.id));
      onSelectionChange(next);
    }
  };

  const toggleOne = (id: string) => {
    if (!onSelectionChange) return;
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  const allColumns: ColumnDef<T>[] = useMemo(() => {
    if (!onSelectionChange) return columns;
    return [
      {
        id: '_selection',
        header: () => (
          <Checkbox checked={allSelected} onChange={toggleAll} indeterminate={someSelected} />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedIds?.has(row.original.id) || false}
            onChange={() => toggleOne(row.original.id)}
          />
        ),
        size: 40,
      } as ColumnDef<T>,
      ...columns,
    ];
  }, [columns, onSelectionChange, selectedIds, allSelected, someSelected]);

  const table = useReactTable({
    data,
    columns: allColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-base-800">
          <thead className="bg-base-950/50 sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-medium text-base-400 uppercase tracking-wider"
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-base-900/50 divide-y divide-base-800">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} cols={allColumns.length} />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (error) {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-base-800">
          <thead className="bg-base-950/50 sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-medium text-base-400 uppercase tracking-wider"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-base-900/50 divide-y divide-base-800">
            <tr>
              <td colSpan={allColumns.length} className="px-4 py-12 text-center">
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-base-800">
        <thead className="bg-base-950/50 sticky top-0 z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-3 text-left text-xs font-medium text-base-400 uppercase tracking-wider"
                  style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="bg-base-900/50 divide-y divide-base-800">
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td colSpan={allColumns.length} className="px-4 py-12 text-center text-sm text-base-500">
                No hay datos disponibles
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row, i) => (
              <tr
                key={row.id}
                className={`hover:bg-base-800/40 transition-colors duration-150 animate-fade-in ${
                  selectedIds?.has(row.original.id) ? 'bg-primary-500/5' : ''
                }`}
                style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'both' }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 text-sm text-base-200 whitespace-normal break-words min-w-[100px]">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
