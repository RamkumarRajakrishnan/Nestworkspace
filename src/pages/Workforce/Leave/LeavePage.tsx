import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { getExpertsLeaveRequest, getActiveAreas } from '../../../services/api';
import { RawLeaveRecord, LeavePagination } from '../../../types';
import { DataTable, Column } from '../../../components/common/DataTable';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { SearchInput } from '../../../components/common/SearchInput';
import { LeaveDetailDrawer } from '../../../components/workforce/LeaveDetailDrawer';
import {
  Calendar,
  CalendarDays,
  Clock,
  User,
  MapPin,
  Eye,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Check,
  X,
} from 'lucide-react';

interface ActiveAreaItem {
  areaName: string;
  [key: string]: any;
}

interface TableLeaveRecord extends RawLeaveRecord {
  _tableKey: string;
}

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
    const parts = trimmed.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      const year = parseInt(parts[0], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, monthIndex, day);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    }
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    return trimmed;
  } catch {
    return trimmed;
  }
};

const formatDisplayDateTime = (dateTimeStr: string | null | undefined): string => {
  if (!dateTimeStr || typeof dateTimeStr !== 'string') return '—';
  const trimmed = dateTimeStr.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined' || trimmed === 'NaN') return '—';
  try {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      const datePart = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const timePart = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
      return `${datePart}, ${timePart}`;
    }
    return trimmed;
  } catch {
    return trimmed;
  }
};

