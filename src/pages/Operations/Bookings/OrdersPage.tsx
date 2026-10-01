import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useOperations } from '../../../context/OperationsContext';
import { Booking } from '../../../types';
import { DataTable, Column } from '../../../components/common/DataTable';
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
  ChevronRight
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

export const OrdersPage: React.FC = () => {
  const { markets } = useOperations();

  // Active Areas fetched dynamically from https://www.haatza.com/_functions/nestActiveAreas?page=1&pageSize=10
  const [activeAreas, setActiveAreas] = useState<ActiveAreaItem[]>([]);
  const [isLoadingAreas, setIsLoadingAreas] = useState<boolean>(true);

  // Server-side filter parameters
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedSlaAlert, setSelectedSlaAlert] = useState<string>('');
  const [selectedBookingType, setSelectedBookingType] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<string>('');

  const [page, setPage] = useState<number>(1);

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
  const [draftArea, setDraftArea] = useState<string>('');
  const [draftStatus, setDraftStatus] = useState<string>('');
  const [draftSlaAlert, setDraftSlaAlert] = useState<string>('');
  const [draftBookingType, setDraftBookingType] = useState<string>('');
  const [draftDuration, setDraftDuration] = useState<string>('');

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

  // Fetch active areas dynamically from API on mount
  // API: https://www.haatza.com/_functions/nestActiveAreas?page=1&pageSize=10
  useEffect(() => {
    setIsLoadingAreas(true);
    getActiveAreas(1, 10)
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          // Strictly dynamic data from the API only - no hardcoded/static entries
          setActiveAreas(res.data);
          const firstArea = res.data[0].areaName;
          setSelectedArea((prev) => prev || firstArea);
          setDraftArea((prev) => prev || firstArea);
        }
      })
      .catch((err) => console.error('Failed to load active areas:', err))
      .finally(() => setIsLoadingAreas(false));
  }, []);

  // Fetch orders from centralized API using the server-side query filters
  const fetchOrders = useCallback(async (
    filters: {
      areaName?: string;
      bookingStatus?: string;
      slaAlert?: string;
      bookingType?: string;
      duration?: string;
      bookingId?: string;
      customerPhone?: string;
    },
    isSilent: boolean = false
  ) => {
    const areaToFetch = filters.areaName || selectedArea;
    if (!areaToFetch && !filters.bookingId && !filters.customerPhone) return;

    if (!isSilent) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      const apiFilterOpts: GetBookingsFilterOptions = {
        limit: 100, // Fetch up to 100 bookings so client search and 20/page pagination cover all records
      };

      if (filters.bookingId) {
        apiFilterOpts.bookingId = filters.bookingId.replace(/^#/, '').trim();
      } else if (filters.customerPhone) {
        apiFilterOpts.customerPhone = filters.customerPhone.trim();
      } else if (areaToFetch) {
        apiFilterOpts.areaName = areaToFetch;
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
      if (filters.duration) {
        apiFilterOpts.duration = filters.duration;
      }

      const response = await getBookings(apiFilterOpts);
      if (response.success && Array.isArray(response.data)) {
        const mapped = response.data.map(mapApiBookingToBooking);
        setOrders(mapped);
        setLastRefreshedAt(new Date());
      } else {
        setError(response.error || 'Unable to load orders. Please try again.');
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError('Unable to load orders. Please check your internet connection.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedArea]);

  // Trigger load when filter dependencies change
  useEffect(() => {
    if (selectedArea) {
      fetchOrders({
        areaName: selectedArea,
        bookingStatus: selectedStatus || undefined,
        slaAlert: selectedSlaAlert || undefined,
        bookingType: selectedBookingType || undefined,
        duration: selectedDuration || undefined,
      }, false);
    }
  }, [fetchOrders, selectedArea, selectedStatus, selectedSlaAlert, selectedBookingType, selectedDuration]);

  // Track the last minute we refreshed at (initialized to the current minute on mount)
  const lastRefreshedMinuteRef = useRef<number>(new Date().getMinutes());

  // Requirement: Auto-refresh every 1 minute (60 seconds) without manual refreshment
  // Use a ref to always have access to the latest filter values without resetting the interval
  const autoRefreshRef = useRef<() => void>(() => { });
  useEffect(() => {
    autoRefreshRef.current = () => {
      if (selectedArea && !isLoading && !isRefreshing) {
        fetchOrders({
          areaName: selectedArea,
          bookingStatus: selectedStatus || undefined,
          slaAlert: selectedSlaAlert || undefined,
          bookingType: selectedBookingType || undefined,
          duration: selectedDuration || undefined,
        }, true);
      }
    };
  }, [fetchOrders, selectedArea, selectedStatus, selectedSlaAlert, selectedBookingType, selectedDuration, isLoading, isRefreshing]);

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

  // Open Popover and sync drafts with applied state (always closed by default)
  const handleOpenFilter = () => {
    setDraftArea(selectedArea);
    setDraftStatus(selectedStatus);
    setDraftSlaAlert(selectedSlaAlert);
    setDraftBookingType(selectedBookingType);
    setDraftDuration(selectedDuration);
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
    setPage(1);
    setIsFilterOpen(false);
  };

  // Clear all static filters (retains current selected area)
  const handleRemoveFilters = () => {
    setSelectedStatus('');
    setSelectedSlaAlert('');
    setSelectedBookingType('');
    setSelectedDuration('');
    setDraftStatus('');
    setDraftSlaAlert('');
    setDraftBookingType('');
    setDraftDuration('');
    setSearch('');
    setPage(1);
  };

  // Count active filters (excluding search and area)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedStatus && selectedStatus !== 'ALL' && selectedStatus !== '') count++;
    if (selectedSlaAlert && selectedSlaAlert !== 'ALL' && selectedSlaAlert !== '') count++;
    if (selectedBookingType && selectedBookingType !== 'ALL' && selectedBookingType !== '') count++;
    if (selectedDuration) count++;
    return count;
  }, [selectedStatus, selectedSlaAlert, selectedBookingType, selectedDuration]);

  // Comprehensive, multi-field search: Booking ID (with or without #), Customer Name/Email/Phone (formatted & raw digits), Vendor Name/ID, Service, Address, Area
  const filteredBookings = useMemo(() => {
    if (!search.trim()) return orders;

    const qRaw = search.trim().toLowerCase();
    const qClean = qRaw.replace(/^#/, '').trim();
    const qDigits = qRaw.replace(/\D/g, '');

    return orders.filter((b) => {
      // 1. Booking ID / ID / Table ID (matches with #, without #, or partial)
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

      // 2. Customer Name & Customer Email
      const custName = String(b.customerName || b.customer?.name || '').toLowerCase();
      const custEmail = String(b.customerEmail || b.customer?.email || '').toLowerCase();
      const matchesCust =
        custName.includes(qRaw) ||
        custName.includes(qClean) ||
        custEmail.includes(qRaw);

      // 3. Customer Phone (both formatted string and raw numbers)
      const rawPhone = String(b.customerPhone || b.customer?.phone || '').toLowerCase();
      const phoneDigits = rawPhone.replace(/\D/g, '');
      const matchesPhone =
        rawPhone.includes(qRaw) ||
        rawPhone.includes(qClean) ||
        (qDigits.length >= 3 && phoneDigits.includes(qDigits));

      // 4. Vendor / Expert Name & ID
      const vName = String(b.vendorName || '').toLowerCase();
      const vId = String(b.vendorId || '').toLowerCase();
      const matchesVendor = vName.includes(qRaw) || vId.includes(qRaw);

      // 5. Service Type / Booking Type
      const serv = String(b.service || b.bookingType || '').toLowerCase();
      const matchesServ = serv.includes(qRaw);

      // 6. Address
      const addr = String(b.address || '').toLowerCase();
      const matchesAddr = addr.includes(qRaw);

      // 7. Area Name
      const area = String(b.areaName || b.areaId || '').toLowerCase();
      const matchesArea = area.includes(qRaw);

      // 8. Status (including Ongoing)
      const status = String(b.bookingStatus || b.status || '').toLowerCase();
      const matchesStatus = status.includes(qRaw);

      return matchesId || matchesCust || matchesPhone || matchesVendor || matchesServ || matchesAddr || matchesArea || matchesStatus;
    });
  }, [orders, search]);

  // Pagination for 20 bookings only per page
  const totalPages = Math.ceil(filteredBookings.length / PAGE_SIZE) || 1;
  const safePage = Math.min(Math.max(1, page), totalPages);

  const paginatedBookings = useMemo(() => {
    const startIndex = (safePage - 1) * PAGE_SIZE;
    return filteredBookings.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredBookings, safePage]);

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
      cardClass: 'bg-white border-[#EEEEF2] hover:border-[#5B21B6]/30',
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
                  ? 'bg-[#EDE9FE] text-[#5B21B6] border-[#DDD6FE]'
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
          <span className="inline-flex items-center gap-1 font-mono text-[#5B21B6] font-semibold text-xs bg-[#EDE9FE] px-2 py-0.5 rounded-lg">
            <MapPin className="h-3 w-3 text-[#5B21B6]" />
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
            <span className="font-mono font-bold text-[#5B21B6] block">
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
                className="rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white px-2.5 py-1 text-[11px] font-semibold shadow-soft-sm transition-all active:scale-95 cursor-pointer"
              >
                {isAssigned ? 'Reassign Expert' : 'Assign Expert'}
              </button>
            )}
            <button
              type="button"
              onClick={() => setInspectBooking(b)}
              className="rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-1.5 text-[#6B6B6B] hover:text-[#5B21B6] hover:bg-[#EDE9FE] transition-colors shadow-soft-sm cursor-pointer"
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

      {/* Top Filter Bar: Search Bar on Left; Auto-refresh & Refresh Button on Left beside Filter */}
      <div className="relative z-30 rounded-2xl border border-[#EEEEF2] bg-white p-3 sm:p-4 shadow-soft-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Search Bar */}
          <div className="w-full lg:max-w-md">
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

          {/* Right: Auto-Refresh info + Refresh button (left beside of filters) + Remove Filters + Filter Button */}
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
                areaName: selectedArea,
                bookingStatus: selectedStatus || undefined,
                slaAlert: selectedSlaAlert || undefined,
                bookingType: selectedBookingType || undefined,
                duration: selectedDuration || undefined,
              }, false)}
              disabled={isLoading || isRefreshing}
              className="flex items-center gap-1.5 rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] px-3 py-2 text-xs font-semibold text-[#1F1F1F] hover:text-[#5B21B6] hover:bg-[#EDE9FE] shadow-soft-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Refresh Orders manually"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading || isRefreshing ? 'animate-spin text-[#5B21B6]' : ''}`} />
              <span>Refresh</span>
            </button>

            {/* Remove Filter Button (Visible only when filters or search are active) */}
            {(activeFilterCount > 0 || search.trim().length > 0) && (
              <button
                type="button"
                onClick={handleRemoveFilters}
                className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-[#FEF2F2] px-3 py-2 text-xs font-semibold text-[#B42318] hover:bg-rose-100 transition-all shadow-soft-sm active:scale-95 cursor-pointer"
                title="Remove all active filters and search"
              >
                <X className="h-3.5 w-3.5" />
                <span>Remove Filters</span>
              </button>
            )}

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
                  ? 'border-[#5B21B6] bg-[#EDE9FE] text-[#5B21B6]'
                  : 'border-[#EEEEF2] bg-[#FAF9FC] text-[#1F1F1F] hover:bg-[#EDE9FE] hover:text-[#5B21B6]'
                }`}
              aria-expanded={isFilterOpen}
              aria-label="Toggle Filter Options"
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

            {/* Backing Backdrop for Dismissal */}
            {isFilterOpen && (
              <div
                className="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs sm:bg-transparent"
                onClick={() => setIsFilterOpen(false)}
              />
            )}

            {/* FLOATING FILTER POPOVER */}
            {isFilterOpen && (
              <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto right-3 sm:right-0 top-20 sm:top-full mt-2 z-50 w-auto sm:w-[380px] md:w-[430px] h-auto max-h-[85vh] flex flex-col rounded-2xl border border-[#EEEEF2] bg-white shadow-2xl shadow-purple-950/15 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Popover Header */}
                <div className="flex items-center justify-between border-b border-[#EEEEF2] p-4 bg-white shrink-0">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-[#5B21B6]" />
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

                {/* Popover Scrollable Body: Expandable Accordion Cards */}
                <div className="max-h-[55vh] overflow-y-auto p-4 space-y-3 bg-[#FAF9FC]/50">
                  {/* 1. Operating Area (areaName) */}
                  <div className="rounded-xl border border-[#EEEEF2] bg-white overflow-hidden shadow-soft-xs">
                    <button
                      type="button"
                      onClick={() => toggleSection('area')}
                      className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-[#1F1F1F] hover:bg-[#FAF9FC] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-[#5B21B6]" />
                        <span>Operating Area</span>
                        {draftArea && draftArea !== 'ALL' && (
                          <span className="text-[10px] font-semibold text-[#5B21B6] bg-[#EDE9FE] px-2 py-0.5 rounded-full">
                            {draftArea}
                          </span>
                        )}
                      </div>
                      {expandedSections.area ? (
                        <ChevronUp className="h-4 w-4 text-[#5B21B6]" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-[#6B6B6B]" />
                      )}
                    </button>

                    {expandedSections.area && (
                      <div className="px-3.5 pb-3.5 pt-1 border-t border-[#EEEEF2] space-y-1.5">
                        {isLoadingAreas ? (
                          <div className="flex items-center gap-2 py-2 px-2 text-xs text-[#6B6B6B]">
                            <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#5B21B6]" />
                            <span>Loading active areas from API...</span>
                          </div>
                        ) : activeAreas.length === 0 ? (
                          <div className="py-2 px-2 text-xs text-[#6B6B6B]">
                            No active areas available
                          </div>
                        ) : (
                          activeAreas.map((area) => (
                            <button
                              key={area.areaName}
                              type="button"
                              onClick={() => setDraftArea(area.areaName)}
                              className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-xs transition-colors cursor-pointer ${draftArea === area.areaName
                                  ? 'bg-[#EDE9FE] text-[#5B21B6] font-bold'
                                  : 'text-[#1F1F1F] hover:bg-[#FAF9FC]'
                                }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <span>{area.areaName}</span>
                                {area.city && (
                                  <span className="text-[10px] text-[#6B6B6B]">({area.city})</span>
                                )}
                              </div>
                              {draftArea === area.areaName && <Check className="h-3.5 w-3.5 text-[#5B21B6]" />}
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
                          <span className="text-[10px] font-semibold text-[#5B21B6] bg-[#EDE9FE] px-2 py-0.5 rounded-full">
                            {draftStatus}
                          </span>
                        )}
                      </div>
                      {expandedSections.status ? (
                        <ChevronUp className="h-4 w-4 text-[#5B21B6]" />
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
                              ? 'bg-[#EDE9FE] text-[#5B21B6] font-bold'
                              : 'text-[#1F1F1F] hover:bg-[#FAF9FC]'
                            }`}
                        >
                          <span>All Statuses</span>
                          {(draftStatus === 'ALL' || draftStatus === '') && <Check className="h-3.5 w-3.5 text-[#5B21B6]" />}
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
                                  ? 'bg-[#EDE9FE] text-[#5B21B6] font-bold'
                                  : 'text-[#1F1F1F] hover:bg-[#FAF9FC]'
                                }`}
                            >
                              <span>{st.label}</span>
                              {isSelected && <Check className="h-3.5 w-3.5 text-[#5B21B6]" />}
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
                          <span className="text-[10px] font-semibold text-[#5B21B6] bg-[#EDE9FE] px-2 py-0.5 rounded-full capitalize">
                            {draftBookingType === 'scheduled' ? 'Schedule' : draftBookingType}
                          </span>
                        )}
                      </div>
                      {expandedSections.bookingType ? (
                        <ChevronUp className="h-4 w-4 text-[#5B21B6]" />
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
                              ? 'bg-[#EDE9FE] text-[#5B21B6] font-bold'
                              : 'text-[#1F1F1F] hover:bg-[#FAF9FC]'
                            }`}
                        >
                          <span>All Types</span>
                          {(draftBookingType === 'ALL' || draftBookingType === '') && <Check className="h-3.5 w-3.5 text-[#5B21B6]" />}
                        </button>
                        {STATIC_BOOKING_TYPES.map((type) => (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => setDraftBookingType(type.id)}
                            className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-xs transition-colors cursor-pointer ${draftBookingType.toLowerCase() === type.id.toLowerCase()
                                ? 'bg-[#EDE9FE] text-[#5B21B6] font-bold'
                                : 'text-[#1F1F1F] hover:bg-[#FAF9FC]'
                              }`}
                          >
                            <span>{type.label}</span>
                            {draftBookingType.toLowerCase() === type.id.toLowerCase() && <Check className="h-3.5 w-3.5 text-[#5B21B6]" />}
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
                        <ChevronUp className="h-4 w-4 text-[#5B21B6]" />
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
                              ? 'bg-[#EDE9FE] text-[#5B21B6] font-bold'
                              : 'text-[#1F1F1F] hover:bg-[#FAF9FC]'
                            }`}
                        >
                          <span>All Delivery Alerts</span>
                          {(draftSlaAlert === 'ALL' || draftSlaAlert === '') && <Check className="h-3.5 w-3.5 text-[#5B21B6]" />}
                        </button>
                        {STATIC_SLA_ALERTS.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setDraftSlaAlert(item.id)}
                            className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-xs transition-colors cursor-pointer ${draftSlaAlert === item.id
                                ? 'bg-[#EDE9FE] text-[#5B21B6] font-bold'
                                : 'text-[#1F1F1F] hover:bg-[#FAF9FC]'
                              }`}
                          >
                            <span>{item.label}</span>
                            {draftSlaAlert === item.id && <Check className="h-3.5 w-3.5 text-[#5B21B6]" />}
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
                        <Clock className="h-3.5 w-3.5 text-[#5B21B6]" />
                        <span>Duration</span>
                        {draftDuration && (
                          <span className="text-[10px] font-semibold text-[#5B21B6] bg-[#EDE9FE] px-2 py-0.5 rounded-full">
                            {formatDurationInHours(draftDuration)}
                          </span>
                        )}
                      </div>
                      {expandedSections.duration ? (
                        <ChevronUp className="h-4 w-4 text-[#5B21B6]" />
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
                              ? 'bg-[#EDE9FE] text-[#5B21B6] font-bold'
                              : 'text-[#1F1F1F] hover:bg-[#FAF9FC]'
                            }`}
                        >
                          <span>All Durations</span>
                          {!draftDuration && <Check className="h-3.5 w-3.5 text-[#5B21B6]" />}
                        </button>
                        {STATIC_DURATIONS.map((d) => (
                          <button
                            key={d.val}
                            type="button"
                            onClick={() => setDraftDuration(d.val)}
                            className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-xs transition-colors cursor-pointer ${draftDuration === d.val
                                ? 'bg-[#EDE9FE] text-[#5B21B6] font-bold'
                                : 'text-[#1F1F1F] hover:bg-[#FAF9FC]'
                              }`}
                          >
                            <span>{d.label}</span>
                            {draftDuration === d.val && <Check className="h-3.5 w-3.5 text-[#5B21B6]" />}
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
                    onClick={() => {
                      setDraftStatus('');
                      setDraftSlaAlert('');
                      setDraftBookingType('');
                      setDraftDuration('');
                    }}
                    className="text-xs font-semibold text-[#6B6B6B] hover:text-[#B42318] px-3.5 py-2 rounded-xl border border-[#EEEEF2] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyFilter}
                    className="flex items-center gap-1.5 rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white px-5 py-2.5 text-xs font-bold shadow-soft-sm hover:shadow-soft-md active:scale-95 transition-all cursor-pointer"
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

            {/* Operating Area indicator (Active scope from area API) */}
            {selectedArea && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#EDE9FE] border border-[#DDD6FE] px-2.5 py-0.5 text-[11px] font-semibold text-[#5B21B6]">
                <MapPin className="h-3 w-3" />
                Area: {selectedArea}
              </span>
            )}

            {/* Status chip */}
            {selectedStatus && selectedStatus !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#FAF9FC] border border-[#DDD6FE] px-2.5 py-0.5 text-[11px] font-semibold text-[#5B21B6]">
                Status: {selectedStatus === 'In Progress' ? 'Ongoing' : selectedStatus}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStatus('');
                    setDraftStatus('');
                  }}
                  className="hover:text-rose-600 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {/* Booking Type chip */}
            {selectedBookingType && selectedBookingType !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#FAF9FC] border border-[#DDD6FE] px-2.5 py-0.5 text-[11px] font-semibold text-[#5B21B6]">
                Type: {selectedBookingType === 'scheduled' ? 'Schedule' : selectedBookingType}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBookingType('');
                    setDraftBookingType('');
                  }}
                  className="hover:text-rose-600 transition-colors"
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
                  }}
                  className="hover:text-rose-800 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {/* Duration chip */}
            {selectedDuration && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#FAF9FC] border border-[#DDD6FE] px-2.5 py-0.5 text-[11px] font-semibold text-[#5B21B6]">
                Duration: {formatDurationInHours(selectedDuration)}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDuration('');
                    setDraftDuration('');
                  }}
                  className="hover:text-rose-600 transition-colors"
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
            <div className="h-5 w-48 bg-[#EDE9FE] animate-pulse rounded-lg" />
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
              areaName: selectedArea,
              bookingStatus: selectedStatus || undefined,
              slaAlert: selectedSlaAlert || undefined,
              bookingType: selectedBookingType || undefined,
              duration: selectedDuration || undefined,
            }, false)}
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
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[#5B21B6] bg-[#EDE9FE] px-2 py-0.5 rounded-lg truncate">
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
                      <span className="font-bold text-[#5B21B6]">{displayType}</span>
                      <span className="font-mono text-xs font-bold text-[#5B21B6]">
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
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] text-[#5B21B6] hover:bg-[#EDE9FE] transition-colors cursor-pointer shrink-0"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {showAssign && (
                      <button
                        type="button"
                        onClick={() => setAssignBooking(b)}
                        className="rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white px-3 py-1.5 text-xs font-semibold shadow-soft-sm transition-all active:scale-95 cursor-pointer"
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

      {/* Pagination Controls (20 bookings per page) */}
      {!isLoading && !error && filteredBookings.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-[#EEEEF2] bg-white p-4 shadow-soft-sm text-xs text-[#6B6B6B]">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-[#1F1F1F] font-semibold">{(safePage - 1) * PAGE_SIZE + 1}</strong> to{' '}
              <strong className="text-[#1F1F1F] font-semibold">
                {Math.min(safePage * PAGE_SIZE, filteredBookings.length)}
              </strong>{' '}
              of <strong className="text-[#1F1F1F] font-semibold">{filteredBookings.length}</strong> bookings (Page{' '}
              <strong className="text-[#5B21B6] font-semibold">{safePage}</strong> of{' '}
              <strong className="text-[#5B21B6] font-semibold">{totalPages}</strong>)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setPage((prev) => Math.max(1, prev - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={safePage <= 1 || isLoading || isRefreshing}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] font-semibold text-[#1F1F1F] hover:bg-[#EDE9FE] hover:text-[#5B21B6] transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            {/* Page number buttons */}
            {Array.from({ length: totalPages }).map((_, idx) => {
              const p = idx + 1;
              if (p < safePage - 2 || p > safePage + 2) return null;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setPage(p);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`h-8 w-8 rounded-xl font-bold transition-all cursor-pointer ${safePage === p
                      ? 'bg-[#5B21B6] text-white shadow-soft-xs'
                      : 'border border-[#EEEEF2] bg-[#FAF9FC] text-[#1F1F1F] hover:bg-[#EDE9FE] hover:text-[#5B21B6]'
                    }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => {
                setPage((prev) => Math.min(totalPages, prev + 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={safePage >= totalPages || isLoading || isRefreshing}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] font-semibold text-[#1F1F1F] hover:bg-[#EDE9FE] hover:text-[#5B21B6] transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
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
            areaName: selectedArea,
            bookingStatus: selectedStatus || undefined,
            slaAlert: selectedSlaAlert || undefined,
            bookingType: selectedBookingType || undefined,
            duration: selectedDuration || undefined,
          }, false);
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
