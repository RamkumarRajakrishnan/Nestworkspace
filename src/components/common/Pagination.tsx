import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalRecords?: number;
  pageSize?: number;
  startRecord?: number;
  endRecord?: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  recordLabel?: string;
  className?: string;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalRecords,
  pageSize = 20,
  startRecord,
  endRecord,
  onPageChange,
  isLoading = false,
  recordLabel = 'records',
  className = '',
  hasNextPage: customHasNextPage,
  hasPreviousPage: customHasPreviousPage,
}) => {
  const safeTotalPages = Math.max(1, totalPages || 1);
  const safeCurrentPage = Math.min(Math.max(1, currentPage || 1), safeTotalPages);

  const WINDOW_SIZE = 3;
  const isWindowed = safeTotalPages > WINDOW_SIZE;

  const windowStart = isWindowed
    ? Math.min(Math.max(1, safeCurrentPage), safeTotalPages - WINDOW_SIZE + 1)
    : 1;
  const windowEnd = isWindowed
    ? windowStart + WINDOW_SIZE - 1
    : safeTotalPages;

  const visiblePages = useMemo(() => {
    const pages: number[] = [];
    for (let p = windowStart; p <= windowEnd; p++) {
      pages.push(p);
    }
    return pages;
  }, [windowStart, windowEnd]);

  const hasMoreAfter = isWindowed && windowEnd < safeTotalPages;

  const hasPreviousPage =
    typeof customHasPreviousPage === 'boolean'
      ? customHasPreviousPage
      : safeCurrentPage > 1;
  const hasNextPage =
    typeof customHasNextPage === 'boolean'
      ? customHasNextPage
      : safeCurrentPage < safeTotalPages;

  const computedStartRecord =
    startRecord !== undefined
      ? startRecord
      : totalRecords !== undefined && totalRecords > 0
      ? (safeCurrentPage - 1) * pageSize + 1
      : 0;

  const computedEndRecord =
    endRecord !== undefined
      ? endRecord
      : totalRecords !== undefined
      ? Math.min(safeCurrentPage * pageSize, totalRecords)
      : 0;

  const handlePrevious = () => {
    if (isLoading || !hasPreviousPage) return;
    onPageChange(safeCurrentPage - 1);
  };

  const handleNext = () => {
    if (isLoading || !hasNextPage) return;
    onPageChange(safeCurrentPage + 1);
  };

  const [pageInput, setPageInput] = useState<string>('');

  const trimmedInput = pageInput.trim();
  const parsedPage = parseInt(trimmedInput, 10);
  const isInputNumber = !isNaN(parsedPage);
  const isPageExceeded = isInputNumber && parsedPage > safeTotalPages;
  const isPageInvalid = !trimmedInput || !isInputNumber || parsedPage < 1 || isPageExceeded;
  const isGoDisabled = isLoading || isPageInvalid;

  const handleJumpToPage = () => {
    if (isGoDisabled) return;
    onPageChange(parsedPage);
    setPageInput('');
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 border border-[#EEEEF2] bg-white px-4 py-3 rounded-2xl shadow-soft-sm w-full ${className}`}
    >
      {/* Left info */}
      <div className="text-xs text-[#6B6B6B]">
        {totalRecords !== undefined ? (
          <span>
            Showing <strong className="text-[#1F1F1F] font-semibold">{computedStartRecord}</strong> to{' '}
            <strong className="text-[#1F1F1F] font-semibold">{computedEndRecord}</strong> of{' '}
            <strong className="text-[#1F1F1F] font-semibold">{totalRecords}</strong> {recordLabel}
            {safeTotalPages > 1 && (
              <span className="ml-1 text-[#6B6B6B]">
                (Page <strong className="text-[#1B2E79] font-semibold">{safeCurrentPage}</strong> of{' '}
                <strong className="text-[#1B2E79] font-semibold">{safeTotalPages}</strong>)
              </span>
            )}
          </span>
        ) : (
          <span>
            Page <strong className="text-[#1B2E79] font-semibold">{safeCurrentPage}</strong> of{' '}
            <strong className="text-[#1B2E79] font-semibold">{safeTotalPages}</strong>
          </span>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Previous Button */}
        <button
          type="button"
          onClick={handlePrevious}
          disabled={!hasPreviousPage || isLoading}
          className="flex items-center gap-1 rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] px-3 py-1.5 text-xs font-semibold text-[#1F1F1F] hover:bg-[#EEF3FF] hover:text-[#1B2E79] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          title="Previous Page"
          aria-label="Previous Page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>Previous</span>
        </button>

        {/* Sliding Page Numbers */}
        {visiblePages.map((pageNum) => {
          const isActive = pageNum === safeCurrentPage;
          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => {
                if (!isLoading && pageNum !== safeCurrentPage) {
                  onPageChange(pageNum);
                }
              }}
              disabled={isLoading}
              className={`h-8 w-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#1B2E79] text-white shadow-soft-xs pointer-events-none'
                  : 'border border-[#EEEEF2] bg-[#FAF9FC] text-[#1F1F1F] hover:bg-[#EEF3FF] hover:text-[#1B2E79]'
              }`}
              aria-label={`Page ${pageNum}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {pageNum}
            </button>
          );
        })}

        {/* Ellipsis if more pages exist after current window */}
        {hasMoreAfter && (
          <span className="px-1 text-xs text-[#6B6B6B] select-none font-bold">...</span>
        )}

        {/* Next Button */}
        <button
          type="button"
          onClick={handleNext}
          disabled={!hasNextPage || isLoading}
          className="flex items-center gap-1 rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] px-3 py-1.5 text-xs font-semibold text-[#1F1F1F] hover:bg-[#EEF3FF] hover:text-[#1B2E79] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          title="Next Page"
          aria-label="Next Page"
        >
          <span>Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>

        {/* Go To Page Input Box */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-[#EEEEF2] ml-1">
          <span className="text-[11px] font-medium text-[#6B6B6B] hidden sm:inline select-none">Go to:</span>
          <input
            type="number"
            min={1}
            max={safeTotalPages}
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleJumpToPage();
              }
            }}
            placeholder="Page"
            disabled={isLoading}
            className={`h-8 w-14 rounded-xl border px-1.5 text-center text-xs font-bold font-mono transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
              isPageExceeded
                ? 'border-rose-400 bg-rose-50 text-rose-700 focus:border-rose-500 focus:outline-none'
                : 'border-[#EEEEF2] bg-[#FAF9FC] text-[#1F1F1F] placeholder:text-[#9CA3AF] placeholder:font-normal focus:border-[#1B2E79] focus:bg-white focus:outline-none'
            }`}
            aria-label="Go to page number"
            title={isPageExceeded ? `Page number cannot exceed ${safeTotalPages}` : undefined}
          />
          <button
            type="button"
            onClick={handleJumpToPage}
            disabled={isGoDisabled}
            className="h-8 px-2.5 rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] text-xs font-bold text-[#1B2E79] hover:bg-[#EEF3FF] hover:border-[#C4D9FD] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-soft-xs active:scale-95"
            title={isPageExceeded ? `Page cannot exceed ${safeTotalPages}` : 'Go to entered page'}
          >
            Go
          </button>
        </div>
      </div>
    </div>
  );
};
