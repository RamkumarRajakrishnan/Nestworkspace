import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useOperations } from '../../../context/OperationsContext';
import { useAuth } from '../../../context/AuthContext';
import { Booking } from '../../../types';
import { DataTable, Column } from '../../../components/common/DataTable';
import { Pagination } from '../../../components/common/Pagination';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { SearchInput } from '../../../components/common/SearchInput';
import { BookingDetailDrawer } from '../../../components/operations/BookingDetailDrawer';
import { AssignWorkerModal } from '../../../components/operations/AssignWorkerModal';
import { getBookings, getActiveAreas, ActiveAreaItem, GetBookingsFilterOptions } from '../../../services/api';
import { mapApiBookingToBooking, formatDurationInHours } from '../../../services/bookingService';
import {
  MapPin,
  Eye,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertCircle,
  Clock,
  Check,
  ChevronLeft,
  ChevronRight,
  Calendar
} from 'lucide-react';

const REFRESH_INTERVAL_MS = 1 * 60 * 1000; // 1 minute (auto-refresh every 60s)
const PAGE_SIZE = 20; // Exactly 20 bookings per page

// The 5 static booking statuses with "In Progress" renamed to "Ongoing"
const STATIC_BOOKING_STATUSES = [
  { id: 'Booked', label: 'Booked', apiStatus: 'Booked' },
  { id: 'Assigned', label: 'Assigned', apiStatus: 'Assigned' },
  { id: 'Ongoing', label: 'Ongoing', apiStatus: 'In Progress' },
  { id: 'Completed', label: 'Completed', apiStatus: 'Completed' },
  { id: 'Cancelled', label: 'Cancelled', apiStatus: 'Cancelled' },
] as const;

// Static booking / service types: only instant / schedule
const STATIC_BOOKING_TYPES = [
  { id: 'instant', label: 'Instant' },
  { id: 'scheduled', label: 'Schedule' },
] as const;

// Static SLA Alerts
const STATIC_SLA_ALERTS = [
  { id: 'SLA Risk', label: 'SLA Risk' },
  { id: 'On Time', label: 'On Time' },
] as const;

// Static Durations
const STATIC_DURATIONS = [
  { val: '60', label: '60 mins (1 hr)' },
  { val: '120', label: '120 mins (2 hrs)' },
  { val: '180', label: '180 mins (3 hrs)' },
  { val: '240', label: '240 mins (4 hrs)' },
] as const;

/**
 * Normalizes duration to total minutes for consistent comparison across all formats:
 * - '240', 240, '4 hours', '4 hrs', '4 hr', '4h', '4' -> 240
 * - '60', 60, '1 hour', '1 hr', '1' -> 60
 * - '120', 120, '2 hours', '2 hrs', '2' -> 120
 * - '180', 180, '3 hours', '3 hrs', '3' -> 180
 */
export const parseDurationMinutes = (val: string | number | undefined | null): number | null => {
  if (val === undefined || val === null) return null;
  const str = String(val).trim().toLowerCase();
  if (!str || str === 'all' || str === '—' || str === '-') return null;

  const hourMatch = str.match(/^(\d+(\.\d+)?)\s*(?:hour|hours|hr|hrs|h)\b/);
  if (hourMatch) {
    return Math.round(parseFloat(hourMatch[1]) * 60);
  }

  const minMatch = str.match(/^(\d+(\.\d+)?)\s*(?:minute|minutes|min|mins|m)\b/);
  if (minMatch) {
    return Math.round(parseFloat(minMatch[1]));
  }

  const num = parseFloat(str);
  if (!isNaN(num)) {
    if (num <= 12) {
      return Math.round(num * 60);
    }
    return Math.round(num);
  }

  return null;
};

/**
 * Normalizes area names by trimming, converting to lower case, and stripping separators
 * so that "Neo_Town", "neo_town", "Neo Town", "Neo-Town" match identically.
 */
export const normalizeAreaName = (area?: string | null): string => {
  if (!area) return '';
  return area.trim().toLowerCase().replace(/[_\s-]+/g, '');
};

// ============================================================================
// DATE RANGE FILTER HELPERS (Strictly user-local calendar, future dates disabled)
// ============================================================================
export const getIsoDateString = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseIsoDate = (str: string): Date => {
  const parts = (str || '').split('-');
  if (parts.length === 3) {
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }
  return new Date(str || Date.now());
};

