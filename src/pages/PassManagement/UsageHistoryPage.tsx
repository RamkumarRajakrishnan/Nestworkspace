import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  History,
  Search,
  RefreshCw,
  Ticket,
  User,
  Phone,
  Eye,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  ChevronDown,
  Check,
  X,
} from 'lucide-react';
import { getUserNestPass } from '../../services/api';
import { RawUserNestPassRecord, UserNestPassPagination } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PassUsageDetailDrawer } from '../../components/pass-management/PassUsageDetailDrawer';

const PAGE_SIZE = 20;

const safeVal = (v: any): string => {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'string') {
    const trimmed = v.trim();
    return trimmed && trimmed !== 'null' && trimmed !== 'undefined' && trimmed !== 'NaN' ? trimmed : '—';
  }
  if (typeof v === 'number') {
    if (isNaN(v)) return '—';
    return String(v);
  }
  return String(v);
};

const formatDisplayDate = (dateStr: string | null | undefined): string => {
  if (!dateStr || typeof dateStr !== 'string') return '—';
  const trimmed = dateStr.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined' || trimmed === 'NaN') return '—';
  try {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
    return trimmed;
  } catch {
    return trimmed;
  }
};

const formatCurrency = (val: number | string | null | undefined): string => {
  if (val === null || val === undefined) return '—';
  const num = Number(val);
  if (isNaN(num)) return '—';
  return `₹${num.toLocaleString('en-IN')}`;
};

/**
 * Automatically determines whether the search value is a phone number or an email/userId.
 * - If it contains letters or '@', use userId.
 * - If it consists of digits (with optional +, spaces, hyphens) and no letters, use phonenumber.
 * Strictly never returns both parameters.
 */
const detectSearchParam = (query: string): { userId?: string; phonenumber?: string } => {
  const clean = query.trim();
  if (!clean) return {};

  const hasLettersOrAt = /[a-zA-Z@]/.test(clean);
  const isPhone = !hasLettersOrAt && /^\+?[\d\s-]{7,15}$/.test(clean);

  if (isPhone) {
    return { phonenumber: clean.replace(/[\s-]/g, '') };
  }
  return { userId: clean };
};

