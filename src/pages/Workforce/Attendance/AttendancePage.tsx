import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { getWorkerAttendance, getActiveAreas, ActiveAreaItem } from '../../../services/api';
import { RawWorkerAttendanceRecord } from '../../../types';
import { DataTable, Column } from '../../../components/common/DataTable';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { SearchInput } from '../../../components/common/SearchInput';
import { AttendanceDetailDrawer } from '../../../components/workforce/AttendanceDetailDrawer';
import { 
  MapPin, 
  Eye, 
  Filter, 
  X, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck, 
  RefreshCw, 
  AlertCircle, 
  User, 
  Calendar,
  Check,
  Activity
} from 'lucide-react';

const PAGE_SIZE = 20;

export interface AttendancePagination {
  currentPage: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const safeVal = (v: any): string => {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'string') {
    const trimmed = v.trim();
    return trimmed && trimmed !== 'null' && trimmed !== 'undefined' ? trimmed : '—';
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
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return '—';
  try {
    const parts = trimmed.split('-');
    if (parts.length === 3) {
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

const getIsoDateString = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseIsoDate = (str: string): Date => {
  const parts = (str || '').split('-');
  if (parts.length === 3) {
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }
  return new Date(str || Date.now());
};

const getRangeDaysCount = (fromStr: string, toStr: string): number => {
  if (!fromStr || !toStr) return 0;
  try {
    const f = parseIsoDate(fromStr);
    const t = parseIsoDate(toStr);
    const diff = Math.round((t.getTime() - f.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff + 1);
  } catch {
    return 0;
  }
};

type PresetKey = 'today' | 'yesterday' | '7days' | '14days' | 'thisMonth' | '30days' | 'custom';

const PRESET_OPTIONS: { id: PresetKey; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: '7days', label: 'Last 7 Days' },
  { id: '14days', label: 'Last 14 Days' },
  { id: 'thisMonth', label: 'This Month' },
  { id: '30days', label: 'Last 30 Days' },
];

const detectPreset = (from: string, to: string): PresetKey | null => {
  if (!from || !to) return null;
  const now = new Date();
  const today = getIsoDateString(now);
  if (from === today && to === today) return 'today';

  const y = new Date();
  y.setDate(y.getDate() - 1);
  const yesterday = getIsoDateString(y);
  if (from === yesterday && to === yesterday) return 'yesterday';

  const d7 = new Date();
  d7.setDate(d7.getDate() - 6);
  if (from === getIsoDateString(d7) && to === today) return '7days';

  const d14 = new Date();
  d14.setDate(d14.getDate() - 13);
  if (from === getIsoDateString(d14) && to === today) return '14days';

  const d30 = new Date();
  d30.setDate(d30.getDate() - 29);
  if (from === getIsoDateString(d30) && to === today) return '30days';

  const monthStart = getIsoDateString(new Date(now.getFullYear(), now.getMonth(), 1));
  if (from === monthStart && to === today) return 'thisMonth';

  return 'custom';
};

export const AttendancePage: React.FC = () => {
  const { session, accessibleAreas, hasAllAreaAccess } = useAuth();

  // Dynamic Available Areas from Active Areas API
  const [activeAreas, setActiveAreas] = useState<string[]>([]);

  // Calculate default initial area: logged-in user's area, fallback to first accessible area, or 'Neo_Town'
  const initialArea = useMemo(() => {
    if (session?.areaName && session.areaName.trim()) {
      return session.areaName.trim();
    }
    if (accessibleAreas && accessibleAreas.length > 0) {
      return accessibleAreas[0].trim();
    }
    return 'Neo_Town';
  }, [session?.areaName, accessibleAreas]);

  // Active Filter States
  const [selectedArea, setSelectedArea] = useState<string>(initialArea);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [attendanceStatus, setAttendanceStatus] = useState<string>('');
  const [workerId, setWorkerId] = useState<string>('');
  const [workerName, setWorkerName] = useState<string>('');

  // Sync initial area if session updates later
  useEffect(() => {
    if (initialArea && !selectedArea) {
      setSelectedArea(initialArea);
    }
  }, [initialArea, selectedArea]);

  // Draft Filter States inside Filter Popover (none prefilled by default)
  const [draftArea, setDraftArea] = useState<string>(initialArea);
  const [draftFromDate, setDraftFromDate] = useState<string>('');
  const [draftToDate, setDraftToDate] = useState<string>('');
  const [draftStatus, setDraftStatus] = useState<string>('');
  const [draftWorkerId, setDraftWorkerId] = useState<string>('');
  const [draftWorkerName, setDraftWorkerName] = useState<string>('');

  // Custom UI dropdown / calendar states inside Filter Popover
  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date());
  const [calendarStep, setCalendarStep] = useState<'start' | 'end'>('start');
  const [activePreset, setActivePreset] = useState<PresetKey | null>(null);

  // Filter Popover state (Closed by default)
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterContainerRef = useRef<HTMLDivElement>(null);

  // API Data State
  const [attendanceRecords, setAttendanceRecords] = useState<RawWorkerAttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Detail Drawer State
  const [selectedRecord, setSelectedRecord] = useState<RawWorkerAttendanceRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Search State (Unified Name or ID search)
  const [search, setSearch] = useState('');

  // Server-side Pagination State (default limit=20)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const [pagination, setPagination] = useState<AttendancePagination | null>(null);

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

  // Combined area choices for dropdown: accessibleAreas + activeAreas
  const areaOptions = useMemo(() => {
    const set = new Set<string>();
    if (initialArea) set.add(initialArea);
    if (selectedArea) set.add(selectedArea);
    accessibleAreas.forEach((a) => a && set.add(a));
    if (hasAllAreaAccess || accessibleAreas.length === 0) {
      activeAreas.forEach((a) => a && set.add(a));
    }
    set.add('Neo_Town'); // Ensure Neo_Town is present as referenced in contract
    return Array.from(set);
  }, [initialArea, selectedArea, accessibleAreas, hasAllAreaAccess, activeAreas]);

  // Fetch Attendance Records from Centralized API
  const fetchAttendance = useCallback(
    async (
      area: string,
      from: string,
      to: string,
      status: string,
      wId: string,
      wName: string,
      page: number,
      limit: number,
      isSilent = false
    ) => {
      if (!area) return;
      if (isSilent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
        setIsRefreshing(true);
      }
      setApiError(null);

      try {
        const res = await getWorkerAttendance({
          areaName: area,
          fromdate: from || undefined,
          todate: to || undefined,
          attendanceStatus: status || undefined,
          workerId: wId || undefined,
          workerName: wName || undefined,
          page,
          limit,
        });

        if (res.success && Array.isArray(res.data)) {
          setAttendanceRecords(res.data);
          if (res.pagination) {
            setPagination({
              currentPage: res.pagination.currentPage || res.pagination.page || page,
              limit: res.pagination.limit || limit,
              totalRecords: typeof res.pagination.totalRecords === 'number'
                ? res.pagination.totalRecords
                : (typeof res.pagination.totalCount === 'number'
                    ? res.pagination.totalCount
                    : (typeof res.count === 'number' ? res.count : res.data.length)),
              totalPages: res.pagination.totalPages || Math.max(1, Math.ceil((res.pagination.totalRecords || res.count || res.data.length) / limit)),
              hasNextPage: typeof res.pagination.hasNextPage === 'boolean'
                ? res.pagination.hasNextPage
                : ((res.pagination.currentPage || page) < (res.pagination.totalPages || Math.ceil((res.pagination.totalRecords || res.count || res.data.length) / limit))),
              hasPreviousPage: typeof res.pagination.hasPreviousPage === 'boolean'
                ? res.pagination.hasPreviousPage
                : ((res.pagination.currentPage || page) > 1),
            });
          } else {
            const total = typeof res.count === 'number' ? res.count : res.data.length;
            setPagination({
              currentPage: page,
              limit,
              totalRecords: total,
              totalPages: Math.max(1, Math.ceil(total / limit)),
              hasNextPage: page * limit < total,
              hasPreviousPage: page > 1,
            });
          }
        } else {
          setApiError(res.error || 'Failed to fetch attendance records.');
          setAttendanceRecords([]);
          setPagination(null);
        }
      } catch (err: any) {
        setApiError(err?.message || 'Network error while fetching attendance records.');
        setAttendanceRecords([]);
        setPagination(null);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  // Trigger fetch when any filter or pagination parameter changes
  useEffect(() => {
    if (selectedArea) {
      fetchAttendance(
        selectedArea,
        fromDate,
        toDate,
        attendanceStatus,
        workerId,
        workerName,
        currentPage,
        pageSize
      );
    }
  }, [
    selectedArea,
    fromDate,
    toDate,
    attendanceStatus,
    workerId,
    workerName,
    currentPage,
    pageSize,
    fetchAttendance,
  ]);

  // Refresh attendance records: forces fresh backend fetch, keeps selected filters and pagination state, shows existing loading state
  const handleRefresh = useCallback(() => {
    fetchAttendance(
      selectedArea,
      fromDate,
      toDate,
      attendanceStatus,
      workerId,
      workerName,
      currentPage,
      pageSize,
      false
    );
  }, [
    fetchAttendance,
    selectedArea,
    fromDate,
    toDate,
    attendanceStatus,
    workerId,
    workerName,
    currentPage,
    pageSize,
  ]);

  // Sync unified search input (debounced): detects Worker ID (e.g. HN-1009 or numeric ID) vs Worker Name (e.g. Raj)
  useEffect(() => {
    const handler = setTimeout(() => {
      const clean = search.trim();
      if (!clean) {
        if (workerId || workerName) {
          setWorkerId('');
          setWorkerName('');
          setCurrentPage(1);
        }
        return;
      }

      // Detect if user entered a Worker ID (e.g. HN-1009, HN1009, or numeric 1009)
      const isId = /^HN-?\d+$/i.test(clean) || /^HN/i.test(clean) || /^\d{3,6}$/.test(clean);

      if (isId) {
        const formattedId = /^\d{3,6}$/.test(clean)
          ? `HN-${clean}`
          : clean.toUpperCase().replace(/^HN(?!\-)/, 'HN-');

        if (workerId !== formattedId || workerName !== '') {
          setWorkerId(formattedId);
          setWorkerName('');
          setCurrentPage(1);
        }
      } else {
        // Otherwise treat as Worker Name (e.g. Raj, Karmi)
        if (workerName !== clean || workerId !== '') {
          setWorkerName(clean);
          setWorkerId('');
          setCurrentPage(1);
        }
      }
    }, 450);
    return () => clearTimeout(handler);
  }, [search, workerId, workerName]);

  // Sync search input if workerId or workerName is changed externally (e.g. Filter modal or clear pills)
  useEffect(() => {
    if (workerId && search !== workerId) {
      setSearch(workerId);
    } else if (workerName && search !== workerName) {
      setSearch(workerName);
    } else if (!workerId && !workerName && search !== '') {
      setSearch('');
    }
  }, [workerId, workerName]);

  // Close filter popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterContainerRef.current && !filterContainerRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
        setIsAreaDropdownOpen(false);
      }
    };
    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterOpen]);

  // Filter Popover handlers
  const handleOpenFilter = () => {
    setDraftArea(selectedArea);
    setDraftFromDate(fromDate);
    setDraftToDate(toDate);
    setDraftStatus(attendanceStatus);
    setDraftWorkerId(workerId);
    setDraftWorkerName(workerName);
    setCalendarMonth(fromDate || toDate ? parseIsoDate(toDate || fromDate) : new Date());
    setIsAreaDropdownOpen(false);
    setCalendarStep('start');
    setActivePreset(fromDate && toDate ? detectPreset(fromDate, toDate) : null);
    setIsFilterOpen(true);
  };

  const handleApplyFilter = () => {
    setSelectedArea(draftArea);
    setFromDate(draftFromDate);
    setToDate(draftToDate);
    setAttendanceStatus(draftStatus);
    setWorkerId(draftWorkerId);
    setWorkerName(draftWorkerName);
    setSearch(draftWorkerId || draftWorkerName || '');
    setIsFilterOpen(false);
    setIsAreaDropdownOpen(false);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    // 1. Reset draft states to empty
    setDraftArea(initialArea);
    setDraftFromDate('');
    setDraftToDate('');
    setDraftStatus('');
    setDraftWorkerId('');
    setDraftWorkerName('');
    setCalendarMonth(new Date());
    setIsAreaDropdownOpen(false);
    setCalendarStep('start');
    setActivePreset(null);

    // 2. Immediately apply and remove active filters
    setSelectedArea(initialArea);
    setFromDate('');
    setToDate('');
    setAttendanceStatus('');
    setWorkerId('');
    setWorkerName('');
    setSearch('');
    setCurrentPage(1);
    setIsFilterOpen(false);
  };

  // Calendar Date Click Handler
  const handleCalendarDayClick = (isoStr: string) => {
    setActivePreset('custom');
    if (calendarStep === 'start') {
      setDraftFromDate(isoStr);
      if (draftToDate && isoStr > draftToDate) {
        setDraftToDate(isoStr);
      }
      setCalendarStep('end');
    } else {
      if (isoStr >= draftFromDate) {
        setDraftToDate(isoStr);
        setCalendarStep('start');
      } else {
        setDraftFromDate(isoStr);
        setCalendarStep('end');
      }
    }
  };

  // Quick Preset Click Handler
  const applyPreset = (presetKey: PresetKey) => {
    if (presetKey === 'custom') return;

    // Toggle off if already active
    if (activePreset === presetKey) {
      setActivePreset(null);
      setDraftFromDate('');
      setDraftToDate('');
      setCalendarStep('start');
      return;
    }

    setActivePreset(presetKey);
    const now = new Date();
    let from = '';
    let to = getIsoDateString(now);

    if (presetKey === 'today') {
      from = to;
    } else if (presetKey === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      from = getIsoDateString(y);
      to = from;
    } else if (presetKey === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      from = getIsoDateString(d);
    } else if (presetKey === '14days') {
      const d = new Date();
      d.setDate(d.getDate() - 13);
      from = getIsoDateString(d);
    } else if (presetKey === '30days') {
      const d = new Date();
      d.setDate(d.getDate() - 29);
      from = getIsoDateString(d);
    } else if (presetKey === 'thisMonth') {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      from = getIsoDateString(d);
    }

    setDraftFromDate(from);
    setDraftToDate(to);
    setCalendarMonth(parseIsoDate(to));
    setCalendarStep('start');
  };

  // Check if filters deviate from defaults (no date range is default)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedArea && selectedArea !== initialArea) count += 1;
    if (fromDate && toDate) count += 1;
    if (attendanceStatus) count += 1;
    if (workerId) count += 1;
    if (workerName) count += 1;
    return count;
  }, [selectedArea, initialArea, fromDate, toDate, attendanceStatus, workerId, workerName]);