export const LeavePage: React.FC = () => {
  const { session, accessibleAreas, hasAllAreaAccess } = useAuth();

  // Dynamic Available Areas from Active Areas API
  const [activeAreas, setActiveAreas] = useState<string[]>([]);

  // Default initial area: logged-in user's area, fallback to first accessible area, or 'Neo_Town'
  const initialArea = useMemo(() => {
    if (session?.areaName && session.areaName.trim()) {
      return session.areaName.trim();
    }
    if (accessibleAreas && accessibleAreas.length > 0) {
      return accessibleAreas[0].trim();
    }
    return 'Neo_Town';
  }, [session?.areaName, accessibleAreas]);

  // Selected Area Filter State
  const [selectedArea, setSelectedArea] = useState<string>(initialArea);

  // Leave Records & Server-side Pagination State
  const [leaveRecords, setLeaveRecords] = useState<RawLeaveRecord[]>([]);
  const [pagination, setPagination] = useState<LeavePagination | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 20;

  // Loading & Error States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Drawer State
  const [selectedRecord, setSelectedRecord] = useState<RawLeaveRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Quick Client Search State (filters currently visible page records by name or worker ID)
  const [search, setSearch] = useState<string>('');

  // Filter Popover Controls
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [isAreaSelectOpen, setIsAreaSelectOpen] = useState<boolean>(false);
  const [areaSearchQuery, setAreaSearchQuery] = useState<string>('');
  const [draftArea, setDraftArea] = useState<string>(initialArea);
  const filterContainerRef = useRef<HTMLDivElement>(null);

  // Fetch active areas dynamically
  useEffect(() => {
    getActiveAreas()
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const names = res.data.map((a: ActiveAreaItem) => a.areaName).filter(Boolean);
          if (names.length > 0) {
            setActiveAreas(Array.from(new Set(names)));
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load active areas:', err);
      });
  }, []);

  // Combined area choices for dropdown: accessibleAreas + activeAreas + fallbacks
  const areaOptions = useMemo(() => {
    const set = new Set<string>();
    if (initialArea) set.add(initialArea);
    if (selectedArea) set.add(selectedArea);
    accessibleAreas.forEach((a) => a && set.add(a));
    if (hasAllAreaAccess || accessibleAreas.length === 0) {
      activeAreas.forEach((a) => a && set.add(a));
    }
    set.add('Neo_Town');
    set.add('Haatza_corp');
    return Array.from(set);
  }, [initialArea, selectedArea, accessibleAreas, hasAllAreaAccess, activeAreas]);

  // Fetch Leave Records from Centralized API
  const fetchLeaveRecords = useCallback(
    async (area: string, page: number, limit: number, isSilent = false) => {
      if (!area) return;

      if (isSilent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
        setIsRefreshing(true);
      }
      setApiError(null);

      try {
        const response = await getExpertsLeaveRequest({
          areaName: area,
          page,
          limit,
        });

        if (response.success) {
          setLeaveRecords(response.data || []);
          if (response.pagination) {
            setPagination({
              currentPage: response.pagination.currentPage,
              limit: response.pagination.limit,
              totalRecords: response.pagination.totalRecords,
              totalPages: response.pagination.totalPages,
              hasNextPage: response.pagination.hasNextPage,
              hasPreviousPage: response.pagination.hasPreviousPage,
            });
          } else {
            const count = response.count ?? (response.data ? response.data.length : 0);
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
          setApiError(response.error || 'Failed to fetch leave requests.');
          setLeaveRecords([]);
          setPagination(null);
        }
      } catch (err: any) {
        console.error('Error fetching leave records:', err);
        setApiError('Network error while loading leave requests. Please try again.');
        setLeaveRecords([]);
        setPagination(null);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  // Trigger fetch when selectedArea or currentPage changes
  useEffect(() => {
    fetchLeaveRecords(selectedArea, currentPage, pageSize);
  }, [selectedArea, currentPage, pageSize, fetchLeaveRecords]);

  // Refresh handler: re-fetches current area and page without reloading page
  const handleRefresh = useCallback(() => {
    fetchLeaveRecords(selectedArea, currentPage, pageSize, false);
  }, [selectedArea, currentPage, pageSize, fetchLeaveRecords]);

  // Area change handler: resets page to 1 and fetches fresh data
  const handleAreaSelect = useCallback((newArea: string) => {
    const cleanArea = newArea.trim();
    if (!cleanArea) return;
    setSelectedArea(cleanArea);
    setDraftArea(cleanArea);
    setCurrentPage(1);
    setIsAreaSelectOpen(false);
    setIsFilterOpen(false);
  }, []);

  // Filter Popover Apply
  const handleApplyFilter = useCallback(() => {
    if (draftArea) {
      handleAreaSelect(draftArea);
    }
    setIsFilterOpen(false);
    setIsAreaSelectOpen(false);
  }, [draftArea, handleAreaSelect]);

  // Filter Popover Reset
  const handleResetFilter = useCallback(() => {
    setDraftArea(initialArea);
    setAreaSearchQuery('');
    setIsAreaSelectOpen(false);
    handleAreaSelect(initialArea);
  }, [initialArea, handleAreaSelect]);

  // Filtered area choices based on search query inside dropdown
  const filteredAreas = useMemo(() => {
    const q = areaSearchQuery.trim().toLowerCase();
    if (!q) return areaOptions;
    return areaOptions.filter((a) => a.toLowerCase().includes(q));
  }, [areaOptions, areaSearchQuery]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (filterContainerRef.current && !filterContainerRef.current.contains(target)) {
        setIsFilterOpen(false);
        setIsAreaSelectOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Client search filter on currently loaded page records (does not restrict backend data)
  const displayRecords: TableLeaveRecord[] = useMemo(() => {
    const query = search.trim().toLowerCase();
    const records = leaveRecords.map((r, index) => ({
      ...r,
      _tableKey: `${r.workerId || 'W'}_${r.leaveDate || 'D'}_${r.requestedAt || ''}_${index}`,
    }));

    if (!query) return records;

    return records.filter((r) => {
      const name = (r.workerName || '').toLowerCase();
      const id = (r.workerId || '').toLowerCase();
      const type = (r.leaveType || '').toLowerCase();
      const st = (r.status || '').toLowerCase();
      return name.includes(query) || id.includes(query) || type.includes(query) || st.includes(query);
    });
  }, [leaveRecords, search]);

  // Server-side pagination bounds
  const totalRecords = pagination?.totalRecords ?? leaveRecords.length;
  const totalPages = pagination?.totalPages ?? Math.max(1, Math.ceil(totalRecords / pageSize));
  const hasNextPage = pagination?.hasNextPage ?? (currentPage < totalPages);
  const hasPreviousPage = pagination?.hasPreviousPage ?? (currentPage > 1);
  const startRecord = totalRecords > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  // Windowed pagination calculation:
  // When totalPages <= 5: display all pages [1, ..., totalPages]
  // When totalPages > 5: display window of 3 pages [windowStart, windowStart+1, windowStart+2]
  //   Initial state: Previous 1 2 3 ... Next
  //   Next window:   Previous 4 5 6 ... Next
  //   Next window:   Previous 7 8 9 ... Next
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
  const handleViewRecord = (record: RawLeaveRecord) => {
    setSelectedRecord(record);
    setIsDrawerOpen(true);
  };

  // Table Columns in Exact Required Order:
  // 1. Employee (workerName)
  // 2. Employee ID (workerId)
  // 3. Area (areaName)
  // 4. Leave Date (leaveDate)
  // 5. Leave Type (leaveType)
  // 6. Status (status)
  // 7. Requested At (requestedAt)
  // 8. Actions (Eye / View button)
  const columns: Column<TableLeaveRecord>[] = [
    {
      header: (
        <div className="leading-tight">
          <span className="block font-semibold">EMPLOYEE</span>
          <span className="block text-[10px] font-semibold text-[#8C8C8C]">NAME</span>
        </div>
      ),
      accessor: 'workerName',
      className: 'w-[18%] min-w-[150px]',
      render: (r) => {
        const name = safeVal(r.workerName);
        return (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-xl bg-[#EDE9FE] border border-[#DDD6FE] flex items-center justify-center shrink-0 overflow-hidden">
              <span className="font-bold text-xs text-[#5B21B6] select-none">
                {name !== '—' ? name.charAt(0).toUpperCase() : <User className="h-4 w-4 text-[#5B21B6]" />}
              </span>
            </div>
            <div className="min-w-0">
              <span className="font-bold text-xs text-[#1F1F1F] block truncate" title={name}>
                {name}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      header: (
        <div className="leading-tight text-center">
          <span className="block font-semibold">EMPLOYEE</span>
          <span className="block text-[10px] font-semibold text-[#8C8C8C]">ID</span>
        </div>
      ),
      accessor: 'workerId',
      align: 'center',
      className: 'w-[10%] min-w-[90px]',
      render: (r) => (
        <span className="font-mono text-[#5B21B6] text-xs font-semibold">
          {safeVal(r.workerId)}
        </span>
      ),
    },
    {
      header: (
        <div className="leading-tight text-center">
          <span className="block font-semibold">AREA</span>
          <span className="block text-[10px] font-semibold text-[#8C8C8C]">LOCATION</span>
        </div>
      ),
      accessor: 'areaName',
      align: 'center',
      className: 'w-[13%] min-w-[110px]',
      render: (r) => (
        <div className="flex justify-center">
          <span
            className="inline-flex items-center gap-1 rounded-full bg-[#FAF9FC] border border-[#EEEEF2] px-2.5 py-0.5 text-[11px] font-medium text-[#1F1F1F] max-w-[130px] truncate"
            title={safeVal(r.areaName)}
          >
            <MapPin className="h-3 w-3 text-[#5B21B6] shrink-0" />
            <span className="truncate">{safeVal(r.areaName)}</span>
          </span>
        </div>
      ),
    },
    {
      header: (
        <div className="leading-tight text-center">
          <span className="block font-semibold">LEAVE</span>
          <span className="block text-[10px] font-semibold text-[#8C8C8C]">DATE</span>
        </div>
      ),
      accessor: 'leaveDate',
      align: 'center',
      className: 'w-[12%] min-w-[105px]',
      render: (r) => (
        <span className="font-mono text-xs text-[#1F1F1F] font-medium whitespace-nowrap">
          {formatDisplayDate(r.leaveDate)}
        </span>
      ),
    },
    {
      header: (
        <div className="leading-tight text-center">
          <span className="block font-semibold">LEAVE</span>
          <span className="block text-[10px] font-semibold text-[#8C8C8C]">TYPE</span>
        </div>
      ),
      accessor: 'leaveType',
      align: 'center',
      className: 'w-[12%] min-w-[100px]',
      render: (r) => {
        const type = safeVal(r.leaveType);
        return (
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#EDE9FE] border border-[#DDD6FE] px-2.5 py-0.5 text-[11px] font-semibold text-[#5B21B6] whitespace-nowrap">
              <CalendarDays className="h-3 w-3 text-[#5B21B6] shrink-0" />
              <span>{type}</span>
            </span>
          </div>
        );
      },
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
      className: 'w-[11%] min-w-[95px]',
      render: (r) => {
        const st = safeVal(r.status);
        const statusClean = st !== '—' ? r.status! : 'Pending';
        return (
          <div className="flex justify-center">
            <StatusBadge status={statusClean} size="sm" pulse={statusClean === 'Pending'} />
          </div>
        );
      },
    },
    {
      header: (
        <div className="leading-tight text-center">
          <span className="block font-semibold">REQUESTED</span>
          <span className="block text-[10px] font-semibold text-[#8C8C8C]">AT</span>
        </div>
      ),
      accessor: 'requestedAt',
      align: 'center',
      className: 'w-[16%] min-w-[130px]',
      render: (r) => (
        <span className="font-mono text-xs text-[#6B6B6B] font-medium whitespace-nowrap">
          {formatDisplayDateTime(r.requestedAt)}
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
      className: 'w-[8%] min-w-[65px]',
      render: (r) => (
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleViewRecord(r);
            }}
            className="p-1.5 rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] text-[#5B21B6] hover:bg-[#EDE9FE] transition-colors cursor-pointer"
            title="View Leave Details"
            aria-label="View Leave Details"
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
            Leave Management
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6B6B] mt-0.5 truncate">
            Worker leave requests, approvals, time-off records, and shift coverages.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="relative z-30 rounded-2xl border border-[#EEEEF2] bg-white p-3 sm:p-4 shadow-soft-sm space-y-3 w-full max-w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Quick Search Bar */}
          <div className="w-full sm:max-w-md min-w-0">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by Employee Name or ID"
              className="w-full"
            />
          </div>

          {/* Right: Refresh & Filter Controls (Single Clean Row) */}
          <div ref={filterContainerRef} className="flex items-center gap-2 sm:gap-2.5 self-start sm:self-auto shrink-0 flex-wrap relative">
            {/* Refresh Button */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing}
              className="flex items-center gap-1.5 rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] px-3.5 py-2 text-xs font-semibold text-[#6B6B6B] hover:text-[#5B21B6] hover:bg-[#EDE9FE] transition-all shadow-soft-sm active:scale-95 cursor-pointer disabled:opacity-50 shrink-0"
              title="Refresh leave records"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading || isRefreshing ? 'animate-spin text-[#5B21B6]' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Filter Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  if (isFilterOpen) {
                    setIsFilterOpen(false);
                    setIsAreaSelectOpen(false);
                  } else {
                    setDraftArea(selectedArea);
                    setAreaSearchQuery('');
                    setIsAreaSelectOpen(false);
                    setIsFilterOpen(true);
                  }
                }}
                className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all shadow-soft-sm active:scale-95 cursor-pointer ${
                  isFilterOpen || selectedArea !== initialArea
                    ? 'border-[#5B21B6] bg-[#EDE9FE] text-[#5B21B6]'
                    : 'border-[#EEEEF2] bg-[#FAF9FC] text-[#1F1F1F] hover:bg-[#EDE9FE] hover:text-[#5B21B6]'
                }`}
                aria-expanded={isFilterOpen}
                aria-label="Toggle Leave Filters"
              >
                <Filter className="h-4 w-4 text-[#5B21B6]" />
                <span>Filter</span>
                {selectedArea !== initialArea && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#5B21B6] text-[10px] font-bold text-white shadow-xs">
                    1
                  </span>
                )}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Floating Filter Popover */}
              {isFilterOpen && (
                <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto right-3 sm:right-0 top-20 sm:top-full mt-2 z-50 w-auto sm:w-[380px] flex flex-col rounded-2xl border border-[#EEEEF2] bg-white shadow-2xl shadow-purple-950/15 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  {/* Popover Header */}
                  <div className="flex items-center justify-between border-b border-[#EEEEF2] px-4 py-3 bg-white">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-[#EDE9FE] border border-[#DDD6FE] flex items-center justify-center text-[#5B21B6]">
                        <Filter className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-[#1F1F1F] uppercase tracking-wider">Leave Filters</h3>
                        <p className="text-[10px] text-[#6B6B6B]">Filter records by operating area</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsFilterOpen(false);
                        setIsAreaSelectOpen(false);
                      }}
                      className="rounded-lg p-1 text-[#6B6B6B] hover:bg-[#FAF9FC] hover:text-[#1F1F1F] transition-colors cursor-pointer"
                      title="Close"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Popover Body */}
                  <div className="p-4 space-y-3 bg-[#FAF9FC]/60">
                    {/* Attractive Custom Area Selector Card */}
                    <div className="rounded-2xl border border-[#EEEEF2] bg-white p-3.5 sm:p-4 shadow-soft-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[#1F1F1F] flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-[#5B21B6]" />
                          Area / Zone
                        </label>
                        <span className="text-[10px] font-mono font-semibold text-[#5B21B6] bg-[#EDE9FE] border border-[#DDD6FE] px-2.5 py-0.5 rounded-full truncate max-w-[140px]">
                          {draftArea}
                        </span>
                      </div>

                      {/* Custom Styled Trigger Button */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsAreaSelectOpen((prev) => !prev)}
                          className={`w-full flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-all shadow-soft-xs cursor-pointer ${
                            isAreaSelectOpen
                              ? 'border-[#5B21B6] bg-white ring-2 ring-[#5B21B6]/15 text-[#1F1F1F]'
                              : 'border-[#EEEEF2] bg-[#FAF9FC] text-[#1F1F1F] hover:bg-white hover:border-[#DDD6FE]'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <div className="h-6 w-6 rounded-lg bg-[#EDE9FE] border border-[#DDD6FE] flex items-center justify-center shrink-0">
                              <MapPin className="h-3 w-3 text-[#5B21B6]" />
                            </div>
                            <span className="truncate font-semibold text-[#1F1F1F]">{draftArea || 'Select Area'}</span>
                          </div>
                          <ChevronDown
                            className={`h-4 w-4 text-[#6B6B6B] shrink-0 transition-transform duration-200 ${
                              isAreaSelectOpen ? 'rotate-180 text-[#5B21B6]' : ''
                            }`}
                          />
                        </button>

                        {/* Custom Dropdown Options Menu */}
                        {isAreaSelectOpen && (
                          <div className="mt-2 rounded-xl border border-[#EEEEF2] bg-white shadow-soft-lg overflow-hidden max-h-56 overflow-y-auto p-1.5 space-y-1 animate-in fade-in duration-150 z-20">
                            {/* Search input if multiple areas */}
                            {areaOptions.length > 4 && (
                              <div className="p-1 border-b border-[#F3F2F7] mb-1">
                                <input
                                  type="text"
                                  value={areaSearchQuery}
                                  onChange={(e) => setAreaSearchQuery(e.target.value)}
                                  placeholder="Search area..."
                                  className="w-full rounded-lg border border-[#EEEEF2] bg-[#FAF9FC] px-2.5 py-1.5 text-xs text-[#1F1F1F] placeholder-[#8C8C8C] focus:border-[#5B21B6] focus:bg-white focus:outline-none"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            )}

                            {filteredAreas.length === 0 ? (
                              <div className="py-3 text-center text-xs text-[#8C8C8C]">No areas found</div>
                            ) : (
                              filteredAreas.map((area) => {
                                const isSelected = draftArea === area;
                                return (
                                  <button
                                    key={area}
                                    type="button"
                                    onClick={() => {
                                      setDraftArea(area);
                                      setIsAreaSelectOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                                      isSelected
                                        ? 'bg-[#EDE9FE] text-[#5B21B6] font-bold border border-[#DDD6FE]/80'
                                        : 'text-[#1F1F1F] hover:bg-[#FAF9FC]'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 truncate">
                                      <div className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 ${isSelected ? 'bg-white text-[#5B21B6]' : 'bg-[#FAF9FC] text-[#8C8C8C]'}`}>
                                        <MapPin className="h-3 w-3" />
                                      </div>
                                      <span className="truncate">{area}</span>
                                    </div>
                                    {isSelected && <Check className="h-3.5 w-3.5 text-[#5B21B6] shrink-0" />}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Popover Footer */}
                  <div className="flex items-center justify-between border-t border-[#EEEEF2] bg-white px-4 py-3">
                    <button
                      type="button"
                      onClick={handleResetFilter}
                      className="text-xs font-semibold text-[#6B6B6B] hover:text-[#B42318] transition-colors cursor-pointer"
                    >
                      Reset Default
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyFilter}
                      className="rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white px-5 py-2 text-xs font-semibold shadow-soft-sm transition-all active:scale-95 cursor-pointer"
                    >
                      Apply Filter
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Selected Area Pill Bar */}
        <div className="flex items-center gap-2 pt-1 border-t border-[#F3F2F7] flex-wrap text-xs">
          <span className="text-[#6B6B6B] font-medium">Selected Area:</span>
          <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-[#5B21B6] bg-[#EDE9FE] px-2.5 py-0.5 rounded-full border border-[#DDD6FE]">
            <MapPin className="h-3 w-3" />
            {selectedArea}
          </span>
          {totalRecords > 0 && (
            <span className="text-[11px] text-[#6B6B6B]">
              • {totalRecords} {totalRecords === 1 ? 'leave record' : 'leave records'} total
            </span>
          )}
          {search && (
            <span className="inline-flex items-center gap-1 text-[11px] text-[#C2410C] bg-[#FFF7ED] border border-[#FED7AA] px-2 py-0.5 rounded-full">
              Filtered by: &quot;{search}&quot;
              <button
                type="button"
                onClick={() => setSearch('')}
                className="ml-0.5 hover:text-[#B42318] cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="w-full rounded-2xl border border-[#EEEEF2] bg-white p-6 shadow-soft-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-5 w-40 bg-[#EDE9FE] animate-pulse rounded-lg" />
            <div className="h-4 w-24 bg-[#FAF9FC] animate-pulse rounded-lg" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
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
            Unable to fetch worker leave requests. Please check your network connection and retry.
          </p>
          <button
            type="button"
            onClick={handleRefresh}
            className="rounded-xl bg-[#B42318] hover:bg-rose-800 text-white px-5 py-2 text-xs font-semibold shadow-soft-sm transition-all active:scale-95 cursor-pointer"
          >
            Retry Loading Leave Records
          </button>
        </div>
      )}

      {/* Desktop & Tablet Table */}
      {!isLoading && !apiError && (
        <div className="hidden lg:block">
          <DataTable
            columns={columns}
            data={displayRecords}
            keyExtractor={(r: TableLeaveRecord) => r._tableKey}
            compact={true}
            emptyTitle="No leave records found"
            emptyDescription={
              search
                ? `No leave records matching "${search}". Try clearing your search.`
                : `No leave records requested for ${selectedArea}.`
            }
          />
        </div>
      )}

      {/* Mobile & Tablet Card View */}
      {!isLoading && !apiError && (
        <div className="block lg:hidden space-y-3">
          {displayRecords.length === 0 ? (
            <div className="rounded-2xl border border-[#EEEEF2] bg-white p-8 text-center shadow-soft-sm">
              <h3 className="text-sm font-bold text-[#1F1F1F]">No leave records found</h3>
              <p className="text-xs text-[#6B6B6B] mt-1">
                {search
                  ? `No leave records matching "${search}".`
                  : `No leave records requested for ${selectedArea}.`}
              </p>
            </div>
          ) : (
            displayRecords.map((r) => {
              const name = safeVal(r.workerName);
              const statusClean = safeVal(r.status) !== '—' ? r.status! : 'Pending';

              return (
                <div
                  key={r._tableKey}
                  className="rounded-2xl border border-[#EEEEF2] bg-white p-4 shadow-soft-sm space-y-3"
                >
                  {/* Card Header: Worker & Status */}
                  <div className="flex items-center justify-between gap-2 border-b border-[#EEEEF2] pb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-9 w-9 rounded-xl bg-[#EDE9FE] border border-[#DDD6FE] flex items-center justify-center shrink-0 overflow-hidden">
                        <span className="font-bold text-xs text-[#5B21B6]">
                          {name !== '—' ? name.charAt(0).toUpperCase() : <User className="h-4 w-4 text-[#5B21B6]" />}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-[#1F1F1F] truncate" title={name}>
                          {name}
                        </h4>
                        <span className="font-mono text-[11px] text-[#5B21B6] font-semibold">
                          {safeVal(r.workerId)}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={statusClean} size="sm" pulse={statusClean === 'Pending'} />
                  </div>

                  {/* Card Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl bg-[#FAF9FC] p-2.5 border border-[#EEEEF2]">
                      <span className="text-[10px] text-[#6B6B6B] font-mono block">LEAVE DATE</span>
                      <span className="font-mono text-[11px] font-semibold text-[#1F1F1F]">
                        {formatDisplayDate(r.leaveDate)}
                      </span>
                    </div>

                    <div className="rounded-xl bg-[#FAF9FC] p-2.5 border border-[#EEEEF2]">
                      <span className="text-[10px] text-[#6B6B6B] font-mono block">LEAVE TYPE</span>
                      <span className="font-mono text-[11px] font-semibold text-[#5B21B6] truncate block">
                        {safeVal(r.leaveType)}
                      </span>
                    </div>

                    <div className="rounded-xl bg-[#FAF9FC] p-2.5 border border-[#EEEEF2]">
                      <span className="text-[10px] text-[#6B6B6B] font-mono block">AREA</span>
                      <span className="font-mono text-[11px] font-semibold text-[#1F1F1F] truncate block">
                        {safeVal(r.areaName)}
                      </span>
                    </div>

                    <div className="rounded-xl bg-[#FAF9FC] p-2.5 border border-[#EEEEF2]">
                      <span className="text-[10px] text-[#6B6B6B] font-mono block">REQUESTED AT</span>
                      <span className="font-mono text-[11px] font-medium text-[#6B6B6B] truncate block">
                        {formatDisplayDateTime(r.requestedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Card Footer: Eye / View Details Button */}
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

            {/* Trailing Ellipsis if more pages exist beyond current window */}
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

      {/* Leave Detail Drawer */}
      <LeaveDetailDrawer
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

export default LeavePage;