export const UsageHistoryPage: React.FC = () => {
  // Single Search Input & Active Search Query State
  const [searchInput, setSearchInput] = useState<string>('');
  const [activeSearch, setActiveSearch] = useState<string>('');

  // Status Filter State (Defaults to 'All Statuses')
  const [selectedStatus, setSelectedStatus] = useState<string>('All Statuses');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState<boolean>(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // Data & Server-side Pagination State
  const [records, setRecords] = useState<RawUserNestPassRecord[]>([]);
  const [pagination, setPagination] = useState<UserNestPassPagination | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Drawer State
  const [selectedRecord, setSelectedRecord] = useState<RawUserNestPassRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Dynamically extract available statuses from records returned by API
  const availableStatuses = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.status && String(r.status).trim()) {
        set.add(String(r.status).trim());
      }
    });
    // Include common default statuses if not present
    set.add('Active');
    set.add('Expired');
    set.add('Completed');
    return ['All Statuses', ...Array.from(set)];
  }, [records]);

  // Fetch Usage History from Centralized API
  const fetchUsageHistory = useCallback(
    async (queryText: string, statusFilter: string, page: number, limit: number, isSilent = false) => {
      if (isSilent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
        setIsRefreshing(true);
      }
      setApiError(null);

      try {
        // Automatically determine search parameter (userId or phonenumber, never both)
        const searchParams = detectSearchParam(queryText);

        const params: {
          userId?: string;
          phonenumber?: string;
          status?: string;
          page: number;
          limit: number;
        } = {
          page,
          limit,
          ...searchParams,
        };

        if (statusFilter && statusFilter !== 'All Statuses' && statusFilter !== 'All') {
          params.status = statusFilter;
        }

        const res = await getUserNestPass(params);

        if (res.success) {
          setRecords(res.data || []);
          if (res.pagination) {
            setPagination({
              currentPage: res.pagination.currentPage,
              limit: res.pagination.limit,
              totalRecords: res.pagination.totalRecords,
              totalPages: res.pagination.totalPages,
              hasNextPage: res.pagination.hasNextPage,
              hasPreviousPage: res.pagination.hasPreviousPage,
            });
          } else {
            const count = res.count ?? (res.data ? res.data.length : 0);
            setPagination({
              currentPage: page,
              limit,
              totalRecords: count,
              totalPages: Math.max(1, Math.ceil(count / limit)),
              hasNextPage: page < Math.ceil(count / limit),
              hasPreviousPage: page > 1,
            });
          }
        } else {
          setRecords([]);
          setPagination(null);
          setApiError(res.error || 'Failed to load usage history.');
        }
      } catch (err: any) {
        console.error('Error fetching pass usage history:', err);
        setRecords([]);
        setPagination(null);
        setApiError(err?.message || 'Network error while loading pass usage history.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  // Initial load and updates on search/status/page change
  useEffect(() => {
    fetchUsageHistory(activeSearch, selectedStatus, currentPage, PAGE_SIZE);
  }, [activeSearch, selectedStatus, currentPage, fetchUsageHistory]);

  // Debounce search input changes: resets pagination to page 1 and fetches fresh data
  useEffect(() => {
    const handler = setTimeout(() => {
      const clean = searchInput.trim();
      if (clean !== activeSearch) {
        setActiveSearch(clean);
        setCurrentPage(1);
      }
    }, 450);

    return () => clearTimeout(handler);
  }, [searchInput, activeSearch]);

  // Refresh handler: keeps search value, status, and current page
  const handleRefresh = useCallback(() => {
    fetchUsageHistory(activeSearch, selectedStatus, currentPage, PAGE_SIZE, false);
  }, [activeSearch, selectedStatus, currentPage, fetchUsageHistory]);

  // Status Filter change: resets pagination to page 1, keeps search value
  const handleStatusChange = (newStatus: string) => {
    setSelectedStatus(newStatus);
    setIsStatusDropdownOpen(false);
    setCurrentPage(1);
  };

  // Clear search: returns to initial/all-records view, keeps selected status filter
  const handleClearSearch = () => {
    setSearchInput('');
    setActiveSearch('');
    setCurrentPage(1);
  };

  // Close status dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Client-side filtering by status if records are loaded
  const displayRecords = useMemo(() => {
    if (!selectedStatus || selectedStatus === 'All Statuses' || selectedStatus === 'All') return records;
    return records.filter((r) => String(r.status || '').toLowerCase() === selectedStatus.toLowerCase());
  }, [records, selectedStatus]);

  // Server-side pagination bounds
  const totalRecords = pagination?.totalRecords ?? records.length;
  const totalPages = pagination?.totalPages ?? Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const hasNextPage = pagination?.hasNextPage ?? (currentPage < totalPages);
  const hasPreviousPage = pagination?.hasPreviousPage ?? (currentPage > 1);
  const startRecord = totalRecords > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const endRecord = Math.min(currentPage * PAGE_SIZE, totalRecords);

  // Windowed pagination calculation:
  // When totalPages <= 5: display all pages [1, ..., totalPages]
  // When totalPages > 5: display window of 3 pages
  const WINDOW_SIZE = 3;
  const isWindowed = totalPages > 5;
  const windowStart = isWindowed
    ? Math.floor((currentPage - 1) / WINDOW_SIZE) * WINDOW_SIZE + 1
    : 1;
  const windowEnd = isWindowed
    ? Math.min(windowStart + WINDOW_SIZE - 1, totalPages)
    : totalPages;

  const visiblePages = useMemo(() => {
    const pages: number[] = [];
    for (let p = windowStart; p <= windowEnd; p++) {
      pages.push(p);
    }
    return pages;
  }, [windowStart, windowEnd]);

  const hasMoreAfter = isWindowed && windowEnd < totalPages;

  const handleNext = () => {
    if (isLoading || !hasNextPage) return;
    setCurrentPage((p) => Math.min(totalPages, p + 1));
  };

  const handlePrevious = () => {
    if (isLoading || !hasPreviousPage) return;
    setCurrentPage((p) => Math.max(1, p - 1));
  };

  // Drawer Open Handler
  const handleViewRecord = (record: RawUserNestPassRecord) => {
    setSelectedRecord(record);
    setIsDrawerOpen(true);
  };

  // Active detected param badge (visual indicator for the user)
  const detectedParam = useMemo(() => {
    if (!activeSearch) return null;
    return detectSearchParam(activeSearch);
  }, [activeSearch]);

  // Table Columns
  const columns: Column<RawUserNestPassRecord>[] = [
    {
      header: (
        <div className="leading-tight">
          <span className="block font-semibold">CUSTOMER</span>
          <span className="block text-[10px] font-semibold text-[#8C8C8C]">USER ID</span>
        </div>
      ),
      accessor: 'userId',
      className: 'w-[18%] min-w-[150px]',
      render: (r) => {
        const id = safeVal(r.userId);
        return (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-xl bg-[#EDE9FE] border border-[#DDD6FE] flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-[#5B21B6]" />
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-xs text-[#1F1F1F] block truncate" title={id}>
                {id}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      header: (
        <div className="leading-tight text-center">
          <span className="block font-semibold">BOOKING</span>
          <span className="block text-[10px] font-semibold text-[#8C8C8C]">REF ID</span>
        </div>
      ),
      accessor: 'bookingId',
      align: 'center',
      className: 'w-[16%] min-w-[130px]',
      render: (r) => (
        <span
          className="font-mono text-xs text-[#5B21B6] font-semibold truncate block max-w-[150px] mx-auto select-all"
          title={safeVal(r.bookingId)}
        >
          {safeVal(r.bookingId)}
        </span>
      ),
    },
    {
      header: (
        <div className="leading-tight text-center">
          <span className="block font-semibold">PACKAGE</span>
          <span className="block text-[10px] font-semibold text-[#8C8C8C]">PACK ID</span>
        </div>
      ),
      accessor: 'packId',
      align: 'center',
      className: 'w-[10%] min-w-[85px]',
      render: (r) => (
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-[#5B21B6] bg-[#EDE9FE] px-2.5 py-0.5 rounded-full border border-[#DDD6FE]">
            <Ticket className="h-3 w-3" />
            {safeVal(r.packId)}
          </span>
        </div>
      ),
    },
    {
      header: (
        <div className="leading-tight text-center">
          <span className="block font-semibold">STATUS</span>
          <span className="block text-[10px] font-semibold text-[#8C8C8C]">STATE</span>
        </div>
      ),
      accessor: 'status',
      align: 'center',
      className: 'w-[10%] min-w-[90px]',
      render: (r) => {
        const st = safeVal(r.status);
        const statusClean = st !== '—' ? r.status : 'Active';
        return (
          <div className="flex justify-center">
            <StatusBadge status={statusClean} size="sm" pulse={statusClean === 'Active'} />
          </div>
        );
      },
    },
    {
      header: (
        <div className="leading-tight text-center">
          <span className="block font-semibold">VISITS</span>
          <span className="block text-[10px] font-semibold text-[#8C8C8C]">USED / TOTAL</span>
        </div>
      ),
      accessor: 'completedVisits',
      align: 'center',
      className: 'w-[12%] min-w-[100px]',
      render: (r) => {
        const completed = Number(r.completedVisits) || 0;
        const total = Number(r.totalvisit) || 0;
        const remaining = Number(r.remainingVisits) || 0;
        return (
          <div className="flex flex-col items-center justify-center leading-tight">
            <span className="font-mono text-xs font-bold text-[#1F1F1F]">
              {completed} <span className="text-[#8C8C8C] font-normal">/</span> {total}
            </span>
            <span className="text-[10px] font-mono text-[#5B21B6] font-medium mt-0.5">
              {remaining} remaining
            </span>
          </div>
        );
      },
    },
    {
      header: (
        <div className="leading-tight text-center">
          <span className="block font-semibold">DURATION</span>
          <span className="block text-[10px] font-semibold text-[#8C8C8C]">PER VISIT</span>
        </div>
      ),
      accessor: 'duration',
      align: 'center',
      className: 'w-[10%] min-w-[85px]',
      render: (r) => (
        <span className="font-mono text-xs text-[#1F1F1F] font-medium whitespace-nowrap">
          {safeVal(r.duration)} <span className="text-[#8C8C8C] text-[10px]">mins</span>
        </span>
      ),
    },
    {
      header: (
        <div className="leading-tight text-center">
          <span className="block font-semibold">AMOUNT</span>
          <span className="block text-[10px] font-semibold text-[#8C8C8C]">PAID</span>
        </div>
      ),
      accessor: 'paidAmount',
      align: 'center',
      className: 'w-[10%] min-w-[85px]',
      render: (r) => (
        <span className="font-mono text-xs text-[#027A48] font-bold whitespace-nowrap">
          {formatCurrency(r.paidAmount)}
        </span>
      ),
    },
    {
      header: (
        <div className="leading-tight text-center">
          <span className="block font-semibold">EXPIRY</span>
          <span className="block text-[10px] font-semibold text-[#8C8C8C]">DATE</span>
        </div>
      ),
      accessor: 'expiryDate',
      align: 'center',
      className: 'w-[10%] min-w-[95px]',
      render: (r) => (
        <span className="font-mono text-xs text-[#6B6B6B] whitespace-nowrap">
          {formatDisplayDate(r.expiryDate)}
        </span>
      ),
    },
    {
      header: (
        <div className="leading-tight text-center">
          <span className="block font-semibold">ACTIONS</span>
          <span className="block text-[10px] font-semibold text-[#8C8C8C]">VIEW</span>
        </div>
      ),
      align: 'center',
      className: 'w-[6%] min-w-[55px]',
      render: (r) => (
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleViewRecord(r);
            }}
            className="p-1.5 rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] text-[#5B21B6] hover:bg-[#EDE9FE] transition-colors cursor-pointer"
            title="View Usage Details"
            aria-label="View Usage Details"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 w-full max-w-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 w-full">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F1F1F] flex items-center gap-2 truncate">
            <History className="h-6 w-6 text-[#5B21B6]" />
            Pass Usage History
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6B6B] mt-0.5 truncate">
            Audit customer pass redemptions, active package balances, and session consumption.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="relative z-20 rounded-2xl border border-[#EEEEF2] bg-white p-3 sm:p-4 shadow-soft-sm space-y-3 w-full max-w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: ONE SINGLE SEARCH BAR */}
          <div className="relative flex-1 max-w-lg min-w-0">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-[#8C8C8C]" />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by Email or Phone Number"
              className="w-full rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] pl-9 pr-9 py-2 text-xs text-[#1F1F1F] placeholder-[#8C8C8C] focus:border-[#5B21B6] focus:bg-white focus:outline-none transition-colors"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#8C8C8C] hover:text-[#B42318] cursor-pointer"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Right: Status Filter & Refresh Button */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
            {/* Status Filter Dropdown */}
            <div ref={statusDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setIsStatusDropdownOpen((prev) => !prev)}
                className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all shadow-soft-sm active:scale-95 cursor-pointer ${
                  selectedStatus !== 'All Statuses'
                    ? 'border-[#5B21B6] bg-[#EDE9FE] text-[#5B21B6]'
                    : 'border-[#EEEEF2] bg-[#FAF9FC] text-[#1F1F1F] hover:bg-[#EDE9FE] hover:text-[#5B21B6]'
                }`}
                title="Filter by Pass Status"
                aria-expanded={isStatusDropdownOpen}
              >
                <Filter className="h-3.5 w-3.5 text-[#5B21B6]" />
                <span className="text-[#6B6B6B]">Status:</span>
                <span className="font-bold text-[#5B21B6]">{selectedStatus}</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${
                    isStatusDropdownOpen ? 'rotate-180 text-[#5B21B6]' : 'text-[#6B6B6B]'
                  }`}
                />
              </button>

              {isStatusDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 z-40 w-44 rounded-xl border border-[#EEEEF2] bg-white shadow-soft-lg p-1 space-y-0.5 animate-in fade-in duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-[#8C8C8C] uppercase tracking-wider border-b border-[#F3F2F7]">
                    Filter Status
                  </div>
                  {availableStatuses.map((st) => {
                    const isSelected = selectedStatus === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleStatusChange(st)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#EDE9FE] text-[#5B21B6] font-bold'
                            : 'text-[#1F1F1F] hover:bg-[#FAF9FC]'
                        }`}
                      >
                        <span>{st}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-[#5B21B6] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing}
              className="flex items-center gap-1.5 rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] px-3.5 py-2 text-xs font-semibold text-[#6B6B6B] hover:text-[#5B21B6] hover:bg-[#EDE9FE] transition-all shadow-soft-sm active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              title="Refresh usage history"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading || isRefreshing ? 'animate-spin text-[#5B21B6]' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter / Search Info Bar */}
        {(activeSearch || selectedStatus !== 'All Statuses' || totalRecords > 0) && (
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#F3F2F7] flex-wrap text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              {detectedParam?.userId && (
                <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[#5B21B6] bg-[#EDE9FE] border border-[#DDD6FE] px-2.5 py-0.5 rounded-full">
                  <User className="h-3 w-3" />
                  <span className="font-bold">userId:</span>
                  <span>{detectedParam.userId}</span>
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="ml-1 hover:text-[#B42318] cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {detectedParam?.phonenumber && (
                <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[#5B21B6] bg-[#EDE9FE] border border-[#DDD6FE] px-2.5 py-0.5 rounded-full">
                  <Phone className="h-3 w-3" />
                  <span className="font-bold">phonenumber:</span>
                  <span>{detectedParam.phonenumber}</span>
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="ml-1 hover:text-[#B42318] cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedStatus !== 'All Statuses' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#027A48] bg-[#ECFDF3] border border-[#A6F4C5] px-2.5 py-0.5 rounded-full">
                  Status: {selectedStatus}
                  <button
                    type="button"
                    onClick={() => handleStatusChange('All Statuses')}
                    className="ml-1 hover:text-[#B42318] cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {totalRecords > 0 && (
                <span className="text-[11px] text-[#6B6B6B]">
                  • {totalRecords} {totalRecords === 1 ? 'record' : 'records'} total
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="w-full rounded-2xl border border-[#EEEEF2] bg-white p-6 shadow-soft-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-5 w-48 bg-[#EDE9FE] animate-pulse rounded-lg" />
            <div className="h-4 w-24 bg-[#FAF9FC] animate-pulse rounded-lg" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div key={idx} className="h-12 w-full bg-[#FAF9FC] animate-pulse rounded-xl" />
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {!isLoading && apiError && (
        <div className="rounded-2xl border border-rose-200 bg-[#FEF2F2] p-8 text-center shadow-soft-sm space-y-3">
          <AlertCircle className="h-8 w-8 text-[#B42318] mx-auto" />
          <h3 className="text-sm font-bold text-[#B42318]">{apiError}</h3>
          <p className="text-xs text-[#6B6B6B] max-w-md mx-auto">
            Unable to fetch pass usage history. Please check your connection and retry.
          </p>
          <button
            type="button"
            onClick={handleRefresh}
            className="rounded-xl bg-[#B42318] hover:bg-rose-800 text-white px-5 py-2 text-xs font-semibold shadow-soft-sm transition-all active:scale-95 cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* Table (Desktop & Tablet): Always shown on initial load and search */}
      {!isLoading && !apiError && (
        <div className="hidden lg:block">
          <DataTable
            columns={columns}
            data={displayRecords}
            keyExtractor={(r: RawUserNestPassRecord) => `${r.bookingId || r.userId}_${r.packId}`}
            compact={true}
            emptyTitle="No pass usage records found"
            emptyDescription={
              activeSearch
                ? `No pass usage records found matching "${activeSearch}".`
                : selectedStatus !== 'All Statuses'
                ? `No pass usage records found with status "${selectedStatus}".`
                : 'No pass usage history records available.'
            }
          />
        </div>
      )}

      {/* Responsive Card View (Mobile & Tablet) */}
      {!isLoading && !apiError && (
        <div className="block lg:hidden space-y-3">
          {displayRecords.length === 0 ? (
            <div className="rounded-2xl border border-[#EEEEF2] bg-white p-8 text-center shadow-soft-sm">
              <h3 className="text-sm font-bold text-[#1F1F1F]">No pass usage records found</h3>
              <p className="text-xs text-[#6B6B6B] mt-1">
                {activeSearch
                  ? `No pass usage records found matching "${activeSearch}".`
                  : 'No pass usage history records available.'}
              </p>
            </div>
          ) : (
            displayRecords.map((r, index) => {
              const statusClean = safeVal(r.status) !== '—' ? r.status : 'Active';
              const completed = Number(r.completedVisits) || 0;
              const total = Number(r.totalvisit) || 0;
              const remaining = Number(r.remainingVisits) || 0;

              return (
                <div
                  key={`${r.bookingId || r.userId}_${index}`}
                  className="rounded-2xl border border-[#EEEEF2] bg-white p-4 shadow-soft-sm space-y-3"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-2 border-b border-[#EEEEF2] pb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-9 w-9 rounded-xl bg-[#EDE9FE] border border-[#DDD6FE] flex items-center justify-center shrink-0">
                        <Ticket className="h-4 w-4 text-[#5B21B6]" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-[#1F1F1F] truncate" title={safeVal(r.packId)}>
                          Package {safeVal(r.packId)}
                        </h4>
                        <span className="font-mono text-[11px] text-[#5B21B6] font-semibold truncate block">
                          {safeVal(r.userId)}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={statusClean} size="sm" pulse={statusClean === 'Active'} />
                  </div>

                  {/* Card Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl bg-[#FAF9FC] p-2.5 border border-[#EEEEF2]">
                      <span className="text-[10px] text-[#6B6B6B] font-mono block">BOOKING REF</span>
                      <span className="font-mono text-[11px] font-semibold text-[#5B21B6] truncate block select-all">
                        {safeVal(r.bookingId)}
                      </span>
                    </div>

                    <div className="rounded-xl bg-[#FAF9FC] p-2.5 border border-[#EEEEF2]">
                      <span className="text-[10px] text-[#6B6B6B] font-mono block">VISITS (USED/TOTAL)</span>
                      <span className="font-mono text-[11px] font-bold text-[#1F1F1F]">
                        {completed} / {total} ({remaining} left)
                      </span>
                    </div>

                    <div className="rounded-xl bg-[#FAF9FC] p-2.5 border border-[#EEEEF2]">
                      <span className="text-[10px] text-[#6B6B6B] font-mono block">DURATION</span>
                      <span className="font-mono text-[11px] font-medium text-[#1F1F1F]">
                        {safeVal(r.duration)} mins/visit
                      </span>
                    </div>

                    <div className="rounded-xl bg-[#FAF9FC] p-2.5 border border-[#EEEEF2]">
                      <span className="text-[10px] text-[#6B6B6B] font-mono block">AMOUNT PAID</span>
                      <span className="font-mono text-[11px] font-bold text-[#027A48]">
                        {formatCurrency(r.paidAmount)}
                      </span>
                    </div>

                    <div className="col-span-2 rounded-xl bg-[#FAF9FC] p-2.5 border border-[#EEEEF2] flex items-center justify-between">
                      <span className="text-[10px] text-[#6B6B6B] font-mono">EXPIRY DATE</span>
                      <span className="font-mono text-[11px] font-semibold text-[#1F1F1F]">
                        {formatDisplayDate(r.expiryDate)}
                      </span>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-end pt-2 border-t border-[#F3F2F7]">
                    <button
                      type="button"
                      onClick={() => handleViewRecord(r)}
                      className="flex items-center gap-1.5 rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] px-3.5 py-1.5 text-xs font-semibold text-[#5B21B6] hover:bg-[#EDE9FE] transition-colors cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Server-Side Windowed Pagination Controls */}
      {!isLoading && !apiError && totalRecords > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border border-[#EEEEF2] bg-white px-4 py-3 rounded-2xl shadow-soft-sm w-full">
          <div className="text-xs text-[#6B6B6B]">
            Showing <strong className="text-[#1F1F1F] font-mono">{startRecord}</strong> to{' '}
            <strong className="text-[#1F1F1F] font-mono">{endRecord}</strong> of{' '}
            <strong className="text-[#1F1F1F] font-mono">{totalRecords}</strong> records
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Previous Button */}
            <button
              type="button"
              onClick={handlePrevious}
              disabled={!hasPreviousPage || isLoading}
              className="flex items-center gap-1.5 rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] px-3.5 py-1.5 text-xs font-semibold text-[#1F1F1F] hover:bg-[#EDE9FE] hover:text-[#5B21B6] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="h-3.5 w-3.5 text-[#6B6B6B]" />
              <span>Previous</span>
            </button>

            {/* Windowed Page Numbers */}
            {visiblePages.map((pageNum) => {
              const isActive = pageNum === currentPage;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  disabled={isLoading}
                  className={`h-8 w-8 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                    isActive
                      ? 'bg-[#5B21B6] text-white shadow-soft-xs'
                      : 'border border-[#EEEEF2] bg-[#FAF9FC] text-[#1F1F1F] hover:bg-[#EDE9FE] hover:text-[#5B21B6]'
                  }`}
                  title={`Page ${pageNum}`}
                >
                  {pageNum}
                </button>
              );
            })}

            {/* Trailing Ellipsis */}
            {hasMoreAfter && (
              <span className="px-1 text-xs font-bold text-[#6B6B6B] select-none">
                ...
              </span>
            )}

            {/* Next Button */}
            <button
              type="button"
              onClick={handleNext}
              disabled={!hasNextPage || isLoading}
              className="flex items-center gap-1.5 rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] px-3.5 py-1.5 text-xs font-semibold text-[#1F1F1F] hover:bg-[#EDE9FE] hover:text-[#5B21B6] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Next Page"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5 text-[#6B6B6B]" />
            </button>
          </div>
        </div>
      )}

      {/* Usage Detail Drawer */}
      <PassUsageDetailDrawer
        record={selectedRecord}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedRecord(null);
        }}
      />
    </div>
  );
};

export default UsageHistoryPage;
