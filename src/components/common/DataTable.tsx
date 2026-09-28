import React from 'react';
import clsx from 'clsx';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  header: string;
  accessor?: keyof T;
  render?: (row: T, index: number) => React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  rowClassName?: (row: T, index: number) => string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  isLoading = false,
  emptyTitle = 'No data available',
  emptyDescription = 'No records match the selected criteria',
  rowClassName,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="w-full rounded-2xl border border-[#EEEEF2] bg-white p-6 space-y-3 shadow-soft-sm">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 w-full animate-pulse rounded-xl bg-[#F5F3FF]" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-[#EEEEF2] bg-white p-8 shadow-soft-sm">
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-[#EEEEF2] bg-white shadow-soft-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-[#1F1F1F]">
          <thead className="border-b border-[#EEEEF2] bg-[#FAF9FC] text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B]">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={clsx(
                    'px-4 py-3.5',
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3F2F7] font-sans">
            {data.map((row, index) => {
              const key = keyExtractor(row);
              const customRowClass = rowClassName ? rowClassName(row, index) : '';
              return (
                <tr
                  key={key}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={clsx(
                    'transition-colors duration-150',
                    customRowClass || (onRowClick ? 'cursor-pointer hover:bg-[#F9F8FD]' : 'hover:bg-[#FAF9FC]'),
                    onRowClick && 'cursor-pointer'
                  )}
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      className={clsx(
                        'px-4 py-3.5 whitespace-nowrap align-middle',
                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                        col.className
                      )}
                    >
                      {col.render
                        ? col.render(row, index)
                        : col.accessor
                        ? (row[col.accessor] as unknown as React.ReactNode)
                        : null}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-[#EEEEF2] bg-[#FAF9FC] px-4 py-3 text-xs text-[#6B6B6B]">
        <span>Showing <strong className="text-[#1F1F1F] font-semibold">{data.length}</strong> records</span>
        <span className="font-mono text-[11px] text-[#5B21B6] font-semibold">Live Realtime Sync</span>
      </div>
    </div>
  );
}