export const formatDisplayDate = (isoStr?: string): string => {
  if (!isoStr) return '';
  try {
    const d = parseIsoDate(isoStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return isoStr;
  }
};

export const getRangeDaysCount = (fromStr: string, toStr: string): number => {
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

export type DatePresetKey = 'today' | 'yesterday' | '7days' | '14days' | 'thisMonth' | '30days' | 'custom';

export const DATE_PRESET_OPTIONS: { id: DatePresetKey; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: '7days', label: 'Last 7 Days' },
  { id: '14days', label: 'Last 14 Days' },
  { id: 'thisMonth', label: 'This Month' },
  { id: '30days', label: 'Last 30 Days' },
];

export const detectDatePreset = (from: string, to: string): DatePresetKey | null => {
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

export const OrdersPage: React.FC = () => {
  const { markets } = useOperations();
  const { accessibleAreas, hasAllAreaAccess } = useAuth();

  // Active Areas fetched dynamically from https://www.haatza.com/_functions/nestActiveAreas?page=1&pageSize=20
  const [activeAreas, setActiveAreas] = useState<ActiveAreaItem[]>([]);
  const [isLoadingAreas, setIsLoadingAreas] = useState<boolean>(true);

  // Available area options for dropdowns dynamically from user access or full system areas
  const availableAreaOptions = useMemo(() => {
    if (hasAllAreaAccess) {
      if (activeAreas.length > 0) {
        return activeAreas.map((a) => a.areaName);
      }
      return accessibleAreas.length > 0 ? accessibleAreas : [];
    }
    return accessibleAreas;
  }, [hasAllAreaAccess, activeAreas, accessibleAreas]);

  // Server-side filter parameters - default area is 'Haatza_corp'
  const [selectedArea, setSelectedArea] = useState<string>('Haatza_corp');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedSlaAlert, setSelectedSlaAlert] = useState<string>('');
  const [selectedBookingType, setSelectedBookingType] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<string>('');

  // Server-side Date Range filter parameters (YYYY-MM-DD format)
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const [page, setPage] = useState<number>(1);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }>({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const isFetchingRef = useRef<boolean>(false);
  const fetchRequestIdRef = useRef<number>(0);

  // Orders and loading states
  const [orders, setOrders] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Search state (client filter)
  const [search, setSearch] = useState<string>('');

  // Filter Popover state
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const filterContainerRef = useRef<HTMLDivElement>(null);

  // Draft states inside the Filter Popover (committed on clicking "Apply")
  const [draftArea, setDraftArea] = useState<string>('Haatza_corp');
  const [draftStatus, setDraftStatus] = useState<string>('');
  const [draftSlaAlert, setDraftSlaAlert] = useState<string>('');
  const [draftBookingType, setDraftBookingType] = useState<string>('');
  const [draftDuration, setDraftDuration] = useState<string>('');

  // Draft Date Range state in Filter Popover
  const [draftFromDate, setDraftFromDate] = useState<string>('');
  const [draftToDate, setDraftToDate] = useState<string>('');
  const [activePreset, setActivePreset] = useState<DatePresetKey | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date());
  const [calendarStep, setCalendarStep] = useState<'start' | 'end'>('start');
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(true);

  // Accordion sections expansion state - all closed by default, mutually exclusive
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    area: false,
    status: false,
    bookingType: false,
    sla: false,
    duration: false,
  });

  const toggleSection = (sectionKey: string) => {
    setExpandedSections((prev) => ({
      area: sectionKey === 'area' ? !prev.area : false,
      status: sectionKey === 'status' ? !prev.status : false,
      bookingType: sectionKey === 'bookingType' ? !prev.bookingType : false,
      sla: sectionKey === 'sla' ? !prev.sla : false,
      duration: sectionKey === 'duration' ? !prev.duration : false,
    }));
  };

  // Close filter popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterContainerRef.current && !filterContainerRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterOpen]);

  // Inspection Drawer & Assign Modal state
  const [inspectBooking, setInspectBooking] = useState<Booking | null>(null);
  const [assignBooking, setAssignBooking] = useState<Booking | null>(null);

  // Fetch active areas dynamically from API on mount only if full access or needed for metadata
  useEffect(() => {
    setIsLoadingAreas(true);
    getActiveAreas(1, 20)
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setActiveAreas(res.data);
        }
      })
      .catch((err) => console.error('Failed to load active areas:', err))
      .finally(() => setIsLoadingAreas(false));
  }, []);

  // Fetch orders from centralized API using the server-side query filters and dynamic pagination
  const fetchOrders = useCallback(async (
    filters: {
      areaName?: string;
      bookingStatus?: string;
      slaAlert?: string;
      bookingType?: string;
      bookingId?: string;
      customerPhone?: string;
      fromDate?: string;
      toDate?: string;
    },
    pageNumber: number = 1,
    isSilent: boolean = false
  ) => {
    // Prevent duplicate concurrent requests during rapid pagination clicks
    if (isFetchingRef.current && !isSilent) return;
    isFetchingRef.current = true;

    const currentReqId = ++fetchRequestIdRef.current;
    if (!isSilent) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      const apiFilterOpts: GetBookingsFilterOptions = {
        areaName: filters.areaName || 'Haatza_corp',
        page: pageNumber,
        limit: PAGE_SIZE, // Exactly 20 bookings per page
      };

      if (filters.bookingId) {
        apiFilterOpts.bookingId = filters.bookingId.replace(/^#/, '').trim();
      } else if (filters.customerPhone) {
        apiFilterOpts.customerPhone = filters.customerPhone.trim();
      }

      if (filters.bookingStatus && filters.bookingStatus !== 'ALL' && filters.bookingStatus !== 'All') {
        apiFilterOpts.bookingStatus = filters.bookingStatus === 'Ongoing' ? 'In Progress' : filters.bookingStatus;
      }
      if (filters.slaAlert && filters.slaAlert !== 'ALL' && filters.slaAlert !== 'All') {
        apiFilterOpts.slaAlert = filters.slaAlert;
      }
      if (filters.bookingType && filters.bookingType !== 'ALL' && filters.bookingType !== 'All') {
        apiFilterOpts.bookingType = filters.bookingType;
      }

      // Date Range Filter parameters (YYYY-MM-DD)
      if (filters.fromDate && filters.fromDate.trim()) {
        apiFilterOpts.fromDate = filters.fromDate.trim();
      }
      if (filters.toDate && filters.toDate.trim()) {
        apiFilterOpts.toDate = filters.toDate.trim();
      }
      // Note: duration is not sent to backend query to prevent backend 404/no-bookings bug; handled client-side

      const response = await getBookings(apiFilterOpts);

      // Discard responses from older requests if a newer request was dispatched
      if (currentReqId !== fetchRequestIdRef.current) {
        return;
      }

      if (response.success && Array.isArray(response.data)) {
        const mapped = response.data.map(mapApiBookingToBooking);
        setOrders(mapped);
        setLastRefreshedAt(new Date());

        if (response.pagination) {
          setPagination({
            page: response.pagination.page,
            limit: response.pagination.limit,
            totalCount: response.pagination.totalCount,
            totalPages: response.pagination.totalPages,
            hasNextPage: response.pagination.hasNextPage,
            hasPreviousPage: response.pagination.hasPreviousPage,
          });
        } else {
          const totalRecs = response.total ?? mapped.length;
          const totalPgs = Math.max(1, Math.ceil(totalRecs / PAGE_SIZE));
          setPagination({
            page: pageNumber,
            limit: PAGE_SIZE,
            totalCount: totalRecs,
            totalPages: totalPgs,
            hasNextPage: pageNumber < totalPgs,
            hasPreviousPage: pageNumber > 1,
          });
        }
      } else {
        setError(response.error || 'Unable to load orders. Please try again.');
      }
    } catch (err) {
      if (currentReqId === fetchRequestIdRef.current) {
        console.error('Failed to load orders:', err);
        setError('Unable to load orders. Please check your internet connection.');
      }
    } finally {
      if (currentReqId === fetchRequestIdRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
        isFetchingRef.current = false;
      }
    }
  }, []);

  // Trigger load when server-side filter dependencies or page change
  useEffect(() => {
    fetchOrders({
      areaName: selectedArea || 'Haatza_corp',
      bookingStatus: selectedStatus || undefined,
      slaAlert: selectedSlaAlert || undefined,
      bookingType: selectedBookingType || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    }, page, false);
  }, [fetchOrders, selectedArea, selectedStatus, selectedSlaAlert, selectedBookingType, fromDate, toDate, page]);

  // Track the last minute we refreshed at (initialized to the current minute on mount)
  const lastRefreshedMinuteRef = useRef<number>(new Date().getMinutes());

  // Live clock synchronized with header integrated timer and auto-refresh on the minute (:00)
  const autoRefreshRef = useRef<() => void>(() => { });
  useEffect(() => {
    autoRefreshRef.current = () => {
      if (!isLoading && !isRefreshing && !isFetchingRef.current) {
        fetchOrders({
          areaName: selectedArea || 'Haatza_corp',
          bookingStatus: selectedStatus || undefined,
          slaAlert: selectedSlaAlert || undefined,
          bookingType: selectedBookingType || undefined,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
        }, page, true);
      }
    };
  }, [fetchOrders, selectedArea, selectedStatus, selectedSlaAlert, selectedBookingType, fromDate, toDate, page, isLoading, isRefreshing]);

  // Live clock synchronized with header integrated timer and auto-refresh on the minute (:00)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      const currentMinute = now.getMinutes();
      // Requirement: Trigger auto-refresh exactly when seconds come to 00 and change to next minute
      if (currentMinute !== lastRefreshedMinuteRef.current) {
        lastRefreshedMinuteRef.current = currentMinute;
        autoRefreshRef.current();
      }
    }, 500);

    return () => clearInterval(timer);
  }, []);

  // Quick Preset Click Handler
  const applyPreset = (presetKey: DatePresetKey) => {
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
    const today = getIsoDateString(now);
    let from = '';
    let to = today;

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
    } else if (presetKey === 'thisMonth') {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      from = getIsoDateString(d);
    } else if (presetKey === '30days') {
      const d = new Date();
      d.setDate(d.getDate() - 29);
      from = getIsoDateString(d);
    }

    setDraftFromDate(from);
    setDraftToDate(to);
    setCalendarMonth(parseIsoDate(to));
    setCalendarStep('start');
  };

  // Custom Calendar Day Click Handler (strictly enforces future dates disabled)
  const handleCalendarDayClick = (isoStr: string) => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 4);
    const maxDateIso = getIsoDateString(maxDate);
    if (isoStr > maxDateIso) return; // Future dates beyond 4 days are non-selectable

    setActivePreset('custom');

    if (calendarStep === 'start' || !draftFromDate) {
      setDraftFromDate(isoStr);
      setDraftToDate(isoStr);
      setCalendarStep('end');
    } else {
      if (isoStr >= draftFromDate) {
        setDraftToDate(isoStr);
        setCalendarStep('start');
      } else {
        setDraftFromDate(isoStr);
        setDraftToDate(isoStr);
        setCalendarStep('end');
      }
    }
  };

  // Render Calendar Month Days Grid with future dates disabled and range highlight
  const renderCalendarDays = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 4);
    const maxDateIso = getIsoDateString(maxDate);

    const days = [];

    // Blank cells before first day of month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(<div key={`blank-${i}`} className="h-8 w-8" />);
    }

    // Days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, month, day);
      const isoStr = getIsoDateString(dayDate);
      const isFuture = isoStr > maxDateIso;
      const isStart = isoStr === draftFromDate;
      const isEnd = isoStr === draftToDate;
      const isInRange = draftFromDate && draftToDate && isoStr > draftFromDate && isoStr < draftToDate;
      const isSingleDay = isStart && isEnd;

      let btnClass = 'h-8 w-8 text-xs font-semibold flex items-center justify-center transition-all ';

      if (isFuture) {
        btnClass += 'rounded-xl text-[#B0B0B0] opacity-25 cursor-not-allowed select-none';
      } else if (isSingleDay) {
        btnClass += 'rounded-xl bg-[#1B2E79] text-white font-bold shadow-soft-sm ring-2 ring-[#1B2E79]/30 cursor-pointer';
      } else if (isStart) {
        btnClass += 'rounded-l-xl bg-[#1B2E79] text-white font-bold shadow-soft-sm cursor-pointer';
      } else if (isEnd) {
        btnClass += 'rounded-r-xl bg-[#1B2E79] text-white font-bold shadow-soft-sm cursor-pointer';
      } else if (isInRange) {
        btnClass += 'bg-[#EEF3FF] text-[#1B2E79] font-semibold rounded-none cursor-pointer';
      } else {
        btnClass += 'rounded-xl text-[#1F1F1F] hover:bg-[#FAF9FC] hover:text-[#1B2E79] cursor-pointer';
      }

      days.push(
        <button
          key={isoStr}
          type="button"
          disabled={isFuture}
          onClick={() => handleCalendarDayClick(isoStr)}
          className={btnClass}
          aria-label={isoStr}
          aria-disabled={isFuture}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  // Open Popover and sync drafts with applied state (always closed by default)
  const handleOpenFilter = () => {
    setDraftArea(selectedArea);
    setDraftStatus(selectedStatus);
    setDraftSlaAlert(selectedSlaAlert);
    setDraftBookingType(selectedBookingType);
    setDraftDuration(selectedDuration);
    setDraftFromDate(fromDate);
    setDraftToDate(toDate);
    setCalendarMonth(fromDate || toDate ? parseIsoDate(toDate || fromDate) : new Date());
    setCalendarStep('start');
    setActivePreset(fromDate && toDate ? detectDatePreset(fromDate, toDate) : null);
    setIsCalendarOpen(true);
    setExpandedSections({
      area: false,
      status: false,
      bookingType: false,
      sla: false,
      duration: false,
    });
    setIsFilterOpen(true);
  };

  // Apply draft filters
  const handleApplyFilter = () => {
    setSelectedArea(draftArea);
    setSelectedStatus(draftStatus);
    setSelectedSlaAlert(draftSlaAlert);
    setSelectedBookingType(draftBookingType);
    setSelectedDuration(draftDuration);
    setFromDate(draftFromDate);
    setToDate(draftToDate);
    setPage(1);
    setIsFilterOpen(false);
  };

  // Clear all static filters (resets area to default Haatza_corp, duration, status, date range, search)
  const handleRemoveFilters = () => {
    setSelectedArea('Haatza_corp');
    setSelectedStatus('');
    setSelectedSlaAlert('');
    setSelectedBookingType('');
    setSelectedDuration('');
    setFromDate('');
    setToDate('');
    setDraftArea('Haatza_corp');
    setDraftStatus('');
    setDraftSlaAlert('');
    setDraftBookingType('');
    setDraftDuration('');
    setDraftFromDate('');
    setDraftToDate('');
    setActivePreset(null);
    setCalendarStep('start');
    setSearch('');
    setPage(1);
  };

  // Clear all filters from within the popover
  const handleClearAllPopoverFilters = () => {
    setSelectedArea('Haatza_corp');
    setSelectedStatus('');
    setSelectedSlaAlert('');
    setSelectedBookingType('');
    setSelectedDuration('');
    setFromDate('');
    setToDate('');
    setDraftArea('Haatza_corp');
    setDraftStatus('');
    setDraftSlaAlert('');
    setDraftBookingType('');
    setDraftDuration('');
    setDraftFromDate('');
    setDraftToDate('');
    setActivePreset(null);
    setCalendarStep('start');
    setPage(1);
    setIsFilterOpen(false);
  };

  // Count active filters (including area when customized from Haatza_corp, date range, duration, status, etc., excluding search)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedArea && selectedArea !== 'ALL' && selectedArea !== 'All Areas' && selectedArea !== 'Haatza_corp') count++;
    if (selectedStatus && selectedStatus !== 'ALL' && selectedStatus !== '') count++;
    if (selectedSlaAlert && selectedSlaAlert !== 'ALL' && selectedSlaAlert !== '') count++;
    if (selectedBookingType && selectedBookingType !== 'ALL' && selectedBookingType !== '') count++;
    if (selectedDuration && selectedDuration !== 'ALL' && selectedDuration !== '') count++;
    if (fromDate && toDate) count++;
    return count;
  }, [selectedArea, selectedStatus, selectedSlaAlert, selectedBookingType, selectedDuration, fromDate, toDate]);

  // Combined AND filtering: Area + Duration + Status + Booking Type + SLA Alert + Search
  const filteredBookings = useMemo(() => {
    return orders.filter((b) => {
      // 1. Operating Area filter (only if user explicitly filtered by a specific area other than Haatza_corp / All)
      if (selectedArea && selectedArea !== 'ALL' && selectedArea !== 'All Areas' && selectedArea.toLowerCase() !== 'haatza_corp') {
        const bArea = b.areaName || b.areaId || '';
        const matchesArea =
          bArea.toLowerCase() === selectedArea.toLowerCase() ||
          normalizeAreaName(bArea) === normalizeAreaName(selectedArea);
        if (!matchesArea) return false;
      }

      // 2. Duration filter (normalizes 240 mins == 4 hours == 4 hrs == 4)
      if (selectedDuration && selectedDuration !== 'ALL' && selectedDuration !== 'All') {
        const filterMin = parseDurationMinutes(selectedDuration);
        const bookingMin = parseDurationMinutes(b.durationMinutes || b.duration);
        if (filterMin !== null && bookingMin !== null) {
          if (bookingMin !== filterMin) return false;
        }
      }

      // 3. Booking Status filter (including Ongoing <-> In Progress equivalence)
      if (selectedStatus && selectedStatus !== 'ALL' && selectedStatus !== 'All') {
        const bStatus = (b.bookingStatus || b.status || '').toLowerCase();
        const sStatus = selectedStatus.toLowerCase();
        if (sStatus === 'ongoing' || sStatus === 'in progress') {
          if (bStatus !== 'ongoing' && bStatus !== 'in progress') return false;
        } else {
          if (bStatus !== sStatus) return false;
        }
      }

      // 4. Booking Type / Service Type filter (scheduled / instant)
      if (selectedBookingType && selectedBookingType !== 'ALL' && selectedBookingType !== 'All') {
        const bType = (b.bookingType || b.service || '').toLowerCase();
        const sType = selectedBookingType.toLowerCase();
        if (sType === 'scheduled' || sType === 'schedule') {
          if (bType !== 'scheduled' && bType !== 'schedule') return false;
        } else {
          if (bType !== sType) return false;
        }
      }

      // 5. SLA Alert filter (SLA Risk / On Time)
      if (selectedSlaAlert && selectedSlaAlert !== 'ALL' && selectedSlaAlert !== 'All') {
        const bAlert = (b.slaAlert || '').toLowerCase();
        if (bAlert !== selectedSlaAlert.toLowerCase()) return false;
      }

      // 6. Multi-field search
      if (search.trim()) {
        const qRaw = search.trim().toLowerCase();
        const qClean = qRaw.replace(/^#/, '').trim();
        const qDigits = qRaw.replace(/\D/g, '');

        const bId = String(b.bookingId || '').toLowerCase();
        const bAltId = String(b.id || '').toLowerCase();
        const bTableId = String(b.tableId || '').toLowerCase();
        const matchesId =
          bId.includes(qRaw) ||
          bId.includes(qClean) ||
          (`#${bId}`).includes(qRaw) ||
          bAltId.includes(qRaw) ||
          bAltId.includes(qClean) ||
          bTableId.includes(qRaw) ||
          bTableId.includes(qClean);

        const custName = String(b.customerName || b.customer?.name || '').toLowerCase();
        const custEmail = String(b.customerEmail || b.customer?.email || '').toLowerCase();
        const matchesCust =
          custName.includes(qRaw) ||
          custName.includes(qClean) ||
          custEmail.includes(qRaw);

        const rawPhone = String(b.customerPhone || b.customer?.phone || '').toLowerCase();
        const phoneDigits = rawPhone.replace(/\D/g, '');
        const matchesPhone =
          rawPhone.includes(qRaw) ||
          rawPhone.includes(qClean) ||
          (qDigits.length >= 3 && phoneDigits.includes(qDigits));

        const vName = String(b.vendorName || '').toLowerCase();
        const vId = String(b.vendorId || '').toLowerCase();
        const matchesVendor = vName.includes(qRaw) || vId.includes(qRaw);

        const serv = String(b.service || b.bookingType || '').toLowerCase();
        const matchesServ = serv.includes(qRaw);

        const addr = String(b.address || '').toLowerCase();
        const matchesAddr = addr.includes(qRaw);

        const area = String(b.areaName || b.areaId || '').toLowerCase();
        const matchesAreaText = area.includes(qRaw);

        const status = String(b.bookingStatus || b.status || '').toLowerCase();
        const matchesStatus = status.includes(qRaw);

        if (!matchesId && !matchesCust && !matchesPhone && !matchesVendor && !matchesServ && !matchesAddr && !matchesAreaText && !matchesStatus) {
          return false;
        }
      }

      return true;
    });
  }, [orders, selectedArea, selectedDuration, selectedStatus, selectedBookingType, selectedSlaAlert, search]);

  // Server-side paginated bookings directly from API (no client-side slicing)
  const paginatedBookings = filteredBookings;

  // Formatter for scheduled time: Date on top line, Time strictly below Date
  const formatScheduledDateTime = (isoTime?: string, fallbackDate?: string, fallbackTime?: string) => {
    if (isoTime) {
      try {
        const d = new Date(isoTime);
        if (!isNaN(d.getTime())) {
          const dateStr = d.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
          });
          const timeStr = d.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          }).toLowerCase();
          return { dateStr, timeStr };
        }
      } catch {
        // fallback
      }
    }
    return {
      dateStr: fallbackDate || '—',
      timeStr: fallbackTime || '—',
    };
  };

  // Helper to determine row/card background colors strictly based on backend response:
  // - Booked / Assigned with SLA Risk -> Light red
  // - Remaining things -> Keep previous white colour only (no orange colour)
  const getBookingRowStyle = (b: Booking) => {
    const statusLower = (b.bookingStatus || b.status || '').toLowerCase();
    const alertLower = (b.slaAlert || '').toLowerCase();
    const isRisk = alertLower.includes('risk') || statusLower.includes('risk') || b.priority === 'High';
    const isBookedOrAssigned = statusLower.includes('booked') || statusLower.includes('assigned');

    if (isRisk && isBookedOrAssigned) {
      return {
        rowClass: '!bg-[#FEF2F2] hover:!bg-[#FEF2F2] border-l-4 !border-l-[#EF4444]',
        cardClass: 'bg-[#FEF2F2] border-l-4 border-l-[#EF4444] border-rose-200',
      };
    }

    return {
      rowClass: 'bg-white hover:bg-[#FAF9FC]',
      cardClass: 'bg-white border-[#EEEEF2] hover:border-[#1B2E79]/30',
    };
  };

  // Helper to check if order can be assigned: strictly for booked / assigned
  const canAssignExpert = (b: Booking) => {
    const statusLower = String(b.bookingStatus || b.status || '').trim().toLowerCase();
    return statusLower === 'booked' || statusLower === 'assigned';
  };

  // Table Columns Definition: Headings and content alignment strictly match
  const columns: Column<Booking>[] = [
    {
      header: 'Booking ID',
      accessor: 'id',
      align: 'left',
      render: (b) => (
        <div className="text-left font-mono font-bold text-[#1F1F1F]">
          #{b.bookingId || b.id}
        </div>
      ),
    },
    {
      header: 'Customer',
      align: 'left',
      render: (b) => {
        const name = b.customerName || b.customer?.name || b.vendorName || '—';
        const phone = b.customerPhone || b.customer?.phone || '';
        return (
          <div className="text-left">
            <div className="font-semibold text-[#1F1F1F]">{name}</div>
            {phone && phone !== '—' && (
              <div className="font-mono text-[11px] text-[#6B6B6B] mt-0.5">{phone}</div>
            )}
          </div>
        );
      },
    },
    {
      // Requirement: service type as instant or schedule fetch from api
      header: 'Service Type',
      accessor: 'service',
      align: 'left',
      render: (b) => {
        const rawType = (b.bookingType || b.service || 'Instant').toLowerCase();
        const displayType = rawType === 'scheduled' || rawType === 'schedule' ? 'Scheduled' : 'Instant';
        const isInstant = displayType === 'Instant';

        return (
          <div className="text-left">
            <span
              className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold border ${isInstant
                  ? 'bg-[#EEF3FF] text-[#1B2E79] border-[#C4D9FD]'
                  : 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]'
                }`}
            >
              {displayType}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Area / Nano-Market',
      align: 'left',
      render: (b) => (
        <div className="text-left">
          <span className="inline-flex items-center gap-1 font-mono text-[#1B2E79] font-semibold text-xs bg-[#EEF3FF] px-2 py-0.5 rounded-lg">
            <MapPin className="h-3 w-3 text-[#1B2E79]" />
            {b.areaName || b.areaId || selectedArea}
          </span>
        </div>
      ),
    },
    {
      // Requirement: in schedule time we have duration also remove it, and put time below date
      header: 'Scheduled Time',
      align: 'left',
      render: (b) => {
        const { dateStr, timeStr } = formatScheduledDateTime(b.requestedTime, b.date, b.startTime);
        return (
          <div className="text-xs text-left">
            <div className="font-mono font-semibold text-[#1F1F1F] leading-tight">
              {dateStr}
            </div>
            <div className="font-mono text-[11px] text-[#6B6B6B] mt-0.5 leading-tight">
              {timeStr}
            </div>
          </div>
        );
      },
    },
    {
      // Requirement: for duration colum convert it into hours
      header: 'Duration',
      align: 'left',
      render: (b) => {
        const durationHours = formatDurationInHours(b.duration || b.durationMinutes);
        return (
          <div className="text-left font-mono text-xs font-semibold text-[#1F1F1F]">
            {durationHours}
          </div>
        );
      },
    },
    {
      header: 'Payment',
      align: 'left',
      render: (b) => {
        const amt = b.totalAmount !== undefined && b.totalAmount !== '' ? b.totalAmount : b.amount;
        const status = b.paymentStatus || 'Success';
        return (
          <div className="text-xs text-left">
            <span className="font-mono font-bold text-[#1B2E79] block">
              {amt && amt !== '—' ? `₹${amt}` : '—'}
            </span>
            <span className="text-[10px] text-emerald-700 block font-medium mt-0.5">
              {status}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Status',
      align: 'left',
      render: (b) => {
        let statusValue = b.bookingStatus || b.status;
        if (statusValue === 'In Progress' || statusValue === 'in progress') {
          statusValue = 'Ongoing';
        }
        const isSlaRisk = statusValue === 'SLA Risk' || b.slaAlert === 'SLA Risk';
        return (
          <div className="flex items-center justify-start">
            <StatusBadge status={statusValue} size="sm" pulse={isSlaRisk} />
          </div>
        );
      },
    },
    {
      header: 'SLA',
      align: 'left',
      render: (b) => {
        const timer = b.slaTimer;
        const alert = b.slaAlert;
        if (!timer || timer === '—' || timer.trim() === '') {
          return <div className="text-left text-[#6B6B6B] font-mono text-[11px]">—</div>;
        }

        const isRisk = alert === 'SLA Risk';
        return (
          <div className="text-xs text-left">
            <span
              className={`font-mono text-xs font-semibold block ${isRisk ? 'text-[#B42318] font-bold animate-pulse' : 'text-[#1F1F1F]'
                }`}
            >
              {timer}
            </span>
            {alert && alert !== '—' && (
              <span className={`block text-[10px] mt-0.5 ${isRisk ? 'text-[#B42318] font-semibold' : 'text-[#6B6B6B]'}`}>
                {alert}
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Actions',
      align: 'right',
      render: (b) => {
        const showAssign = canAssignExpert(b);
        const isAssigned = (b.bookingStatus || b.status) === 'Assigned' || Boolean(b.vendorId || b.vendorName);
        return (
          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            {/* Requirement: assign expert button is only showed from the response of booked, assigned; for completed orders we dont need to show */}
            {showAssign && (
              <button
                type="button"
                onClick={() => setAssignBooking(b)}
                className="rounded-xl bg-[#1B2E79] hover:bg-[#13225C] text-white px-2.5 py-1 text-[11px] font-semibold shadow-soft-sm transition-all active:scale-95 cursor-pointer"
              >
                {isAssigned ? 'Reassign Expert' : 'Assign Expert'}
              </button>
            )}
            <button
              type="button"
              onClick={() => setInspectBooking(b)}
              className="rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-1.5 text-[#6B6B6B] hover:text-[#1B2E79] hover:bg-[#EEF3FF] transition-colors shadow-soft-sm cursor-pointer"
              title="Inspect Order Details (Slide-in Drawer)"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      {/* Top Banner with Page Title (Operating area selector removed as it is inside Filter) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F1F1F] flex items-center gap-2">
            Bookings
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6B6B] mt-0.5">
            Monitor incoming customer reservations, assignment coverage, and SLA delivery milestones.
          </p>
        </div>
      </div>

      {/* Top Filter Bar: Search Bar & Area Selector on Left; Auto-refresh & Refresh Button on Left beside Filter */}
      <div className="relative z-30 rounded-2xl border border-[#EEEEF2] bg-white p-3 sm:p-4 shadow-soft-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Search Bar */}
          <div className="w-full sm:max-w-md lg:max-w-lg">
            <SearchInput
              value={search}
              onChange={(val) => {
                setSearch(val);
                setPage(1);
              }}
              placeholder="Search booking ID, customer, vendor, address..."
              className="w-full"
            />
          </div>

          {/* Right: Auto-Refresh info + Refresh button (left beside of filters) + Filter Button */}
          <div ref={filterContainerRef} className="flex items-center gap-2 sm:gap-2.5 self-start lg:self-auto shrink-0 flex-wrap relative">
            {/* Auto-Refresh Status Indicator with Live Countdown Counter */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] text-xs text-[#6B6B6B] shadow-soft-xs">
              {isRefreshing ? (
                <RefreshCw className="h-3 w-3 animate-spin text-[#10B981] shrink-0" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse shrink-0" />
              )}
              <span className="text-[11px] whitespace-nowrap">
                Auto-refreshes every 1m •{' '}
                <strong className="text-[#1F1F1F] font-mono">
                  {isRefreshing
                    ? 'Refreshing...'
                    : currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).toLowerCase()}
                </strong>
              </span>
            </div>

            {/* Manual Refresh Button */}
            <button
              type="button"
              onClick={() => fetchOrders({
                areaName: selectedArea || 'Haatza_corp',
                bookingStatus: selectedStatus || undefined,
                slaAlert: selectedSlaAlert || undefined,
                bookingType: selectedBookingType || undefined,
                fromDate: fromDate || undefined,
                toDate: toDate || undefined,
              }, page, false)}
              disabled={isLoading || isRefreshing}
              className="flex items-center gap-1.5 rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] px-3 py-2 text-xs font-semibold text-[#1F1F1F] hover:text-[#1B2E79] hover:bg-[#EEF3FF] shadow-soft-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Refresh Orders manually"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading || isRefreshing ? 'animate-spin text-[#1B2E79]' : ''}`} />
              <span>Refresh</span>
            </button>

            {/* Filter Button */}
            <button
              type="button"
              onClick={() => {
                if (isFilterOpen) {
                  setIsFilterOpen(false);
                } else {
                  handleOpenFilter();
                }
              }}
              className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all shadow-soft-sm active:scale-95 cursor-pointer ${isFilterOpen || activeFilterCount > 0
                  ? 'border-[#1B2E79] bg-[#EEF3FF] text-[#1B2E79]'
                  : 'border-[#EEEEF2] bg-[#FAF9FC] text-[#1F1F1F] hover:bg-[#EEF3FF] hover:text-[#1B2E79]'
                }`}
              aria-expanded={isFilterOpen}
              aria-label="Toggle Filter Options"
            >
              <Filter className="h-4 w-4 text-[#1B2E79]" />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1B2E79] text-[10px] font-bold text-white shadow-xs">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Backing Backdrop for Dismissal */}
            {isFilterOpen && (
              <div
                className="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs sm:bg-transparent"
                onClick={() => setIsFilterOpen(false)}
              />
            )}

            {/* FLOATING FILTER POPOVER */}
            {isFilterOpen && (
              <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto right-3 sm:right-0 top-20 sm:top-full mt-2 z-50 w-auto sm:w-[420px] md:w-[440px] h-auto max-h-[85vh] flex flex-col rounded-2xl border border-[#EEEEF2] bg-white shadow-2xl shadow-blue-950/15 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Popover Header */}
                <div className="flex items-center justify-between border-b border-[#EEEEF2] p-4 bg-white shrink-0">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-[#1B2E79]" />
                    <h3 className="text-sm font-bold text-[#1F1F1F]">Filter Orders</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFilterOpen(false)}
                    className="rounded-lg p-1 text-[#6B6B6B] hover:bg-[#FAF9FC] hover:text-[#1F1F1F] transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Popover Scrollable Body: Expandable Accordion Cards & Date Picker */}
                <div className="max-h-[55vh] overflow-y-auto p-4 space-y-3 bg-[#FAF9FC]/50">
                  {/* DATE RANGE FILTER (Matches Reference Screenshot) */}
                  <div className="rounded-xl border border-[#EEEEF2] bg-white p-3.5 shadow-soft-xs space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#1F1F1F] flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-[#1B2E79]" />
                        Date Range
                      </label>
                      {draftFromDate && draftToDate ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-[#1B2E79] font-semibold bg-[#EEF3FF] px-2 py-0.5 rounded-full">
                            {draftFromDate === draftToDate
                              ? formatDisplayDate(draftFromDate)
                              : `${getRangeDaysCount(draftFromDate, draftToDate)} days selected`}
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

                    {/* Quick Range Presets (3 columns, 6 buttons) */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {DATE_PRESET_OPTIONS.map((p) => {
                        const isSelected = activePreset === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => applyPreset(p.id)}
                            className={`rounded-xl py-2 px-2 text-[11px] font-semibold border transition-all text-center cursor-pointer flex items-center justify-center gap-1 active:scale-95 ${
                              isSelected
                                ? 'bg-[#1B2E79] text-white border-[#1B2E79] shadow-soft-xs ring-2 ring-[#1B2E79]/25 font-bold'
                                : 'bg-[#FAF9FC] text-[#4B5563] border-[#EEEEF2] hover:bg-[#EEF3FF] hover:text-[#1B2E79] hover:border-[#C4D9FD]'
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3 text-white shrink-0" />}
                            <span>{p.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Date Selection Area */}
                    {draftFromDate && draftToDate ? (
                      <div
                        onClick={() => setIsCalendarOpen((prev) => !prev)}
                        className="flex items-center justify-between rounded-xl bg-[#FAF9FC] p-2.5 border border-[#EEEEF2] text-xs cursor-pointer hover:border-[#C4D9FD] transition-colors"
                        title="Click to toggle calendar"
                      >
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span className="font-bold text-[#1F1F1F]">{formatDisplayDate(draftFromDate)}</span>
                          <span className="text-[#8C8C8C] font-sans">to</span>
                          <span className="font-bold text-[#1F1F1F]">{formatDisplayDate(draftToDate)}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-[#1B2E79] bg-[#EEF3FF] px-2 py-0.5 rounded-full capitalize">
                          {activePreset && activePreset !== 'custom'
                            ? DATE_PRESET_OPTIONS.find((p) => p.id === activePreset)?.label || 'Preset'
                            : `${getRangeDaysCount(draftFromDate, draftToDate)} days selected`}
                        </span>
                      </div>
                    ) : draftFromDate && !draftToDate ? (
                      <div
                        onClick={() => setIsCalendarOpen(true)}
                        className="flex items-center justify-between rounded-xl bg-[#EEF3FF]/50 p-2.5 border border-[#C4D9FD] text-xs cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span className="font-bold text-[#1B2E79]">{formatDisplayDate(draftFromDate)}</span>
                          <span className="text-[#6B6B6B] font-sans">→ Select end date on calendar</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
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
                      <div
                        onClick={() => setIsCalendarOpen((prev) => !prev)}
                        className="flex items-center justify-between rounded-xl bg-[#FAF9FC] p-2.5 border border-dashed border-[#C4D9FD] text-xs text-[#6B6B6B] cursor-pointer hover:border-[#1B2E79] transition-colors"
                        title="Click to open calendar"
                      >
                        <span className="text-[11px]">No date range selected (shows all dates)</span>
                        <span className="text-[10px] font-semibold text-[#1B2E79] bg-[#EEF3FF] px-2 py-0.5 rounded-full">
                          Optional
                        </span>
                      </div>
                    )}

                    {/* Custom Calendar Month Widget */}
                    {isCalendarOpen && (
                      <div className="rounded-xl border border-[#EEEEF2] bg-white p-3 space-y-2.5 animate-in fade-in duration-150">
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
                          {(() => {
                            const maxDate = new Date();
                            maxDate.setDate(maxDate.getDate() + 4);
                            const isCurrentMonthOrFuture =
                              calendarMonth.getFullYear() > maxDate.getFullYear() ||
                              (calendarMonth.getFullYear() === maxDate.getFullYear() && calendarMonth.getMonth() >= maxDate.getMonth());
                            return (
                              <button
                                type="button"
                                disabled={isCurrentMonthOrFuture}
                                onClick={() => {
                                  if (!isCurrentMonthOrFuture) {
                                    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
                                  }
                                }}
                                className={`p-1 rounded-lg transition-colors ${
                                  isCurrentMonthOrFuture
                                    ? 'text-[#C0C0C0] opacity-30 cursor-not-allowed'
                                    : 'hover:bg-[#FAF9FC] text-[#6B6B6B] hover:text-[#1F1F1F] cursor-pointer'
                                }`}
                                title={isCurrentMonthOrFuture ? 'Future dates beyond 4 days are disabled' : 'Next Month'}
                              >
                                <ChevronRight className="h-4 w-4" />
                              </button>
                            );
                          })()}
                        </div>

                        {/* Weekday headers matching reference screenshot */}
                        <div className="grid grid-cols-7 text-center text-[10px] font-bold text-[#8C8C8C] uppercase">
                          <div>SU</div>
                          <div>MO</div>
                          <div>TU</div>
                          <div>WE</div>
                          <div>TH</div>
                          <div>FR</div>
                          <div>SA</div>
                        </div>

                        {/* Month Days Grid with future dates disabled */}
                        <div className="grid grid-cols-7 gap-y-1 justify-items-center">
                          {renderCalendarDays()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 1. Operating Area (areaName) */}
                  <div className="rounded-xl border border-[#EEEEF2] bg-white overflow-hidden shadow-soft-xs">
                    <button
                      type="button"
                      onClick={() => toggleSection('area')}
                      className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-[#1F1F1F] hover:bg-[#FAF9FC] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-[#1B2E79]" />
                        <span>Operating Area</span>
                        {draftArea && draftArea !== 'ALL' && draftArea !== 'All Areas' && (
                          <span className="text-[10px] font-semibold text-[#1B2E79] bg-[#EEF3FF] px-2 py-0.5 rounded-full">
                            {draftArea}
                          </span>
                        )}
                      </div>
                      {expandedSections.area ? (
                        <ChevronUp className="h-4 w-4 text-[#1B2E79]" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-[#6B6B6B]" />
                      )}
                    </button>

                    {expandedSections.area && (
                      <div className="px-3.5 pb-3.5 pt-1 border-t border-[#EEEEF2] space-y-1.5">
                        {/* "Haatza_corp" (Default / All Areas) option */}
                        <button
                          type="button"
                          onClick={() => setDraftArea('Haatza_corp')}
                          className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-xs transition-colors cursor-pointer ${
                            !draftArea || draftArea === 'Haatza_corp' || draftArea === 'ALL' || draftArea === 'All Areas'
                              ? 'bg-[#EEF3FF] text-[#1B2E79] font-bold'
                              : 'text-[#1F1F1F] hover:bg-[#FAF9FC]'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-blue-500" />
                            <span>Haatza Corp (All Areas)</span>
                          </div>
                          {(!draftArea || draftArea === 'Haatza_corp' || draftArea === 'ALL' || draftArea === 'All Areas') && (
                            <Check className="h-3.5 w-3.5 text-[#1B2E79]" />
                          )}
                        </button>

                        {availableAreaOptions.length === 0 ? (
                          <div className="py-2 px-2 text-xs text-[#6B6B6B]">
                            No accessible areas available
                          </div>
                        ) : (
                          availableAreaOptions.map((areaName) => (
                            <button
                              key={areaName}
                              type="button"
                              onClick={() => setDraftArea(areaName)}
                              className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-xs transition-colors cursor-pointer ${
                                draftArea === areaName
                                  ? 'bg-[#EEF3FF] text-[#1B2E79] font-bold'
                                  : 'text-[#1F1F1F] hover:bg-[#FAF9FC]'
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-[#1B2E79]" />
                                <span>{areaName}</span>
                              </div>
                              {draftArea === areaName && <Check className="h-3.5 w-3.5 text-[#1B2E79]" />}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* 2. Booking Status (bookingStatus) */}
                  <div className="rounded-xl border border-[#EEEEF2] bg-white overflow-hidden shadow-soft-xs">
                    <button
                      type="button"
                      onClick={() => toggleSection('status')}
                      className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-[#1F1F1F] hover:bg-[#FAF9FC] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span>Booking Status</span>
                        {draftStatus && draftStatus !== 'ALL' && (
                          <span className="text-[10px] font-semibold text-[#1B2E79] bg-[#EEF3FF] px-2 py-0.5 rounded-full">
                            {draftStatus}
                          </span>
                        )}
                      </div>
                      {expandedSections.status ? (
                        <ChevronUp className="h-4 w-4 text-[#1B2E79]" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-[#6B6B6B]" />
                      )}
                    </button>

                    {expandedSections.status && (
                      <div className="px-3.5 pb-3.5 pt-1 border-t border-[#EEEEF2] space-y-1.5">
                        <button
                          type="button"
                          onClick={() => setDraftStatus('ALL')}
                          className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-xs transition-colors cursor-pointer ${draftStatus === 'ALL' || draftStatus === ''
                              ? 'bg-[#EEF3FF] text-[#1B2E79] font-bold'
                              : 'text-[#1F1F1F] hover:bg-[#FAF9FC]'
                            }`}
                        >
                          <span>All Statuses</span>
                          {(draftStatus === 'ALL' || draftStatus === '') && <Check className="h-3.5 w-3.5 text-[#1B2E79]" />}
                        </button>
                        {STATIC_BOOKING_STATUSES.map((st) => {
                          const isSelected =
                            draftStatus.toLowerCase() === st.id.toLowerCase() ||
                            (st.id === 'Ongoing' && (draftStatus === 'Ongoing' || draftStatus === 'In Progress'));
                          return (
                            <button
                              key={st.id}
                              type="button"
                              onClick={() => setDraftStatus(st.id)}
                              className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-xs transition-colors cursor-pointer ${isSelected
                                  ? 'bg-[#EEF3FF] text-[#1B2E79] font-bold'
                                  : 'text-[#1F1F1F] hover:bg-[#FAF9FC]'
                                }`}
                            >
                              <span>{st.label}</span>
                              {isSelected && <Check className="h-3.5 w-3.5 text-[#1B2E79]" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 3. Booking Type / Service (bookingType: instant / schedule) */}
                  <div className="rounded-xl border border-[#EEEEF2] bg-white overflow-hidden shadow-soft-xs">
                    <button
                      type="button"
                      onClick={() => toggleSection('bookingType')}
                      className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-[#1F1F1F] hover:bg-[#FAF9FC] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span>Service / Booking Type</span>
                        {draftBookingType && draftBookingType !== 'ALL' && (
                          <span className="text-[10px] font-semibold text-[#1B2E79] bg-[#EEF3FF] px-2 py-0.5 rounded-full capitalize">
                            {draftBookingType === 'scheduled' ? 'Schedule' : draftBookingType}
                          </span>
                        )}
                      </div>
                      {expandedSections.bookingType ? (
                        <ChevronUp className="h-4 w-4 text-[#1B2E79]" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-[#6B6B6B]" />
                      )}
                    </button>

                    {expandedSections.bookingType && (
                      <div className="px-3.5 pb-3.5 pt-1 border-t border-[#EEEEF2] space-y-1.5">
                        <button
                          type="button"
                          onClick={() => setDraftBookingType('ALL')}
                          className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-xs transition-colors cursor-pointer ${draftBookingType === 'ALL' || draftBookingType === ''
                              ? 'bg-[#EEF3FF] text-[#1B2E79] font-bold'
                              : 'text-[#1F1F1F] hover:bg-[#FAF9FC]'
                            }`}
                        >
                          <span>All Types</span>
                          {(draftBookingType === 'ALL' || draftBookingType === '') && <Check className="h-3.5 w-3.5 text-[#1B2E79]" />}
                        </button>
                        {STATIC_BOOKING_TYPES.map((type) => (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => setDraftBookingType(type.id)}
                            className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-xs transition-colors cursor-pointer ${draftBookingType.toLowerCase() === type.id.toLowerCase()
                                ? 'bg-[#EEF3FF] text-[#1B2E79] font-bold'
                                : 'text-[#1F1F1F] hover:bg-[#FAF9FC]'
                              }`}
                          >
                            <span>{type.label}</span>
                            {draftBookingType.toLowerCase() === type.id.toLowerCase() && <Check className="h-3.5 w-3.5 text-[#1B2E79]" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 4. SLA Risk Alert (slaAlert) */}
                  <div className="rounded-xl border border-[#EEEEF2] bg-white overflow-hidden shadow-soft-xs">
                    <button
                      type="button"
                      onClick={() => toggleSection('sla')}
                      className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-[#1F1F1F] hover:bg-[#FAF9FC] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                        <span>SLA Alert</span>
                        {draftSlaAlert && draftSlaAlert !== 'ALL' && (
                          <span className="text-[10px] font-semibold text-[#B42318] bg-[#FEF2F2] border border-rose-200 px-2 py-0.5 rounded-full">
                            {draftSlaAlert}
                          </span>
                        )}
                      </div>
                      {expandedSections.sla ? (
                        <ChevronUp className="h-4 w-4 text-[#1B2E79]" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-[#6B6B6B]" />
                      )}
                    </button>

                    {expandedSections.sla && (
                      <div className="px-3.5 pb-3.5 pt-1 border-t border-[#EEEEF2] space-y-1.5">
                        <button
                          type="button"
                          onClick={() => setDraftSlaAlert('ALL')}
                          className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-xs transition-colors cursor-pointer ${draftSlaAlert === 'ALL' || draftSlaAlert === ''
                              ? 'bg-[#EEF3FF] text-[#1B2E79] font-bold'
                              : 'text-[#1F1F1F] hover:bg-[#FAF9FC]'
                            }`}
                        >
                          <span>All Delivery Alerts</span>
                          {(draftSlaAlert === 'ALL' || draftSlaAlert === '') && <Check className="h-3.5 w-3.5 text-[#1B2E79]" />}
                        </button>
                        {STATIC_SLA_ALERTS.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setDraftSlaAlert(item.id)}
                            className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-xs transition-colors cursor-pointer ${draftSlaAlert === item.id
                                ? 'bg-[#EEF3FF] text-[#1B2E79] font-bold'
                                : 'text-[#1F1F1F] hover:bg-[#FAF9FC]'
                              }`}
                          >
                            <span>{item.label}</span>
                            {draftSlaAlert === item.id && <Check className="h-3.5 w-3.5 text-[#1B2E79]" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 5. Duration (duration) */}
                  <div className="rounded-xl border border-[#EEEEF2] bg-white overflow-hidden shadow-soft-xs">
                    <button
                      type="button"
                      onClick={() => toggleSection('duration')}
                      className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-[#1F1F1F] hover:bg-[#FAF9FC] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-[#1B2E79]" />
                        <span>Duration</span>
                        {draftDuration && (
                          <span className="text-[10px] font-semibold text-[#1B2E79] bg-[#EEF3FF] px-2 py-0.5 rounded-full">
                            {formatDurationInHours(draftDuration)}
                          </span>
                        )}
                      </div>
                      {expandedSections.duration ? (
                        <ChevronUp className="h-4 w-4 text-[#1B2E79]" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-[#6B6B6B]" />
                      )}
                    </button>

                    {expandedSections.duration && (
                      <div className="px-3.5 pb-3.5 pt-1 border-t border-[#EEEEF2] space-y-1.5">
                        <button
                          type="button"
                          onClick={() => setDraftDuration('')}
                          className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-xs transition-colors cursor-pointer ${!draftDuration
                              ? 'bg-[#EEF3FF] text-[#1B2E79] font-bold'
                              : 'text-[#1F1F1F] hover:bg-[#FAF9FC]'
                            }`}
                        >
                          <span>All Durations</span>
                          {!draftDuration && <Check className="h-3.5 w-3.5 text-[#1B2E79]" />}
                        </button>
                        {STATIC_DURATIONS.map((d) => (
                          <button
                            key={d.val}
                            type="button"
                            onClick={() => setDraftDuration(d.val)}
                            className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-xs transition-colors cursor-pointer ${draftDuration === d.val
                                ? 'bg-[#EEF3FF] text-[#1B2E79] font-bold'
                                : 'text-[#1F1F1F] hover:bg-[#FAF9FC]'
                              }`}
                          >
                            <span>{d.label}</span>
                            {draftDuration === d.val && <Check className="h-3.5 w-3.5 text-[#1B2E79]" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

                {/* Popover Footer */}
                <div className="border-t border-[#EEEEF2] bg-white p-3.5 flex items-center justify-between gap-3 shrink-0 rounded-b-2xl">
                  <button
                    type="button"
                    onClick={handleClearAllPopoverFilters}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#B42318] hover:text-white px-3.5 py-2 rounded-xl border border-rose-200 bg-[#FEF2F2] hover:bg-[#B42318] transition-all shadow-soft-xs cursor-pointer active:scale-95"
                    title="Clear all filters and reset"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Clear All</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyFilter}
                    className="flex items-center gap-1.5 rounded-xl bg-[#1B2E79] hover:bg-[#13225C] text-white px-5 py-2.5 text-xs font-bold shadow-soft-sm hover:shadow-soft-md active:scale-95 transition-all cursor-pointer"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Active Applied Filter Chips */}
        {(activeFilterCount > 0 || Boolean(selectedArea)) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#EEEEF2]">
            <span className="text-[11px] font-semibold text-[#6B6B6B]">Applied:</span>

            {/* Operating Area indicator if customized from default Haatza_corp */}
            {selectedArea && selectedArea !== 'Haatza_corp' && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#EEF3FF] border border-[#C4D9FD] px-2.5 py-0.5 text-[11px] font-semibold text-[#1B2E79]">
                <MapPin className="h-3 w-3" />
                Area: {selectedArea}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedArea('Haatza_corp');
                    setDraftArea('Haatza_corp');
                    setPage(1);
                  }}
                  className="hover:text-rose-600 transition-colors cursor-pointer"
                  title="Reset to default area"
                  aria-label="Reset to default area"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {/* Status chip */}
            {selectedStatus && selectedStatus !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#FAF9FC] border border-[#C4D9FD] px-2.5 py-0.5 text-[11px] font-semibold text-[#1B2E79]">
                Status: {selectedStatus === 'In Progress' ? 'Ongoing' : selectedStatus}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStatus('');
                    setDraftStatus('');
                    setPage(1);
                  }}
                  className="hover:text-rose-600 transition-colors cursor-pointer"
                  title="Remove Status filter"
                  aria-label="Remove Status filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {/* Booking Type chip */}
            {selectedBookingType && selectedBookingType !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#FAF9FC] border border-[#C4D9FD] px-2.5 py-0.5 text-[11px] font-semibold text-[#1B2E79]">
                Type: {selectedBookingType === 'scheduled' ? 'Schedule' : selectedBookingType}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBookingType('');
                    setDraftBookingType('');
                    setPage(1);
                  }}
                  className="hover:text-rose-600 transition-colors cursor-pointer"
                  title="Remove Type filter"
                  aria-label="Remove Type filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {/* SLA Alert chip */}
            {selectedSlaAlert && selectedSlaAlert !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#FEF2F2] border border-rose-200 px-2.5 py-0.5 text-[11px] font-semibold text-[#B42318]">
                SLA: {selectedSlaAlert}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSlaAlert('');
                    setDraftSlaAlert('');
                    setPage(1);
                  }}
                  className="hover:text-rose-800 transition-colors cursor-pointer"
                  title="Remove SLA filter"
                  aria-label="Remove SLA filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {/* Date Range chip */}
            {fromDate && toDate && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#FAF9FC] border border-[#C4D9FD] px-2.5 py-0.5 text-[11px] font-semibold text-[#1B2E79]">
                <Calendar className="h-3 w-3 text-[#1B2E79]" />
                <span>
                  {fromDate === toDate
                    ? formatDisplayDate(fromDate)
                    : `${formatDisplayDate(fromDate)} → ${formatDisplayDate(toDate)}`}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFromDate('');
                    setToDate('');
                    setDraftFromDate('');
                    setDraftToDate('');
                    setActivePreset(null);
                    setCalendarStep('start');
                    setPage(1);
                  }}
                  className="hover:text-rose-600 transition-colors cursor-pointer"
                  title="Remove Date filter"
                  aria-label="Remove Date filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {/* Duration chip */}
            {selectedDuration && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#FAF9FC] border border-[#C4D9FD] px-2.5 py-0.5 text-[11px] font-semibold text-[#1B2E79]">
                Duration: {formatDurationInHours(selectedDuration)}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDuration('');
                    setDraftDuration('');
                    setPage(1);
                  }}
                  className="hover:text-rose-600 transition-colors cursor-pointer"
                  title="Remove Duration filter"
                  aria-label="Remove Duration filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-[#EEEEF2] bg-white p-6 shadow-soft-sm space-y-4">
            <div className="h-5 w-48 bg-[#EEF3FF] animate-pulse rounded-lg" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((idx) => (
                <div key={idx} className="h-12 w-full bg-[#FAF9FC] animate-pulse rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error View with Retry */}
      {!isLoading && error && (
        <div className="rounded-2xl border border-rose-200 bg-[#FEF2F2] p-8 text-center shadow-soft-sm space-y-3">
          <AlertCircle className="h-8 w-8 text-[#B42318] mx-auto" />
          <h3 className="text-sm font-bold text-[#B42318]">{error}</h3>
          <p className="text-xs text-[#6B6B6B] max-w-md mx-auto">
            Unable to fetch real-time booking records from the dispatch engine for {selectedArea}. Please check your network connection and retry.
          </p>
          <button
            type="button"
            onClick={() => fetchOrders({
              areaName: selectedArea || 'Haatza_corp',
              bookingStatus: selectedStatus || undefined,
              slaAlert: selectedSlaAlert || undefined,
              bookingType: selectedBookingType || undefined,
              fromDate: fromDate || undefined,
              toDate: toDate || undefined,
            }, page, false)}
            className="rounded-xl bg-[#B42318] hover:bg-rose-800 text-white px-5 py-2 text-xs font-semibold shadow-soft-sm transition-all active:scale-95 cursor-pointer"
          >
            Retry Loading Orders
          </button>
        </div>
      )}

      {/* Desktop View: Data Table (Hidden on small screens) */}
      {!isLoading && !error && (
        <div className="hidden md:block">
          <DataTable
            columns={columns}
            data={paginatedBookings}
            keyExtractor={(b) => b.bookingId || b.id}
            rowClassName={(b) => getBookingRowStyle(b).rowClass}
            emptyTitle="No orders found"
            emptyDescription={
              search.trim()
                ? `No orders matching "${search}" in ${selectedArea}. Try another search term or area.`
                : `No orders located for area ${selectedArea}. Try adjusting filters or selecting another area.`
            }
          />
        </div>
      )}

      {/* Mobile View: Dedicated Order Cards (Shown on mobile & small tablets) */}
      {!isLoading && !error && (
        <div className="block md:hidden space-y-3">
          {filteredBookings.length === 0 ? (
            <div className="rounded-2xl border border-[#EEEEF2] bg-white p-8 text-center shadow-soft-sm">
              <h3 className="text-sm font-bold text-[#1F1F1F]">No orders found</h3>
              <p className="text-xs text-[#6B6B6B] mt-1">
                {search.trim()
                  ? `No orders matching "${search}" in ${selectedArea}.`
                  : 'Try selecting another area or adjusting your filters.'}
              </p>
            </div>
          ) : (
            paginatedBookings.map((b) => {
              let statusValue = b.bookingStatus || b.status;
              if (statusValue === 'In Progress' || statusValue === 'in progress') {
                statusValue = 'Ongoing';
              }
              const isSlaRisk = statusValue === 'SLA Risk' || b.slaAlert === 'SLA Risk';
              const showAssign = canAssignExpert(b);
              const custName = b.customerName || b.customer?.name || b.vendorName || '—';
              const custPhone = b.customerPhone || b.customer?.phone || '';
              const amountVal = b.totalAmount !== undefined && b.totalAmount !== '' ? b.totalAmount : b.amount;
              const { dateStr, timeStr } = formatScheduledDateTime(b.requestedTime, b.date, b.startTime);
              const durationHours = formatDurationInHours(b.duration || b.durationMinutes);
              const rawType = (b.bookingType || b.service || 'Instant').toLowerCase();
              const displayType = rawType === 'scheduled' || rawType === 'schedule' ? 'Scheduled' : 'Instant';
              const rowStyle = getBookingRowStyle(b);

              return (
                <div
                  key={b.bookingId || b.id}
                  className={`rounded-2xl border p-3 sm:p-3.5 shadow-soft-sm transition-all space-y-2 w-full max-w-full overflow-hidden ${rowStyle.cardClass}`}
                >
                  {/* Card Header: Booking ID + Status */}
                  <div className="flex items-center justify-between gap-2 border-b border-[#EEEEF2] pb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-sm font-bold text-[#1F1F1F] shrink-0">
                        #{b.bookingId || b.id}
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[#1B2E79] bg-[#EEF3FF] px-2 py-0.5 rounded-lg truncate">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{b.areaName || b.areaId || selectedArea}</span>
                      </span>
                    </div>
                    <div className="shrink-0">
                      <StatusBadge status={statusValue} size="sm" pulse={isSlaRisk} />
                    </div>
                  </div>

                  {/* Service & Customer Info */}
                  <div className="space-y-0.5">
                    <div className="text-sm font-semibold text-[#1F1F1F] flex items-center justify-between">
                      <span className="font-bold text-[#1B2E79]">{displayType}</span>
                      <span className="font-mono text-xs font-bold text-[#1B2E79]">
                        {amountVal && amountVal !== '—' ? `₹${amountVal}` : '—'}
                      </span>
                    </div>
                    <div className="text-xs text-[#6B6B6B] flex items-center justify-between">
                      <span className="truncate">{custName}</span>
                      {custPhone && custPhone !== '—' && (
                        <span className="font-mono text-[11px] shrink-0 ml-2">{custPhone}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#6B6B6B] truncate">{b.address}</p>
                  </div>

                  {/* Key Metrics Row: Slot, Duration, SLA */}
                  <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-white/70 p-2 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-[#6B6B6B] block">Slot</span>
                      <span className="font-mono font-semibold text-[#1F1F1F] text-[11px] block truncate">
                        {dateStr}
                      </span>
                      <span className="font-mono text-[10px] text-[#6B6B6B] block truncate">
                        {timeStr}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#6B6B6B] block">Duration</span>
                      <span className="font-mono font-bold text-[11px] text-[#1F1F1F] block">
                        {durationHours}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#6B6B6B] block">SLA</span>
                      <span className={`font-mono text-[11px] font-semibold block ${isSlaRisk ? 'text-[#B42318] font-bold animate-pulse' : 'text-[#1F1F1F]'}`}>
                        {b.slaTimer || '—'}
                      </span>
                    </div>
                  </div>

                  {/* Card Actions: Eye icon only (no text) + Assign Expert button */}
                  <div className="flex items-center justify-between pt-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setInspectBooking(b)}
                      title="Inspect Details"
                      aria-label="Inspect Details"
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] text-[#1B2E79] hover:bg-[#EEF3FF] transition-colors cursor-pointer shrink-0"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {showAssign && (
                      <button
                        type="button"
                        onClick={() => setAssignBooking(b)}
                        className="rounded-xl bg-[#1B2E79] hover:bg-[#13225C] text-white px-3 py-1.5 text-xs font-semibold shadow-soft-sm transition-all active:scale-95 cursor-pointer"
                      >
                        {((b.bookingStatus || b.status) === 'Assigned' || Boolean(b.vendorId || b.vendorName))
                          ? 'Reassign Expert'
                          : 'Assign Expert'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Dynamic Server-Side Pagination Controls (20 bookings per page) */}
      {!isLoading && !error && pagination.totalCount > 0 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalRecords={pagination.totalCount}
          pageSize={PAGE_SIZE}
          hasNextPage={pagination.hasNextPage}
          hasPreviousPage={pagination.hasPreviousPage}
          onPageChange={(newPage) => {
            if (isLoading || isRefreshing || isFetchingRef.current || newPage === pagination.page) return;
            setPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          isLoading={isLoading || isRefreshing}
          recordLabel="bookings"
        />
      )}

      {/* Inspect Drawer (Opens on eye icon) */}
      <BookingDetailDrawer
        booking={inspectBooking}
        isOpen={Boolean(inspectBooking)}
        onClose={() => setInspectBooking(null)}
        onOrderCancelled={(cancelledId) => {
          setOrders((prev) =>
            prev.map((b) =>
              (b.tableId === cancelledId || b.id === cancelledId || b.bookingId === cancelledId)
                ? { ...b, bookingStatus: 'Cancelled', status: 'Cancelled' }
                : b
            )
          );
          if (inspectBooking && (inspectBooking.tableId === cancelledId || inspectBooking.id === cancelledId || inspectBooking.bookingId === cancelledId)) {
            setInspectBooking((prev) => prev ? { ...prev, bookingStatus: 'Cancelled', status: 'Cancelled' } : null);
          }
          fetchOrders({
            areaName: selectedArea || 'Haatza_corp',
            bookingStatus: selectedStatus || undefined,
            slaAlert: selectedSlaAlert || undefined,
            bookingType: selectedBookingType || undefined,
            fromDate: fromDate || undefined,
            toDate: toDate || undefined,
          }, page, false);
        }}
      />

      {/* Assign Expert Modal (Uses tableId to fetch available experts from nestAvailableExperts) */}
      <AssignWorkerModal
        booking={assignBooking}
        isOpen={Boolean(assignBooking)}
        onClose={() => setAssignBooking(null)}
        onAssignSuccess={(updatedBooking) => {
          setOrders((prev) =>
            prev.map((b) =>
              b.tableId === updatedBooking.tableId
                ? {
                  ...b,
                  vendorId: updatedBooking.vendorId,
                  vendorName: updatedBooking.vendorName,
                  vendorPhoto: updatedBooking.vendorPhoto,
                  bookingStatus: 'Assigned',
                  status: 'Assigned',
                }
                : b
            )
          );
        }}
      />
    </div>
  );
};
