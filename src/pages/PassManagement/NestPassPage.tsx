import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Ticket, 
  Plus, 
  RefreshCw, 
  MapPin, 
  Calendar, 
  Clock, 
  Eye, 
  Pencil, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  Layers,
  Filter,
  CheckCircle2,
  XCircle,
  X,
  ChevronDown,
  ChevronUp,
  Check
} from 'lucide-react';
import { 
  getNestPasses, 
  RawNestPassItem, 
  NestPassPagination,
  getActiveAreas,
  ActiveAreaItem
} from '../../services/api';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { NestPassDetailsDrawer } from '../../components/pass-management/NestPassDetailsDrawer';
import { CreateNestPassModal } from '../../components/pass-management/CreateNestPassModal';
import { EditNestPassModal } from '../../components/pass-management/EditNestPassModal';

const PAGE_SIZE = 20; // Strictly 20 records per page

// Completely static status options - UI filter only, not connected to any API or backend/table data
const STATIC_PASS_STATUSES = ['All', 'Active', 'Inactive', 'Suspended'] as const;

export const NestPassPage: React.FC = () => {
  const { accessibleAreas, hasAllAreaAccess } = useAuth();

  // API Data State
  const [passes, setPasses] = useState<RawNestPassItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Active Areas fetched dynamically from existing Active Area API - NO static/hardcoded areas
  const [activeAreas, setActiveAreas] = useState<ActiveAreaItem[]>([]);
  const [isLoadingAreas, setIsLoadingAreas] = useState<boolean>(true);

  // Dynamic area options based on login permissions
  const availableAreaOptions = useMemo(() => {
    if (hasAllAreaAccess) {
      if (activeAreas.length > 0) {
        return activeAreas.map((a) => a.areaName);
      }
      return accessibleAreas.length > 0 ? accessibleAreas : [];
    }
    return accessibleAreas;
  }, [hasAllAreaAccess, activeAreas, accessibleAreas]);

  // Filter State
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Filter Popover state (following Orders page interaction pattern)
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const filterContainerRef = useRef<HTMLDivElement>(null);
  const [draftArea, setDraftArea] = useState<string>('');
  const [draftStatus, setDraftStatus] = useState<string>('All');

  // Accordion sections expansion state - mutually exclusive
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    area: false,
    status: false,
  });

  const toggleSection = (sectionKey: string) => {
    setExpandedSections((prev) => ({
      area: sectionKey === 'area' ? !prev.area : false,
      status: sectionKey === 'status' ? !prev.status : false,
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

  // Server-side Pagination State
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<NestPassPagination>({
    page: 1,
    limit: PAGE_SIZE,
    totalCount: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  // Modals & Drawers
  const [inspectPassId, setInspectPassId] = useState<string | null>(null);
  const [editPassId, setEditPassId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch Areas dynamically on mount using existing Active Area API
  useEffect(() => {
    setIsLoadingAreas(true);
    getActiveAreas()
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setActiveAreas(res.data);
        }
      })
      .catch((err) => console.error('Failed to load active areas in Nest Pass:', err))
      .finally(() => setIsLoadingAreas(false));
  }, []);

  // Sync initial and selected area with available area options
  useEffect(() => {
    if (availableAreaOptions.length > 0) {
      if (!selectedArea || !availableAreaOptions.includes(selectedArea)) {
        const preferred = availableAreaOptions.find(
          (a) => a.toLowerCase() === 'neo_town'
        );
        const areaToSet = preferred || availableAreaOptions[0];
        setSelectedArea(areaToSet);
        setDraftArea(areaToSet);
      }
    }
  }, [availableAreaOptions, selectedArea]);

  // Fetch Nest Passes from Centralized API
  const fetchPasses = useCallback(async (targetPage = page, targetArea = selectedArea) => {
    if (!targetArea) return;
    setIsLoading(true);
    setApiError(null);

    try {
      const res = await getNestPasses({
        areaName: targetArea,
        page: targetPage,
        limit: PAGE_SIZE,
      });

      if (res.success) {
        setPasses(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      } else {
        setPasses([]);
        setApiError(res.error || 'Failed to load Nest Passes.');
      }
    } catch (err: any) {
      setPasses([]);
      setApiError(err?.message || 'Network error while loading Nest Passes.');
    } finally {
      setIsLoading(false);
    }
  }, [page, selectedArea]);

  // Fetch when page or area changes
  useEffect(() => {
    if (selectedArea) {
      fetchPasses(page, selectedArea);
    }
  }, [page, selectedArea, fetchPasses]);

  // Popover open & sync drafts
  const handleOpenFilter = () => {
    setDraftArea(selectedArea);
    setDraftStatus(selectedStatus);
    setExpandedSections({
      area: false,
      status: false,
    });
    setIsFilterOpen(true);
  };

  // Apply draft filters
  const handleApplyFilter = () => {
    setSelectedArea(draftArea);
    setSelectedStatus(draftStatus);
    setPage(1);
    setIsFilterOpen(false);
  };

  // Remove filters
  const handleRemoveFilters = () => {
    if (activeAreas.length > 0) {
      setSelectedArea(activeAreas[0].areaName);
      setDraftArea(activeAreas[0].areaName);
    }
    setSelectedStatus('All');
    setDraftStatus('All');
    setPage(1);
    setIsFilterOpen(false);
  };

  // Active filter count - status is completely static and counted when not 'All'
  const activeFilterCount = selectedStatus !== 'All' ? 1 : 0;

  // Filter passes by static status filter if selected
  const displayedPasses = useMemo(() => {
    if (!selectedStatus || selectedStatus === 'All') return passes;
    return passes.filter((p) => {
      const rawStatus = (p as any).status || (p.active ? 'Active' : 'Inactive');
      return rawStatus.toLowerCase() === selectedStatus.toLowerCase();
    });
  }, [passes, selectedStatus]);

  // Format Date Helper
  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  // Format Currency Helper
  const formatPrice = (val?: number) => {
    if (val === undefined || val === null) return '—';
    return `₹${Number(val).toLocaleString('en-IN')}`;
  };

  // Table Columns Definition
  const columns: Column<RawNestPassItem>[] = [
    {
      header: (
        <div className="leading-tight text-center">
          <span className="block font-semibold">PACK</span>
          <span className="block text-[10px] font-semibold text-[#8C8C8C]">ID</span>
        </div>
      ),
      align: 'center',
      className: 'w-[10%] min-w-[90px]',
      render: (p) => (
        <div className="flex items-center justify-center gap-1.5 font-mono text-xs font-bold text-[#5B21B6]">
          <Ticket className="h-3.5 w-3.5 shrink-0" />
          <span>{p.packId || '—'}</span>
        </div>
      ),
    },
    {
      header: (
        <div className="leading-tight text-center">
          <span className="block font-semibold">NANO</span>
          <span className="block text-[10px] font-semibold text-[#8C8C8C]">MARKET</span>
        </div>
      ),
      align: 'center',
      className: 'w-[12%] min-w-[110px]',
      render: (p) => (
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1 font-mono text-[#5B21B6] font-semibold text-[11px] bg-[#EDE9FE] px-2 py-0.5 rounded-lg max-w-[120px] truncate">
            <MapPin className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate">{p.areaName || '—'}</span>
          </span>
        </div>
      ),
    },
    {
      header: (
        <div className="leading-tight text-center">
          <span className="block font-semibold">PACK</span>
          <span className="block text-[10px] font-semibold text-[#8C8C8C]">TYPE</span>
        </div>
      ),
      align: 'center',
      className: 'w-[10%] min-w-[90px]',
      render: (p) => (
        <span className="inline-flex items-center rounded-md bg-[#FAF9FC] border border-[#EEEEF2] px-2 py-0.5 text-xs font-semibold text-[#1F1F1F]">
          {p.packType || 'Visits'}
        </span>
      ),
    },
    {
      header: (
        <div className="leading-tight text-center">
          <span className="block font-semibold">TOTAL</span>
          <span className="block text-[10px] font-semibold text-[#8C8C8C]">VISITS</span>
        </div>
      ),
      align: 'center',
      className: 'w-[8%] min-w-[70px]',
      render: (p) => (
        <span className="font-mono font-bold text-xs text-[#1F1F1F]">
          {p.visits ?? '—'}
        </span>
      ),
    },
    {
      header: (
        <div className="leading-tight text-center">
          <span className="block font-semibold">PACKAGE</span>
          <span className="block text-[10px] font-semibold text-[#8C8C8C]">PRICE</span>
        </div>
      ),
      align: 'center',
      className: 'w-[10%] min-w-[90px]',
      render: (p) => (
        <span className="font-mono font-extrabold text-xs text-emerald-700">
          {formatPrice(p.price)}
        </span>
      ),
    },
    {
      header: (
        <div className="leading-tight text-center">
          <span className="block font-semibold">VALIDITY</span>
          <span className="block text-[10px] font-semibold text-[#8C8C8C]">DAYS</span>
        </div>
      ),
      align: 'center',
      className: 'w-[10%] min-w-[85px]',
      render: (p) => (
        <span className="font-mono text-xs text-[#6B6B6B]">
          {p.validityDays ? `${p.validityDays} Days` : '—'}
        </span>
      ),
    },
    {
      header: (
        <div className="leading-tight text-center">
          <span className="block font-semibold">SERVICE</span>
          <span className="block text-[10px] font-semibold text-[#8C8C8C]">DURATION</span>
        </div>
      ),
      align: 'center',
      className: 'w-[10%] min-w-[85px]',
      render: (p) => (
        <span className="font-mono text-xs text-[#6B6B6B]">
          {p.duration ? `${p.duration} min` : '—'}
        </span>
      ),
    },
    {
      header: (
        <div className="leading-tight text-center">
          <span className="block font-semibold">OFFER</span>
          <span className="block text-[10px] font-semibold text-[#8C8C8C]">EXPIRY</span>
        </div>
      ),
      align: 'center',
      className: 'w-[12%] min-w-[105px]',
      render: (p) => (
        <div className="flex items-center justify-center gap-1 font-mono text-xs text-[#1F1F1F]">
          <Calendar className="h-3 w-3 text-[#5B21B6] shrink-0" />
          <span>{formatDate(p.offerexpire)}</span>
        </div>
      ),
    },
    {
      header: (
        <div className="leading-tight text-center">
          <span className="block font-semibold">PASS</span>
          <span className="block text-[10px] font-semibold text-[#8C8C8C]">STATUS</span>
        </div>
      ),
      align: 'center',
      className: 'w-[10%] min-w-[90px]',
      render: (p) => {
        const rawStatus = (p as any).status || (p.active ? 'Active' : 'Inactive');
        return (
          <div className="flex justify-center">
            <StatusBadge 
              status={rawStatus} 
              size="sm" 
              pulse={rawStatus === 'Active'} 
            />
          </div>
        );
      },
    },
    {
      header: (
        <div className="leading-tight text-center">
          <span className="block font-semibold">QUICK</span>
          <span className="block text-[10px] font-semibold text-[#8C8C8C]">ACTIONS</span>
        </div>
      ),
      align: 'center',
      className: 'w-[8%] min-w-[80px]',
      render: (p) => (
        <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setInspectPassId(p.passId)}
            className="rounded-lg border border-[#EEEEF2] bg-[#FAF9FC] p-1.5 text-[#6B6B6B] hover:text-[#5B21B6] hover:bg-[#EDE9FE] transition-colors shadow-soft-xs cursor-pointer"
            title="View Details"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setEditPassId(p.passId)}
            className="rounded-lg border border-[#EEEEF2] bg-[#FAF9FC] p-1.5 text-[#6B6B6B] hover:text-[#5B21B6] hover:bg-[#EDE9FE] transition-colors shadow-soft-xs cursor-pointer"
            title="Edit Pass"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  // Pagination bounds calculation
  const startRecord = pagination.totalCount > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const endRecord = Math.min(page * PAGE_SIZE, pagination.totalCount);

  return (
    <div className="space-y-5 w-full max-w-full min-w-0">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 w-full">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F1F1F] flex items-center gap-2 truncate">
            <Ticket className="h-6 w-6 text-[#5B21B6]" />
            Nest Pass
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6B6B] mt-0.5 truncate">
            Manage service passes and promotional packages
          </p>
        </div>

        {/* Top Right: Create Nest Pass Button */}
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white px-4 py-2.5 text-xs sm:text-sm font-bold transition-all shadow-soft-sm hover:shadow-soft-md active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Create Nest Pass</span>
        </button>
      </div>

      {/* Top Filter Bar (Orders Page Interaction Pattern) */}
      <div className="relative z-30 rounded-2xl border border-[#EEEEF2] bg-white p-3 sm:p-4 shadow-soft-sm space-y-3 w-full">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Left: Active Area Indicator */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#1F1F1F] flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-[#5B21B6]" />
              Active Area:
            </span>
            {selectedArea ? (
              <span className="rounded-lg bg-[#EDE9FE] px-2.5 py-1 text-xs font-bold text-[#5B21B6]">
                {selectedArea}
              </span>
            ) : (
              <span className="text-xs text-[#6B6B6B] italic">Loading active areas...</span>
            )}
          </div>

          {/* Right Action buttons: Refresh + Remove Filters + Filter Button */}
          <div ref={filterContainerRef} className="flex items-center gap-2 sm:gap-2.5 shrink-0 flex-wrap relative">
            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => fetchPasses(page, selectedArea)}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] px-3 py-2 text-xs font-semibold text-[#1F1F1F] hover:text-[#5B21B6] hover:bg-[#EDE9FE] shadow-soft-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Refresh Nest Passes manually"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-[#5B21B6]' : ''}`} />
              <span>Refresh</span>
            </button>

            {/* Remove Filter Button (Visible only when filters are active) */}
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={handleRemoveFilters}
                className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-[#FEF2F2] px-3 py-2 text-xs font-semibold text-[#B42318] hover:bg-rose-100 transition-all shadow-soft-sm active:scale-95 cursor-pointer"
                title="Remove all active filters"
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
              className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all shadow-soft-sm active:scale-95 cursor-pointer ${
                isFilterOpen || activeFilterCount > 0
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
              <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto right-3 sm:right-0 top-20 sm:top-full mt-2 z-50 w-auto sm:w-[380px] md:w-[420px] h-auto max-h-[85vh] flex flex-col rounded-2xl border border-[#EEEEF2] bg-white shadow-2xl shadow-purple-950/15 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Popover Header */}
                <div className="flex items-center justify-between border-b border-[#EEEEF2] p-4 bg-white shrink-0">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-[#5B21B6]" />
                    <h3 className="text-sm font-bold text-[#1F1F1F]">Filter Nest Passes</h3>
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
                  {/* 1. Operating Area (Dynamic from API only - no static areas) */}
                  <div className="rounded-xl border border-[#EEEEF2] bg-white overflow-hidden shadow-soft-xs">
                    <button
                      type="button"
                      onClick={() => toggleSection('area')}
                      className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-[#1F1F1F] hover:bg-[#FAF9FC] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-[#5B21B6]" />
                        <span>Operating Area</span>
                        {draftArea && (
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
                        {isLoadingAreas && availableAreaOptions.length === 0 ? (
                          <div className="flex items-center gap-2 py-2 px-2 text-xs text-[#6B6B6B]">
                            <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#5B21B6]" />
                            <span>Loading active areas from API...</span>
                          </div>
                        ) : availableAreaOptions.length === 0 ? (
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
                                  ? 'bg-[#EDE9FE] text-[#5B21B6] font-bold'
                                  : 'text-[#1F1F1F] hover:bg-[#FAF9FC]'
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-[#5B21B6]" />
                                <span>{areaName}</span>
                              </div>
                              {draftArea === areaName && <Check className="h-3.5 w-3.5 text-[#5B21B6]" />}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* 2. Status (Completely Static - Not connected to any API, table data or backend logic) */}
                  <div className="rounded-xl border border-[#EEEEF2] bg-white overflow-hidden shadow-soft-xs">
                    <button
                      type="button"
                      onClick={() => toggleSection('status')}
                      className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-[#1F1F1F] hover:bg-[#FAF9FC] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span>Status</span>
                        {draftStatus && draftStatus !== 'All' && (
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
                        {STATIC_PASS_STATUSES.map((st) => {
                          const isSelected = draftStatus === st;
                          const dotColor =
                            st === 'Active'
                              ? 'bg-emerald-500'
                              : st === 'Inactive'
                              ? 'bg-[#7C3AED]'
                              : st === 'Suspended'
                              ? 'bg-rose-500'
                              : 'bg-gray-400';

                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => setDraftStatus(st)}
                              className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-xs transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-[#EDE9FE] text-[#5B21B6] font-bold'
                                  : 'text-[#1F1F1F] hover:bg-[#FAF9FC]'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${dotColor}`} />
                                <span>{st}</span>
                              </div>
                              {isSelected && <Check className="h-3.5 w-3.5 text-[#5B21B6]" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Popover Footer */}
                <div className="border-t border-[#EEEEF2] bg-white p-3.5 flex items-center justify-between gap-3 shrink-0 rounded-b-2xl">
                  <button
                    type="button"
                    onClick={handleRemoveFilters}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#B42318] hover:text-white px-3.5 py-2 rounded-xl border border-rose-200 bg-[#FEF2F2] hover:bg-[#B42318] transition-all shadow-soft-xs cursor-pointer active:scale-95"
                    title="Clear all filters and reset"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Clear All</span>
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
        {(Boolean(selectedArea) || (selectedStatus && selectedStatus !== 'All')) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#EEEEF2]">
            <span className="text-[11px] font-semibold text-[#6B6B6B]">Applied:</span>

            {/* Operating Area indicator (Dynamic scope from area API) */}
            {selectedArea && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#EDE9FE] border border-[#DDD6FE] px-2.5 py-0.5 text-[11px] font-semibold text-[#5B21B6]">
                <MapPin className="h-3 w-3" />
                Area: {selectedArea}
              </span>
            )}

            {/* Status chip (Completely static UI filter, not connected to table data) */}
            {selectedStatus && selectedStatus !== 'All' && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#FAF9FC] border border-[#DDD6FE] px-2.5 py-0.5 text-[11px] font-semibold text-[#5B21B6]">
                Status: {selectedStatus}
                <button 
                  type="button"
                  onClick={() => {
                    setSelectedStatus('All');
                    setDraftStatus('All');
                  }}
                  className="hover:text-rose-600 transition-colors ml-0.5 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Error State with Retry */}
      {apiError && (
        <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-[#FEF2F2] p-4 text-xs text-[#B42318] shadow-soft-sm">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="font-semibold truncate">{apiError}</span>
          </div>
          <button
            onClick={() => fetchPasses(page, selectedArea)}
            className="rounded-xl border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-[#B42318] hover:bg-rose-50 transition-colors cursor-pointer shadow-soft-xs shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Desktop View: Data Table */}
      <div className="hidden md:block w-full max-w-full min-w-0">
        <DataTable
          compact
          columns={columns}
          data={displayedPasses}
          keyExtractor={(p) => p.passId || p.packId}
          isLoading={isLoading}
          emptyTitle="No Nest Passes found"
          emptyDescription={`No promotional passes found for ${selectedArea || 'this area'}. Try creating a new pass or choosing a different area.`}
        />
      </div>

      {/* Mobile View: Dedicated Cards */}
      <div className="block md:hidden space-y-3 w-full max-w-full">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-2xl border border-[#EEEEF2] bg-white animate-pulse" />
            ))}
          </div>
        ) : displayedPasses.length === 0 ? (
          <div className="rounded-2xl border border-[#EEEEF2] bg-white p-8 text-center shadow-soft-sm">
            <Ticket className="h-8 w-8 text-[#5B21B6] mx-auto mb-2 opacity-50" />
            <h3 className="text-sm font-bold text-[#1F1F1F]">No Nest Passes found</h3>
            <p className="text-xs text-[#6B6B6B] mt-1">No promotional passes found for {selectedArea || 'this area'}.</p>
          </div>
        ) : (
          displayedPasses.map((p) => {
            const rawStatus = (p as any).status || (p.active ? 'Active' : 'Inactive');
            return (
            <div
              key={p.passId || p.packId}
              className="rounded-2xl border border-[#EEEEF2] bg-white p-3 sm:p-3.5 shadow-soft-sm space-y-2 w-full max-w-full overflow-hidden"
            >
              {/* Card Header: Pack ID, Price & Status */}
              <div className="flex items-center justify-between border-b border-[#EEEEF2] pb-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-[#EDE9FE] flex items-center justify-center text-[#5B21B6] font-mono text-xs font-bold shrink-0">
                    <Ticket className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-mono text-xs font-bold text-[#5B21B6]">{p.packId}</span>
                    <div className="font-extrabold text-sm text-[#1F1F1F]">{formatPrice(p.price)}</div>
                  </div>
                </div>
                <div className="shrink-0">
                  <StatusBadge status={rawStatus} size="sm" pulse={rawStatus === 'Active'} />
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-[#6B6B6B] block">Area</span>
                  <span className="font-semibold text-[#1F1F1F] truncate block">{p.areaName || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#6B6B6B] block">Pack Type</span>
                  <span className="font-semibold text-[#1F1F1F] truncate block">{p.packType || 'Visits'} • {p.visits} Visits</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#6B6B6B] block">Offer Expiry</span>
                  <span className="font-mono text-[11px] text-[#1F1F1F] block">{formatDate(p.offerexpire)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#6B6B6B] block">Pass ID</span>
                  <span className="font-mono text-[10px] text-[#8C8C8C] truncate block" title={p.passId}>
                    {p.passId?.slice(0, 8)}...
                  </span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-2 pt-1.5 border-t border-[#EEEEF2]">
                <button
                  type="button"
                  onClick={() => setEditPassId(p.passId)}
                  className="flex items-center gap-1 rounded-xl border border-[#EEEEF2] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#1F1F1F] hover:bg-[#FAF9FC] transition-colors cursor-pointer"
                >
                  <Pencil className="h-3.5 w-3.5 text-[#5B21B6]" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInspectPassId(p.passId)}
                  title="View Details"
                  aria-label="View Details"
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white shadow-soft-xs transition-colors cursor-pointer shrink-0"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        }))}
      </div>

      {/* Pagination Controls - Server-Side (20 per page) */}
      {pagination.totalCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border border-[#EEEEF2] bg-white px-4 py-3 rounded-2xl shadow-soft-sm w-full">
          <div className="text-xs text-[#6B6B6B]">
            Showing <strong className="text-[#1F1F1F] font-semibold">{startRecord}</strong> to{' '}
            <strong className="text-[#1F1F1F] font-semibold">{endRecord}</strong> of{' '}
            <strong className="text-[#1F1F1F] font-semibold">{pagination.totalCount}</strong> passes (20 per page)
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Previous Button */}
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || !pagination.hasPreviousPage || isLoading}
              className="flex items-center gap-1 rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] px-3 py-1.5 text-xs font-semibold text-[#1F1F1F] hover:bg-[#EDE9FE] hover:text-[#5B21B6] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>

            {/* Page number buttons */}
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => {
              if (
                pagination.totalPages > 7 &&
                pageNum !== 1 &&
                pageNum !== pagination.totalPages &&
                Math.abs(pageNum - page) > 1
              ) {
                if (pageNum === 2 || pageNum === pagination.totalPages - 1) {
                  return <span key={pageNum} className="px-1 text-xs text-[#6B6B6B]">...</span>;
                }
                return null;
              }

              const isActive = pageNum === page;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  disabled={isLoading}
                  className={`h-8 w-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#5B21B6] text-white shadow-soft-xs'
                      : 'border border-[#EEEEF2] bg-[#FAF9FC] text-[#1F1F1F] hover:bg-[#EDE9FE] hover:text-[#5B21B6]'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            {/* Next Button */}
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages || !pagination.hasNextPage || isLoading}
              className="flex items-center gap-1 rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] px-3 py-1.5 text-xs font-semibold text-[#1F1F1F] hover:bg-[#EDE9FE] hover:text-[#5B21B6] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Details Drawer */}
      <NestPassDetailsDrawer
        passId={inspectPassId}
        isOpen={Boolean(inspectPassId)}
        onClose={() => setInspectPassId(null)}
        onEdit={(id) => {
          setInspectPassId(null);
          setEditPassId(id);
        }}
      />

      {/* Create Modal */}
      <CreateNestPassModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setPage(1);
          fetchPasses(1, selectedArea);
        }}
      />

      {/* Edit Modal */}
      <EditNestPassModal
        passId={editPassId}
        isOpen={Boolean(editPassId)}
        onClose={() => setEditPassId(null)}
        onSuccess={() => {
          fetchPasses(page, selectedArea);
        }}
      />
    </div>
  );
};