  // Sort current page records: Today / latest dates first, then by check-in time
  const displayRecords = useMemo(() => {
    return [...attendanceRecords].sort((a, b) => {
      // 1. Date comparison (descending: newest date first)
      const dateA = a.date || '';
      const dateB = b.date || '';
      if (dateA !== dateB) {
        return dateB.localeCompare(dateA);
      }
      // 2. Check-in time comparison (descending)
      const timeA = a.checkInTime || '';
      const timeB = b.checkInTime || '';
      if (timeA && timeB) {
        return timeB.localeCompare(timeA);
      }
      return (a.workerName || '').localeCompare(b.workerName || '');
    });
  }, [attendanceRecords]);

  // Server-side pagination bounds
  const totalRecords = pagination?.totalRecords ?? attendanceRecords.length;
  const totalPages = pagination?.totalPages ?? Math.max(1, Math.ceil(totalRecords / pageSize));
  const startRecord = totalRecords > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  // Windowed pagination calculation:
  // When totalPages <= 5: display all pages [1, ..., totalPages]
  // When totalPages > 5: display a small window of 3 pages [windowStart, windowStart+1, windowStart+2]
  //   Initial state: 1 2 3 ...
  //   Click Next: 4 5 6 ...
  //   Click Next again: 7 8 9 ...
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
    if (isLoading) return;
    if (isWindowed) {
      const nextWindowStart = windowStart + WINDOW_SIZE;
      if (nextWindowStart <= totalPages) {
        setCurrentPage(nextWindowStart);
      } else {
        setCurrentPage((p) => Math.min(totalPages, p + 1));
      }
    } else {
      setCurrentPage((p) => Math.min(totalPages, p + 1));
    }
  };

  const handlePrevious = () => {
    if (isLoading) return;
    if (isWindowed) {
      if (windowStart > 1) {
        const prevWindowStart = Math.max(1, windowStart - WINDOW_SIZE);
        setCurrentPage(prevWindowStart);
      } else {
        setCurrentPage((p) => Math.max(1, p - 1));
      }
    } else {
      setCurrentPage((p) => Math.max(1, p - 1));
    }
  };

  // Handle open drawer
  const handleViewRecord = (record: RawWorkerAttendanceRecord) => {
    setSelectedRecord(record);
    setIsDrawerOpen(true);
  };

  // Render Calendar Month Days
  const renderCalendarDays = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];

    // Blank cells before first day of month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(<div key={`blank-${i}`} className="h-8 w-8" />);
    }

    // Days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, month, day);
      const isoStr = getIsoDateString(dayDate);
      const isStart = isoStr === draftFromDate;
      const isEnd = isoStr === draftToDate;
      const isInRange = draftFromDate && draftToDate && isoStr > draftFromDate && isoStr < draftToDate;
      const isSingleDay = isStart && isEnd;

      let btnClass = 'h-8 w-8 text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ';

      if (isSingleDay) {
        btnClass += 'rounded-xl bg-[#5B21B6] text-white font-bold shadow-soft-sm ring-2 ring-[#5B21B6]/30';
      } else if (isStart) {
        btnClass += 'rounded-l-xl bg-[#5B21B6] text-white font-bold shadow-soft-sm';
      } else if (isEnd) {
        btnClass += 'rounded-r-xl bg-[#5B21B6] text-white font-bold shadow-soft-sm';
      } else if (isInRange) {
        btnClass += 'bg-[#EDE9FE] text-[#5B21B6] font-semibold rounded-none';
      } else {
        btnClass += 'rounded-xl text-[#1F1F1F] hover:bg-[#FAF9FC] hover:text-[#5B21B6]';
      }

      days.push(
        <button
          key={isoStr}
          type="button"
          onClick={() => handleCalendarDayClick(isoStr)}
          className={btnClass}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  // Table Columns in Exact Required Order:
  // 1. Employee
  // 2. Employee ID
  // 3. Date
  // 4. Area
  // 5. Status
  // 6. Check-In
  // 7. Check-Out
  // 8. Worked Hours
  // 9. Break (Stacked "one below one" so table fits without horizontal scroll!)
  // 10. Verification
  // 11. Actions (Eye / View button immediately visible without horizontal scrolling!)
  const columns: Column<RawWorkerAttendanceRecord>[] = [
    {
      header: (
        <div className="leading-tight">
          <span className="block font-semibold">EMPLOYEE</span>
          <span className="block text-[10px] font-semibold text-[#8C8C8C]">NAME</span>
        </div>
      ),
      accessor: 'workerName',
      className: 'w-[14%] min-w-[130px]',
      render: (r) => {
        const name = safeVal(r.workerName);
        return (
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-7 w-7 rounded-lg bg-[#EDE9FE] border border-[#DDD6FE] flex items-center justify-center shrink-0 overflow-hidden">
              {r.checkInPhoto ? (
                <img
                  src={r.checkInPhoto}
                  alt={name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <span className="font-bold text-[11px] text-[#5B21B6]">
                  {name !== '—' ? name.charAt(0).toUpperCase() : <User className="h-3.5 w-3.5 text-[#5B21B6]" />}
                </span>
              )}
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
      className: 'w-[8%] min-w-[75px]',
      render: (r) => (
        <span className="font-mono text-[#5B21B6] text-xs font-semibold">
          {safeVal(r.workerId)}
        </span>
      ),
    },
    {
      header: (
        <div className="leading-tight text-center">
          <span className="block font-semibold">DATE</span>
          <span className="block text-[10px] font-semibold text-[#8C8C8C]">LOG</span>
        </div>
      ),
      accessor: 'date',
      align: 'center',
      className: 'w-[8%] min-w-[80px]',
      render: (r) => (
        <span className="font-mono text-xs text-[#1F1F1F] font-medium whitespace-nowrap">
          {formatDisplayDate(r.date)}
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
      className: 'w-[9%] min-w-[85px]',
      render: (r) => (
        <div className="flex justify-center">
          <span
            className="inline-flex items-center gap-1 font-mono text-[#5B21B6] font-semibold text-[11px] bg-[#EDE9FE] px-2 py-0.5 rounded-lg max-w-[110px] truncate"
            title={safeVal(r.areaName)}
          >
            <MapPin className="h-2.5 w-2.5 text-[#5B21B6] shrink-0" />
            <span className="truncate">{safeVal(r.areaName)}</span>
          </span>
        </div>
      ),
    },
    {
      header: (
        <div className="leading-tight text-center">
          <span className="block font-semibold">STATUS</span>
          <span className="block text-[10px] font-semibold text-[#8C8C8C]">ATTENDANCE</span>
        </div>
      ),
      accessor: 'attendanceStatus',
      align: 'center',
      className: 'w-[8%] min-w-[80px]',
      render: (r) => {
        const status = safeVal(r.attendanceStatus);
        const statusClean = status !== '—' ? status : 'Checked-In';
        return (
          <div className="flex justify-center">
            <StatusBadge status={statusClean} size="sm" pulse={statusClean === 'Checked-In'} />
          </div>
        );
      },
    },
    {
      header: (
        <div className="leading-tight text-center">
          <span className="block font-semibold">CHECK-IN</span>
          <span className="block text-[10px] font-semibold text-[#8C8C8C]">TIME</span>
        </div>
      ),
      accessor: 'checkInTime',
      align: 'center',
      className: 'w-[8%] min-w-[70px]',
      render: (r) => (
        <span className="font-mono text-xs text-[#1F1F1F] whitespace-nowrap">
          {safeVal(r.checkInTime)}
        </span>
      ),
    },
    {
      header: (
        <div className="leading-tight text-center">
          <span className="block font-semibold">CHECK-OUT</span>
          <span className="block text-[10px] font-semibold text-[#8C8C8C]">TIME</span>
        </div>
      ),
      accessor: 'checkOutTime',
      align: 'center',
      className: 'w-[8%] min-w-[70px]',
      render: (r) => (
        <span className="font-mono text-xs text-[#6B6B6B] whitespace-nowrap">
          {safeVal(r.checkOutTime)}
        </span>
      ),
    },
    {
      header: (
        <div className="leading-tight text-center">
          <span className="block font-semibold">WORKED</span>
          <span className="block text-[10px] font-semibold text-[#8C8C8C]">HOURS</span>
        </div>
      ),
      accessor: 'totalWorkedHours',
      align: 'center',
      className: 'w-[7%] min-w-[65px]',
      render: (r) => {
        const hours = safeVal(r.totalWorkedHours);
        return (
          <span className={`font-mono text-xs font-semibold whitespace-nowrap ${hours !== '—' ? 'text-[#027A48]' : 'text-[#6B6B6B]'}`}>
            {hours}
          </span>
        );
      },
    },
    {
      // 3rd Image Requirement: Breakdown Window one below one (vertically stacked)
      // so the Eye icon is fully visible on the screen without horizontal scrolling!
      header: (
        <div className="leading-tight text-center">
          <span className="block font-semibold">BREAK</span>
          <span className="block text-[10px] font-semibold text-[#8C8C8C]">WINDOW</span>
        </div>
      ),
      align: 'center',
      className: 'w-[9%] min-w-[75px]',
      render: (r) => {
        const start = r.breakStartTime && String(r.breakStartTime).trim() !== 'null' && String(r.breakStartTime).trim() !== 'undefined' ? String(r.breakStartTime).trim() : null;
        const end = r.breakEndTime && String(r.breakEndTime).trim() !== 'null' && String(r.breakEndTime).trim() !== 'undefined' ? String(r.breakEndTime).trim() : null;

        if (start && end) {
          return (
            <div className="flex flex-col items-center justify-center font-mono leading-tight py-0.5">
              <span className="text-xs text-[#1F1F1F] font-semibold whitespace-nowrap">{start}</span>
              <span className="text-[10px] text-[#8C8C8C] leading-none my-0.5 font-sans">to</span>
              <span className="text-xs text-[#6B6B6B] whitespace-nowrap">{end}</span>
            </div>
          );
        }
        if (start || end) {
          return <span className="font-mono text-xs text-[#1F1F1F] whitespace-nowrap">{start || end}</span>;
        }
        return <span className="font-mono text-xs text-[#8C8C8C]">—</span>;
      },
    },
    {
      header: (
        <div className="leading-tight text-center">
          <span className="block font-semibold">VERIFY</span>
          <span className="block text-[10px] font-semibold text-[#8C8C8C]">STATE</span>
        </div>
      ),
      align: 'center',
      className: 'w-[8%] min-w-[75px]',
      render: (r) => {
        const isVerified = r.CheckinVerified === true;
        return (
          <div className="flex justify-center">
            {isVerified ? (
              <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[#027A48] bg-[#ECFDF3] px-2 py-0.5 rounded-md border border-[#A6F4C5]/60 whitespace-nowrap">
                <ShieldCheck className="h-3 w-3 text-[#027A48] shrink-0" />
                <span>Verified</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[#6B6B6B] bg-[#F3F4F6] px-2 py-0.5 rounded-md border border-[#E5E7EB] whitespace-nowrap">
                <span>Unverified</span>
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: (
        <div className="leading-tight text-center">
          <span className="block font-semibold">ACTIONS</span>
          <span className="block text-[10px] font-semibold text-[#8C8C8C]">VIEW</span>
        </div>
      ),
      align: 'center',
      className: 'w-[5%] min-w-[50px]',
      render: (r) => (
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleViewRecord(r);
            }}
            className="p-1.5 rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] text-[#5B21B6] hover:bg-[#EDE9FE] transition-colors cursor-pointer"
            title="View Details"
            aria-label="View Attendance Details"
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
            Attendance
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6B6B] mt-0.5 truncate">
            Real-time worker attendance records, shifts, working hours, and verification telemetry.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="relative z-30 rounded-2xl border border-[#EEEEF2] bg-white p-3 sm:p-4 shadow-soft-sm space-y-3 w-full max-w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Unified Search Bar (Search by Name or ID) */}
          <div className="w-full sm:max-w-md min-w-0">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by Name or ID"
              className="w-full"
            />
          </div>

          {/* Right: Refresh & Filter Controls */}
          <div ref={filterContainerRef} className="flex items-center gap-2 sm:gap-2.5 self-start lg:self-auto shrink-0 flex-wrap relative">
            {/* Refresh Button */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing}
              className="flex items-center gap-1.5 rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] px-3 py-2 text-xs font-semibold text-[#6B6B6B] hover:text-[#5B21B6] hover:bg-[#EDE9FE] transition-all shadow-soft-sm active:scale-95 cursor-pointer disabled:opacity-50 shrink-0"
              title="Refresh attendance records"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading || isRefreshing ? 'animate-spin text-[#5B21B6]' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Filter Button (Closed by default) */}
            <button
              type="button"
              onClick={() => {
                if (isFilterOpen) {
                  setIsFilterOpen(false);
                  setIsAreaDropdownOpen(false);
                } else {
                  handleOpenFilter();
                }
              }}
              className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all shadow-soft-sm active:scale-95 cursor-pointer ${
                isFilterOpen || activeFilterCount > 0
                  ? 'border-[#5B21B6] bg-[#EDE9FE] text-[#5B21B6]'
                  : 'border-[#EEEEF2] bg-[#FAF9FC] text-[#1F1F1F] hover:bg-[#EDE9FE] hover:text-[#5B21B6]'
              }`}
              aria-expanded={isFilterOpen}
              aria-label="Toggle Attendance Filters"
            >
              <Filter className="h-4 w-4 text-[#5B21B6]" />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#5B21B6] text-[10px] font-bold text-white shadow-xs">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Backing Backdrop for Dismissal on Mobile */}
            {isFilterOpen && (
              <div
                className="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs sm:bg-transparent"
                onClick={() => {
                  setIsFilterOpen(false);
                  setIsAreaDropdownOpen(false);
                }}
              />
            )}

            {/* FLOATING FILTER POPOVER WITH CUSTOM ATTRACTIVE DROPDOWN & CALENDAR */}
            {isFilterOpen && (
              <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto right-3 sm:right-0 top-20 sm:top-full mt-2 z-50 w-auto sm:w-[420px] md:w-[440px] h-auto max-h-[85vh] flex flex-col rounded-2xl border border-[#EEEEF2] bg-white shadow-2xl shadow-purple-950/15 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Popover Header */}
                <div className="flex items-center justify-between border-b border-[#EEEEF2] p-4 bg-white shrink-0">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-[#5B21B6]" />
                    <h3 className="text-sm font-bold text-[#1F1F1F]">Filter Attendance</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsFilterOpen(false);
                      setIsAreaDropdownOpen(false);
                    }}
                    className="rounded-lg p-1 text-[#6B6B6B] hover:bg-[#FAF9FC] hover:text-[#1F1F1F] transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Popover Body */}
                <div className="max-h-[62vh] overflow-y-auto p-4 space-y-4 bg-[#FAF9FC]/50">
                  {/* 1. Custom Area Dropdown (Image 1 fix: Attractive custom select instead of browser native select) */}
                  <div className="rounded-xl border border-[#EEEEF2] bg-white p-3.5 shadow-soft-xs space-y-2">
                    <label className="block text-xs font-bold text-[#1F1F1F] flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-[#5B21B6]" />
                        Area / Zone
                      </span>
                      <span className="text-[10px] font-mono text-[#5B21B6] font-semibold bg-[#EDE9FE] px-2 py-0.5 rounded-full">
                        {draftArea}
                      </span>
                    </label>

                    {/* Custom Styled Trigger Button */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsAreaDropdownOpen((prev) => !prev)}
                        className={`w-full flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-all shadow-soft-xs cursor-pointer ${
                          isAreaDropdownOpen
                            ? 'border-[#5B21B6] bg-white ring-2 ring-[#5B21B6]/15 text-[#1F1F1F]'
                            : 'border-[#EEEEF2] bg-[#FAF9FC] text-[#1F1F1F] hover:bg-white hover:border-[#DDD6FE]'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <MapPin className="h-3.5 w-3.5 text-[#5B21B6] shrink-0" />
                          <span className="truncate">{draftArea || 'Select Area'}</span>
                        </div>
                        <ChevronDown className={`h-4 w-4 text-[#6B6B6B] shrink-0 transition-transform duration-200 ${isAreaDropdownOpen ? 'rotate-180 text-[#5B21B6]' : ''}`} />
                      </button>

                      {/* Custom Dropdown Options Menu */}
                      {isAreaDropdownOpen && (
                        <div className="mt-1.5 rounded-xl border border-[#EEEEF2] bg-white shadow-soft-lg overflow-hidden max-h-48 overflow-y-auto p-1 space-y-0.5 animate-in fade-in duration-150 z-20">
                          {areaOptions.map((area) => {
                            const isSelected = draftArea === area;
                            return (
                              <button
                                key={area}
                                type="button"
                                onClick={() => {
                                  setDraftArea(area);
                                  setIsAreaDropdownOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#EDE9FE] text-[#5B21B6] font-bold'
                                    : 'text-[#1F1F1F] hover:bg-[#FAF9FC]'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <MapPin className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-[#5B21B6]' : 'text-[#8C8C8C]'}`} />
                                  <span className="truncate">{area}</span>
                                </div>
                                {isSelected && <Check className="h-3.5 w-3.5 text-[#5B21B6] shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2. Attendance Status Filter */}
                  <div className="rounded-xl border border-[#EEEEF2] bg-white p-3.5 shadow-soft-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#1F1F1F] flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5 text-[#5B21B6]" />
                        Attendance Status
                      </label>
                      {draftStatus ? (
                        <button
                          type="button"
                          onClick={() => setDraftStatus('')}
                          className="text-[10px] font-semibold text-[#6B6B6B] hover:text-[#B42318] underline transition-colors cursor-pointer"
                        >
                          Clear
                        </button>
                      ) : (
                        <span className="text-[10px] font-medium text-[#6B6B6B] bg-[#FAF9FC] border border-[#EEEEF2] px-2 py-0.5 rounded-full">
                          All Statuses
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: '', label: 'All' },
                        { id: 'Checked-In', label: 'Checked-In' },
                        { id: 'Checked-Out', label: 'Checked-Out' },
                      ].map((s) => {
                        const isSelected = draftStatus === s.id;
                        return (
                          <button
                            key={s.id || 'all'}
                            type="button"
                            onClick={() => setDraftStatus(s.id)}
                            className={`rounded-xl py-2 px-2 text-[11px] font-semibold border transition-all text-center cursor-pointer flex items-center justify-center gap-1 active:scale-95 ${
                              isSelected
                                ? 'bg-[#5B21B6] text-white border-[#5B21B6] shadow-soft-xs ring-2 ring-[#5B21B6]/25 font-bold'
                                : 'bg-[#FAF9FC] text-[#4B5563] border-[#EEEEF2] hover:bg-[#EDE9FE] hover:text-[#5B21B6] hover:border-[#DDD6FE]'
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3 text-white shrink-0" />}
                            <span>{s.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Worker Identification Filters */}
                  <div className="rounded-xl border border-[#EEEEF2] bg-white p-3.5 shadow-soft-xs space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Worker ID */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#1F1F1F] flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-[#5B21B6]" />
                          Worker ID
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={draftWorkerId}
                            onChange={(e) => setDraftWorkerId(e.target.value)}
                            placeholder="Search by ID"
                            className="w-full rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] px-3 py-2 text-xs font-mono text-[#1F1F1F] placeholder:text-[#8C8C8C] focus:bg-white focus:border-[#5B21B6] focus:outline-none focus:ring-2 focus:ring-[#5B21B6]/15 transition-all"
                          />
                          {draftWorkerId && (
                            <button
                              type="button"
                              onClick={() => setDraftWorkerId('')}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C8C8C] hover:text-[#1F1F1F] p-0.5"
                              title="Clear Worker ID"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Worker Name */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#1F1F1F] flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-[#5B21B6]" />
                          Worker Name
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={draftWorkerName}
                            onChange={(e) => setDraftWorkerName(e.target.value)}
                            placeholder="Search by Name"
                            className="w-full rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] px-3 py-2 text-xs text-[#1F1F1F] placeholder:text-[#8C8C8C] focus:bg-white focus:border-[#5B21B6] focus:outline-none focus:ring-2 focus:ring-[#5B21B6]/15 transition-all"
                          />
                          {draftWorkerName && (
                            <button
                              type="button"
                              onClick={() => setDraftWorkerName('')}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C8C8C] hover:text-[#1F1F1F] p-0.5"
                              title="Clear Worker Name"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. Custom Date Range Picker & Calendar (Image 4 fix: Attractive Nest Admin calendar instead of native browser date picker) */}
                  <div className="rounded-xl border border-[#EEEEF2] bg-white p-3.5 shadow-soft-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#1F1F1F] flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-[#5B21B6]" />
                        Date Range
                      </label>
                      {draftFromDate && draftToDate ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-[#5B21B6] font-semibold bg-[#EDE9FE] px-2 py-0.5 rounded-full">
                            {getRangeDaysCount(draftFromDate, draftToDate)} days selected
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setDraftFromDate('');
                              setDraftToDate('');
                              setActivePreset(null);
                              setCalendarStep('start');
                            }}
                            className="text-[10px] font-semibold text-[#6B6B6B] hover:text-[#B42318] underline transition-colors cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-medium text-[#6B6B6B] bg-[#FAF9FC] border border-[#EEEEF2] px-2 py-0.5 rounded-full">
                          All Dates (No filter)
                        </span>
                      )}
                    </div>

                    {/* Quick Range Presets */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {PRESET_OPTIONS.map((p) => {
                        const isSelected = activePreset === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => applyPreset(p.id)}
                            className={`rounded-xl py-2 px-2 text-[11px] font-semibold border transition-all text-center cursor-pointer flex items-center justify-center gap-1 active:scale-95 ${
                              isSelected
                                ? 'bg-[#5B21B6] text-white border-[#5B21B6] shadow-soft-xs ring-2 ring-[#5B21B6]/25 font-bold'
                                : 'bg-[#FAF9FC] text-[#4B5563] border-[#EEEEF2] hover:bg-[#EDE9FE] hover:text-[#5B21B6] hover:border-[#DDD6FE]'
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3 text-white shrink-0" />}
                            <span>{p.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Active Selected Range Banner */}
                    {draftFromDate && draftToDate ? (
                      <div className="flex items-center justify-between rounded-xl bg-[#FAF9FC] p-2.5 border border-[#EEEEF2] text-xs">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span className="font-bold text-[#1F1F1F]">{formatDisplayDate(draftFromDate)}</span>
                          <span className="text-[#8C8C8C] font-sans">to</span>
                          <span className="font-bold text-[#1F1F1F]">{formatDisplayDate(draftToDate)}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-[#5B21B6] bg-[#EDE9FE] px-2 py-0.5 rounded-full capitalize">
                          {activePreset && activePreset !== 'custom'
                            ? PRESET_OPTIONS.find((p) => p.id === activePreset)?.label || 'Preset'
                            : `${getRangeDaysCount(draftFromDate, draftToDate)} days selected`}
                        </span>
                      </div>
                    ) : draftFromDate && !draftToDate ? (
                      <div className="flex items-center justify-between rounded-xl bg-[#EDE9FE]/50 p-2.5 border border-[#DDD6FE] text-xs">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span className="font-bold text-[#5B21B6]">{formatDisplayDate(draftFromDate)}</span>
                          <span className="text-[#6B6B6B] font-sans">→ Select end date on calendar</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setDraftFromDate('');
                            setDraftToDate('');
                            setActivePreset(null);
                            setCalendarStep('start');
                          }}
                          className="text-[10px] font-semibold text-[#6B6B6B] hover:text-[#B42318] underline transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between rounded-xl bg-[#FAF9FC] p-2.5 border border-dashed border-[#DDD6FE] text-xs text-[#6B6B6B]">
                        <span className="text-[11px]">No date range selected (shows all dates)</span>
                        <span className="text-[10px] font-semibold text-[#5B21B6] bg-[#EDE9FE] px-2 py-0.5 rounded-full">
                          Optional
                        </span>
                      </div>
                    )}

                    {/* Custom Calendar Month Widget */}
                    <div className="rounded-xl border border-[#EEEEF2] bg-white p-3 space-y-2.5">
                      {/* Month Navigation */}
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
                          }}
                          className="p-1 rounded-lg hover:bg-[#FAF9FC] text-[#6B6B6B] hover:text-[#1F1F1F] transition-colors cursor-pointer"
                          title="Previous Month"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-xs font-bold text-[#1F1F1F]">
                          {calendarMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
                          }}
                          className="p-1 rounded-lg hover:bg-[#FAF9FC] text-[#6B6B6B] hover:text-[#1F1F1F] transition-colors cursor-pointer"
                          title="Next Month"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Day of week headers */}
                      <div className="grid grid-cols-7 text-center text-[10px] font-bold text-[#8C8C8C] uppercase">
                        <div>Su</div>
                        <div>Mo</div>
                        <div>Tu</div>
                        <div>We</div>
                        <div>Th</div>
                        <div>Fr</div>
                        <div>Sa</div>
                      </div>

                      {/* Month Days Grid */}
                      <div className="grid grid-cols-7 gap-y-1 justify-items-center">
                        {renderCalendarDays()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Popover Footer */}
                <div className="flex items-center justify-between border-t border-[#EEEEF2] p-4 bg-white shrink-0">
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-xs font-semibold text-[#6B6B6B] hover:text-[#B42318] transition-colors cursor-pointer"
                  >
                    Reset Filters
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyFilter}
                    className="rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white px-5 py-2 text-xs font-bold shadow-soft-sm transition-all active:scale-95 cursor-pointer"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Applied Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#EEEEF2]">
          <span className="text-[11px] font-semibold text-[#6B6B6B]">Filters:</span>

          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#FAF9FC] border border-[#DDD6FE] px-2.5 py-0.5 text-[11px] font-semibold text-[#5B21B6]">
            <MapPin className="h-3 w-3 text-[#5B21B6]" />
            Area: {selectedArea}
          </span>

          {fromDate && toDate ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#FAF9FC] border border-[#DDD6FE] px-2.5 py-0.5 text-[11px] font-semibold text-[#5B21B6]">
              <Calendar className="h-3 w-3 text-[#5B21B6]" />
              {formatDisplayDate(fromDate)} → {formatDisplayDate(toDate)}
              <button
                type="button"
                onClick={() => {
                  setFromDate('');
                  setToDate('');
                  setCurrentPage(1);
                }}
                className="hover:text-[#B42318] p-0.5 transition-colors cursor-pointer ml-0.5"
                title="Remove date filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-[#EEEEF2] px-2.5 py-0.5 text-[11px] font-medium text-[#6B6B6B]">
              <Calendar className="h-3 w-3 text-[#8C8C8C]" />
              All Dates
            </span>
          )}

          {attendanceStatus && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#FAF9FC] border border-[#DDD6FE] px-2.5 py-0.5 text-[11px] font-semibold text-[#5B21B6]">
              <Activity className="h-3 w-3 text-[#5B21B6]" />
              Status: {attendanceStatus}
              <button
                type="button"
                onClick={() => {
                  setAttendanceStatus('');
                  setCurrentPage(1);
                }}
                className="hover:text-[#B42318] p-0.5 transition-colors cursor-pointer ml-0.5"
                title="Remove status filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {workerId && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#FAF9FC] border border-[#DDD6FE] px-2.5 py-0.5 text-[11px] font-semibold text-[#5B21B6]">
              <User className="h-3 w-3 text-[#5B21B6]" />
              ID: {workerId}
              <button
                type="button"
                onClick={() => {
                  setWorkerId('');
                  setSearch('');
                  setCurrentPage(1);
                }}
                className="hover:text-[#B42318] p-0.5 transition-colors cursor-pointer ml-0.5"
                title="Remove worker ID filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {workerName && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#FAF9FC] border border-[#DDD6FE] px-2.5 py-0.5 text-[11px] font-semibold text-[#5B21B6]">
              <User className="h-3 w-3 text-[#5B21B6]" />
              Name: {workerName}
              <button
                type="button"
                onClick={() => {
                  setWorkerName('');
                  setSearch('');
                  setCurrentPage(1);
                }}
                className="hover:text-[#B42318] p-0.5 transition-colors cursor-pointer ml-0.5"
                title="Remove worker name filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-[#EEEEF2] bg-white p-6 shadow-soft-sm space-y-4">
            <div className="h-5 w-48 bg-[#EDE9FE] animate-pulse rounded-lg" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((idx) => (
                <div key={idx} className="h-12 w-full bg-[#FAF9FC] animate-pulse rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {!isLoading && apiError && (
        <div className="rounded-2xl border border-rose-200 bg-[#FEF2F2] p-8 text-center shadow-soft-sm space-y-3">
          <AlertCircle className="h-8 w-8 text-[#B42318] mx-auto" />
          <h3 className="text-sm font-bold text-[#B42318]">{apiError}</h3>
          <p className="text-xs text-[#6B6B6B] max-w-md mx-auto">
            Unable to fetch real-time worker attendance records. Please check the network connection and retry.
          </p>
          <button
            type="button"
            onClick={() => fetchAttendance(selectedArea, fromDate, toDate, attendanceStatus, workerId, workerName, currentPage, pageSize)}
            className="rounded-xl bg-[#B42318] hover:bg-rose-800 text-white px-5 py-2 text-xs font-semibold shadow-soft-sm transition-all active:scale-95 cursor-pointer"
          >
            Retry Loading Attendance
          </button>
        </div>
      )}

      {/* Attendance Table (Desktop & Tablet): Compact with stacked Break Window so Eye/Actions icon is visible without horizontal scroll! */}
      {!isLoading && !apiError && (
        <div className="hidden lg:block">
          <DataTable
            columns={columns}
            data={displayRecords}
            keyExtractor={(r: RawWorkerAttendanceRecord) => `${r.workerId || 'W'}_${r.date || 'D'}_${r.checkInTime || ''}`}
            compact={true}
            emptyTitle="No attendance records found"
            emptyDescription={
              workerName || workerId || attendanceStatus
                ? 'No worker attendance matches your filter criteria. Try adjusting your filters.'
                : `No attendance records logged for ${selectedArea}${fromDate && toDate ? ` between ${formatDisplayDate(fromDate)} and ${formatDisplayDate(toDate)}` : ''}.`
            }
          />
        </div>
      )}

      {/* Responsive Cards View (Mobile & Tablet): Each card is NOT clickable; only clicking View Details opens drawer! */}
      {!isLoading && !apiError && (
        <div className="block lg:hidden space-y-3">
          {displayRecords.length === 0 ? (
            <div className="rounded-2xl border border-[#EEEEF2] bg-white p-8 text-center shadow-soft-sm">
              <h3 className="text-sm font-bold text-[#1F1F1F]">No attendance records found</h3>
              <p className="text-xs text-[#6B6B6B] mt-1">
                {workerName || workerId || attendanceStatus
                  ? 'No attendance records match your filter criteria.'
                  : `No attendance records logged for ${selectedArea} in this date range.`}
              </p>
            </div>
          ) : (
            displayRecords.map((r, index) => {
              const name = safeVal(r.workerName);
              const statusClean = safeVal(r.attendanceStatus) !== '—' ? r.attendanceStatus : 'Checked-In';
              const isVerified = r.CheckinVerified === true;
              const breakStart = r.breakStartTime && String(r.breakStartTime).trim() !== 'null' && String(r.breakStartTime).trim() !== 'undefined' ? String(r.breakStartTime).trim() : null;
              const breakEnd = r.breakEndTime && String(r.breakEndTime).trim() !== 'null' && String(r.breakEndTime).trim() !== 'undefined' ? String(r.breakEndTime).trim() : null;

              return (
                <div
                  key={`${r.workerId}_${r.date}_${index}`}
                  className="rounded-2xl border border-[#EEEEF2] bg-white p-4 shadow-soft-sm space-y-3"
                >
                  {/* Card Header: Worker & Status */}
                  <div className="flex items-center justify-between gap-2 border-b border-[#EEEEF2] pb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-9 w-9 rounded-xl bg-[#EDE9FE] border border-[#DDD6FE] flex items-center justify-center shrink-0 overflow-hidden">
                        {r.checkInPhoto ? (
                          <img
                            src={r.checkInPhoto}
                            alt={name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="font-bold text-xs text-[#5B21B6]">
                            {name !== '—' ? name.charAt(0).toUpperCase() : <User className="h-4 w-4 text-[#5B21B6]" />}
                          </span>
                        )}
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
                    <StatusBadge status={statusClean} size="sm" pulse={statusClean === 'Checked-In'} />
                  </div>

                  {/* Card Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl bg-[#FAF9FC] p-2.5 border border-[#EEEEF2]">
                      <span className="text-[10px] text-[#6B6B6B] font-mono block">DATE</span>
                      <span className="font-mono text-[11px] font-semibold text-[#1F1F1F]">
                        {formatDisplayDate(r.date)}
                      </span>
                    </div>

                    <div className="rounded-xl bg-[#FAF9FC] p-2.5 border border-[#EEEEF2]">
                      <span className="text-[10px] text-[#6B6B6B] font-mono block">AREA</span>
                      <span className="font-mono text-[11px] font-semibold text-[#5B21B6] truncate block">
                        {safeVal(r.areaName)}
                      </span>
                    </div>

                    <div className="rounded-xl bg-[#FAF9FC] p-2.5 border border-[#EEEEF2]">
                      <span className="text-[10px] text-[#6B6B6B] font-mono block">CHECK-IN</span>
                      <span className="font-mono text-[11px] font-medium text-[#1F1F1F]">
                        {safeVal(r.checkInTime)}
                      </span>
                    </div>

                    <div className="rounded-xl bg-[#FAF9FC] p-2.5 border border-[#EEEEF2]">
                      <span className="text-[10px] text-[#6B6B6B] font-mono block">CHECK-OUT</span>
                      <span className="font-mono text-[11px] font-medium text-[#6B6B6B]">
                        {safeVal(r.checkOutTime)}
                      </span>
                    </div>

                    <div className="rounded-xl bg-[#FAF9FC] p-2.5 border border-[#EEEEF2]">
                      <span className="text-[10px] text-[#6B6B6B] font-mono block">WORKED HOURS</span>
                      <span className="font-mono text-[11px] font-bold text-[#027A48]">
                        {safeVal(r.totalWorkedHours)}
                      </span>
                    </div>

                    <div className="rounded-xl bg-[#FAF9FC] p-2.5 border border-[#EEEEF2]">
                      <span className="text-[10px] text-[#6B6B6B] font-mono block">BREAK WINDOW</span>
                      {breakStart && breakEnd ? (
                        <div className="font-mono text-[10px] text-[#1F1F1F] leading-tight">
                          <div>{breakStart}</div>
                          <div className="text-[#8C8C8C]">to {breakEnd}</div>
                        </div>
                      ) : (
                        <span className="font-mono text-[11px] text-[#8C8C8C]">—</span>
                      )}
                    </div>

                    <div className="col-span-2 rounded-xl bg-[#FAF9FC] p-2.5 border border-[#EEEEF2] flex items-center justify-between">
                      <span className="text-[10px] text-[#6B6B6B] font-mono block">VERIFICATION</span>
                      {isVerified ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-[#027A48]">
                          <ShieldCheck className="h-3 w-3 text-[#027A48]" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-[#6B6B6B]">
                          Unverified
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Actions: Eye / View Details Button ONLY */}
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

      {/* Windowed Pagination Controls */}
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
              disabled={currentPage <= 1 || isLoading}
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
              disabled={currentPage >= totalPages || isLoading}
              className="flex items-center gap-1.5 rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] px-3.5 py-1.5 text-xs font-semibold text-[#1F1F1F] hover:bg-[#EDE9FE] hover:text-[#5B21B6] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Next Page"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5 text-[#6B6B6B]" />
            </button>
          </div>
        </div>
      )}

      {/* Attendance Detail Drawer */}
      <AttendanceDetailDrawer
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

export default AttendancePage;
