import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { RawApiExpert, getNestWorkers, getActiveAreas, formatImageUrl, ActiveAreaItem } from '../../../services/api';
import { DataTable, Column } from '../../../components/common/DataTable';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { SearchInput } from '../../../components/common/SearchInput';
import { ExpertDetailDrawer } from '../../../components/workforce/ExpertDetailDrawer';
import { AddExpertModal } from '../../../components/workforce/AddExpertModal';
import { 
  MapPin, 
  Eye,
  Pencil,
  Plus,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  User,
  Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PAGE_SIZE = 20; // Strictly 20 profiles per page

// Static partner status options with semantic color indicators - UI filter only
const STATIC_EXPERT_STATUSES = [
  { id: 'All Status', label: 'All Status', dotColor: 'bg-gray-400' },
  { id: 'Active', label: 'Active', dotColor: 'bg-emerald-500' },
  { id: 'Inactive', label: 'Inactive', dotColor: 'bg-[#7C3AED]' },
  { id: 'Suspended', label: 'Suspended', dotColor: 'bg-rose-500' },
] as const;

export const WorkersPage: React.FC = () => {
  const navigate = useNavigate();

  // API Data State
  const [experts, setExperts] = useState<RawApiExpert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Pagination State - 20 profiles per page
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }>({
    page: 1,
    limit: PAGE_SIZE,
    totalRecords: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  // Dynamic Active Areas fetched from existing Active Area API - NO hardcoded areas
  const [availableAreas, setAvailableAreas] = useState<string[]>([]);
  const [isLoadingAreas, setIsLoadingAreas] = useState<boolean>(true);

  // Search state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input by 350ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Filter States
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterContainerRef = useRef<HTMLDivElement>(null);

  // Draft states inside Filter Popover
  const [draftStatuses, setDraftStatuses] = useState<string[]>([]);
  const [draftMarkets, setDraftMarkets] = useState<string[]>([]);

  // Accordion sections expansion state - mutually exclusive: only one opened at a time
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    status: false,
    market: false,
  });

  const toggleSection = (sectionKey: string) => {
    setExpandedSections((prev) => ({
      status: sectionKey === 'status' ? !prev.status : false,
      market: sectionKey === 'market' ? !prev.market : false,
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

  // Inspect Drawer State
  const [inspectExpert, setInspectExpert] = useState<RawApiExpert | null>(null);

  // Add Expert Modal State
  const [isAddExpertModalOpen, setIsAddExpertModalOpen] = useState(false);

  // Load Active Areas dynamically using existing Active Area API
  useEffect(() => {
    setIsLoadingAreas(true);
    getActiveAreas()
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const areaNames = res.data.map((a: ActiveAreaItem) => a.areaName).filter(Boolean);
          if (areaNames.length > 0) {
            setAvailableAreas(Array.from(new Set(areaNames)));
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load active areas:', err);
      })
      .finally(() => {
        setIsLoadingAreas(false);
      });
  }, []);

  // Fetch Experts from Centralized API
  const fetchExperts = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);

    const params: any = {
      page,
      limit: PAGE_SIZE,
    };

    const trimmedSearch = debouncedSearch.trim();
    if (trimmedSearch) {
      if (/^HN-?\d+$/i.test(trimmedSearch)) {
        params.workerId = trimmedSearch;
      } else if (/^\d{6,12}$/.test(trimmedSearch.replace(/[\s-]/g, ''))) {
        params.mobileNumber = trimmedSearch.replace(/[\s-]/g, '');
      } else {
        params.fullName = trimmedSearch;
      }
    }

    if (selectedMarkets.length === 1 && selectedMarkets[0] !== 'ALL' && selectedMarkets[0] !== 'All Areas') {
      params.areaName = selectedMarkets[0];
    } else if (selectedMarkets.length === 0) {
      params.areaName = 'Haatza_corp';
    }

    if (selectedStatuses.length === 1 && selectedStatuses[0] !== 'ALL' && selectedStatuses[0] !== 'All Status') {
      params.joiningStatus = selectedStatuses[0];
    }

    const res = await getNestWorkers(params);
    setIsLoading(false);

    if (res.success && Array.isArray(res.data)) {
      setExperts(res.data);
      if (res.pagination) {
        setPagination({
          page: res.pagination.page || page,
          limit: res.pagination.limit || PAGE_SIZE,
          totalRecords: res.pagination.totalRecords !== undefined ? res.pagination.totalRecords : res.data.length,
          totalPages: res.pagination.totalPages || Math.ceil((res.pagination.totalRecords || res.data.length) / PAGE_SIZE) || 1,
          hasNextPage: Boolean(res.pagination.hasNextPage),
          hasPreviousPage: Boolean(res.pagination.hasPreviousPage),
        });
      } else {
        setPagination({
          page,
          limit: PAGE_SIZE,
          totalRecords: res.data.length,
          totalPages: Math.ceil(res.data.length / PAGE_SIZE) || 1,
          hasNextPage: false,
          hasPreviousPage: page > 1,
        });
      }
    } else {
      setApiError(res.error || 'Unable to load experts.');
      setExperts([]);
    }
  }, [debouncedSearch, selectedMarkets, selectedStatuses, page]);

  useEffect(() => {
    fetchExperts();
  }, [fetchExperts]);

  // Open Popover and sync drafts with applied state
  const handleOpenFilter = () => {
    setDraftStatuses([...selectedStatuses]);
    setDraftMarkets([...selectedMarkets]);
    setIsFilterOpen(true);
  };

  // Apply draft filters
  const handleApplyFilter = () => {
    setSelectedStatuses([...draftStatuses]);
    setSelectedMarkets([...draftMarkets]);
    setPage(1);
    setIsFilterOpen(false);
  };

  // Clear all filters
  const handleRemoveFilters = () => {
    setSelectedStatuses([]);
    setSelectedMarkets([]);
    setDraftStatuses([]);
    setDraftMarkets([]);
    setSearch('');
    setDebouncedSearch('');
    setPage(1);
  };

  // Count active filters (excluding search)
  const activeFilterCount = useMemo(() => {
    const validStatuses = selectedStatuses.filter((s) => s !== 'All Status' && s !== 'ALL');
    const validMarkets = selectedMarkets.filter((m) => m !== 'All Areas' && m !== 'ALL');
    return validStatuses.length + validMarkets.length;
  }, [selectedStatuses, selectedMarkets]);

  // Helper to toggle items in array
  const toggleItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  // Filtered workers if multiple selected
  const displayedExperts = useMemo(() => {
    return experts.filter((e) => {
      if (selectedStatuses.length >= 1 && !selectedStatuses.includes('All Status')) {
        const st = (e.joiningStatus || '').trim().toLowerCase();
        const matches = selectedStatuses.some((s) => s.toLowerCase() === st);
        if (!matches) return false;
      }
      if (selectedMarkets.length >= 1 && !selectedMarkets.includes('ALL') && !selectedMarkets.includes('All Areas')) {
        const area = (e.areaName || '').trim().toLowerCase();
        const matchesArea = selectedMarkets.some((m) => m.toLowerCase() === area);
        if (!matchesArea) return false;
      }
      return true;
    });
  }, [experts, selectedStatuses, selectedMarkets]);

  // Table Columns - 2-row headings placed in the middle with center alignment matching table content
  const columns: Column<RawApiExpert>[] = [
    {
      header: (
        <div className="leading-tight text-left pl-10 sm:pl-11">
          <span className="block font-semibold">EXPERT</span>
          <span className="block text-[10px] font-semibold text-[#8C8C8C]">PROFILE</span>
        </div>
      ),
      align: 'left',
      className: 'w-[18%] min-w-[175px]',
      render: (w) => {
        const name = (w.fullName || 'Unnamed Expert').trim();
        const rawImg = w.profileImage || (w as any).profileImg || (w as any).avatar || (w as any).photo || '';
        const imgSrc = formatImageUrl(rawImg);

        return (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 shrink-0 rounded-full overflow-hidden border border-[#EEEEF2] bg-[#EDE9FE] flex items-center justify-center relative shadow-soft-xs">
              <span className="font-bold text-xs text-[#5B21B6] select-none">
                {name ? name.charAt(0).toUpperCase() : <User className="h-3.5 w-3.5 text-[#5B21B6]" />}
              </span>
              {imgSrc ? (
                <img
                  src={imgSrc}
                  alt={name}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div className="min-w-0 text-left">
              <div 
                className="font-semibold text-xs text-[#1F1F1F] hover:text-[#5B21B6] transition-colors truncate max-w-[120px]" 
                title={name}
              >
                {name}
              </div>
              <div className="font-mono text-[10px] text-[#6B6B6B] truncate">{w.mobileNumber || '—'}</div>
            </div>
          </div>
        );
      },
    },
    {
      header: (
        <div className="leading-tight text-center">
          <span className="block font-semibold">EXPERT</span>
          <span className="block text-[10px] font-semibold text-[#8C8C8C]">ID</span>
        </div>
      ),
      align: 'center',
      accessor: 'workerId',
      className: 'w-[8%] min-w-[80px]',
      render: (w) => <span className="font-mono text-[#6B6B6B] text-xs font-semibold">{w.workerId || '—'}</span>,
    },
    {
      header: (
        <div className="leading-tight text-center">
          <span className="block font-semibold">ZONE /</span>
          <span className="block text-[10px] font-semibold text-[#8C8C8C]">MARKET</span>
        </div>
      ),
      align: 'center',
      accessor: 'areaName',
      className: 'w-[11%] min-w-[100px]',
      render: (w) => (
        <div className="flex justify-center">
          <span 
            className="inline-flex items-center gap-1 font-mono text-[#5B21B6] font-semibold text-[11px] bg-[#EDE9FE] px-1.5 py-0.5 rounded-lg max-w-[110px] truncate"
            title={w.areaName || '—'}
          >
            <MapPin className="h-2.5 w-2.5 text-[#5B21B6] shrink-0" />
            <span className="truncate">{w.areaName || '—'}</span>
          </span>
        </div>
      ),
    },
    {
      header: (
        <div className="leading-tight text-center">
          <span className="block font-semibold">PARTNER</span>
          <span className="block text-[10px] font-semibold text-[#8C8C8C]">STATUS</span>
        </div>
      ),
      align: 'center',
      className: 'w-[9%] min-w-[85px]',
      render: (w) => {
        const rawStatus = w.joiningStatus || 'Active';
        const statusClean = typeof rawStatus === 'string' ? rawStatus.trim() : 'Active';
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
          <span className="block font-semibold">CURRENT</span>
          <span className="block text-[10px] font-semibold text-[#8C8C8C]">JOB</span>
        </div>
      ),
      align: 'center',
      className: 'w-[7%] min-w-[70px]',
      render: () => (
        <span className="text-[#6B6B6B] font-mono text-xs">
          Idle
        </span>
      ),
    },
    {
      header: (
        <div className="leading-tight text-center">
          <span className="block font-semibold">TODAY</span>
          <span className="block text-[10px] font-semibold text-[#8C8C8C]">JOBS</span>
        </div>
      ),
      align: 'center',
      className: 'w-[6%] min-w-[60px]',
      render: () => <span className="font-mono text-[#6B6B6B] text-xs">—</span>,
    },
    {
      header: (
        <div className="leading-tight text-center">
          <span className="block font-semibold">RATING /</span>
          <span className="block text-[10px] font-semibold text-[#8C8C8C]">VERIFY</span>
        </div>
      ),
      align: 'center',
      className: 'w-[10%] min-w-[95px]',
      render: (w) => (
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[#027A48] bg-[#ECFDF3] px-1.5 py-0.5 rounded-md">
            <ShieldCheck className="h-3 w-3 text-[#027A48] shrink-0" />
            <span>{w.verificationStatus || 'Verified'}</span>
          </span>
        </div>
      ),
    },
    {
      header: (
        <div className="leading-tight text-center">
          <span className="block font-semibold">EARNINGS</span>
          <span className="block text-[10px] font-semibold text-[#8C8C8C]">TODAY</span>
        </div>
      ),
      align: 'center',
      className: 'w-[9%] min-w-[85px]',
      render: (w) => (
        <span className="font-mono font-bold text-emerald-700 text-xs">
          {w.monthlySalary ? `₹${Number(w.monthlySalary).toLocaleString('en-IN')}` : '—'}
        </span>
      ),
    },
    {
      header: (
        <div className="leading-tight text-center">
          <span className="block font-semibold">KYC</span>
          <span className="block text-[10px] font-semibold text-[#8C8C8C]">STATUS</span>
        </div>
      ),
      align: 'center',
      className: 'w-[9%] min-w-[85px]',
      render: (w) => (
        <div className="flex justify-center">
          <StatusBadge status={w.verificationStatus || 'Verified'} size="sm" />
        </div>
      ),
    },
    {
      header: (
        <div className="leading-tight text-center">
          <span className="block font-semibold">GPS</span>
          <span className="block text-[10px] font-semibold text-[#8C8C8C]">UPDATE</span>
        </div>
      ),
      align: 'center',
      className: 'w-[6%] min-w-[60px]',
      render: () => (
        <span className="font-mono text-[11px] text-[#6B6B6B]">
          —
        </span>
      ),
    },
    {
      header: (
        <div className="leading-tight text-center">
          <span className="block font-semibold">QUICK</span>
          <span className="block text-[10px] font-semibold text-[#8C8C8C]">ACTIONS</span>
        </div>
      ),
      align: 'center',
      className: 'w-[7%] min-w-[75px]',
      render: (w) => (
        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setInspectExpert(w)}
            className="rounded-lg border border-[#EEEEF2] bg-[#FAF9FC] p-1.5 text-[#6B6B6B] hover:text-[#5B21B6] hover:bg-[#EDE9FE] transition-colors shadow-soft-xs cursor-pointer"
            title="Inspect Expert (Quick Drawer)"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              const routeId = w.tableId || w.workerId;
              navigate(`/experts/${routeId}?edit=true`, {
                state: { tableId: w.tableId, edit: true },
              });
            }}
            className="rounded-lg border border-[#EEEEF2] bg-[#FAF9FC] p-1.5 text-[#6B6B6B] hover:text-[#5B21B6] hover:bg-[#EDE9FE] transition-colors shadow-soft-xs cursor-pointer"
            title="Edit Expert"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  // Pagination calculation
  const startRecord = pagination.totalRecords > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const endRecord = Math.min(page * PAGE_SIZE, pagination.totalRecords);

  return (
    <div className="space-y-5 w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 w-full">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F1F1F] flex items-center gap-2 truncate">
            Expert Management Console
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6B6B] mt-0.5 truncate">
            Active service experts, live state, performance, and compliance records.
          </p>
        </div>

        {/* Top Right: New Expert Button */}
        <button
          type="button"
          onClick={() => setIsAddExpertModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white px-4 py-2.5 text-xs sm:text-sm font-bold transition-all shadow-soft-sm hover:shadow-soft-md active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>New Expert</span>
        </button>
      </div>

      {/* Top Filter Bar: Search Bar on Left, Filter & Remove Filter on Right */}
      <div className="relative z-30 rounded-2xl border border-[#EEEEF2] bg-white p-3 sm:p-4 shadow-soft-sm space-y-3 w-full max-w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Search Bar */}
          <div className="w-full sm:max-w-md min-w-0">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search expert by name, ID, phone..."
              className="w-full"
            />
          </div>

          {/* Right: Remove Filter button + Filter button */}
          <div ref={filterContainerRef} className="flex items-center gap-2 sm:gap-2.5 self-start sm:self-auto shrink-0 flex-wrap relative">
            {/* Refresh Button */}
            <button
              onClick={() => fetchExperts()}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] px-3 py-2 text-xs font-semibold text-[#6B6B6B] hover:text-[#5B21B6] hover:bg-[#EDE9FE] transition-all shadow-soft-sm active:scale-95 cursor-pointer disabled:opacity-50"
              title="Refresh Experts list"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-[#5B21B6]' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Remove Filter Button */}
            {(activeFilterCount > 0 || search.trim().length > 0) && (
              <button
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
                    <h3 className="text-sm font-bold text-[#1F1F1F]">Filter Experts</h3>
                  </div>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="rounded-lg p-1 text-[#6B6B6B] hover:bg-[#FAF9FC] hover:text-[#1F1F1F] transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Popover Scrollable Body: Expandable Accordion Cards */}
                <div className="max-h-[55vh] overflow-y-auto p-4 space-y-3 bg-[#FAF9FC]/50">
                  {/* 1. Status Accordion (Static Options Only) */}
                  <div className="rounded-xl border border-[#EEEEF2] bg-white overflow-hidden shadow-soft-xs">
                    <button
                      type="button"
                      onClick={() => toggleSection('status')}
                      className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-[#1F1F1F] hover:bg-[#FAF9FC] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span>Partner Status</span>
                        {draftStatuses.length > 0 && !draftStatuses.includes('All Status') && (
                          <span className="text-[10px] font-semibold text-[#5B21B6] bg-[#EDE9FE] px-2 py-0.5 rounded-full">
                            {draftStatuses.length === 1 ? draftStatuses[0] : `${draftStatuses.length} selected`}
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
                        {STATIC_EXPERT_STATUSES.map((st) => {
                          const isSelected =
                            st.id === 'All Status'
                              ? draftStatuses.length === 0 || draftStatuses.includes('All Status')
                              : draftStatuses.includes(st.id);

                          return (
                            <button
                              key={st.id}
                              type="button"
                              onClick={() => {
                                if (st.id === 'All Status') {
                                  setDraftStatuses([]);
                                } else {
                                  setDraftStatuses([st.id]);
                                }
                              }}
                              className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-xs transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-[#EDE9FE] text-[#5B21B6] font-bold'
                                  : 'text-[#1F1F1F] hover:bg-[#FAF9FC]'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${st.dotColor}`} />
                                <span>{st.label}</span>
                              </div>
                              {isSelected && <Check className="h-3.5 w-3.5 text-[#5B21B6]" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 2. Base Area Accordion (Dynamic from existing Active Area API) */}
                  <div className="rounded-xl border border-[#EEEEF2] bg-white overflow-hidden shadow-soft-xs">
                    <button
                      type="button"
                      onClick={() => toggleSection('market')}
                      className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-[#1F1F1F] hover:bg-[#FAF9FC] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-[#5B21B6]" />
                        <span>Area</span>
                        {draftMarkets.length > 0 && !draftMarkets.includes('All Areas') && (
                          <span className="text-[10px] font-semibold text-[#5B21B6] bg-[#EDE9FE] px-2 py-0.5 rounded-full">
                            {draftMarkets.length === 1 ? draftMarkets[0] : `${draftMarkets.length} selected`}
                          </span>
                        )}
                      </div>
                      {expandedSections.market ? (
                        <ChevronUp className="h-4 w-4 text-[#5B21B6]" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-[#6B6B6B]" />
                      )}
                    </button>

                    {expandedSections.market && (
                      <div className="px-3.5 pb-3.5 pt-1 border-t border-[#EEEEF2] space-y-1.5 max-h-48 overflow-y-auto">
                        {isLoadingAreas ? (
                          <div className="flex items-center gap-2 py-2 px-2 text-xs text-[#6B6B6B]">
                            <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#5B21B6]" />
                            <span>Loading areas from API...</span>
                          </div>
                        ) : (
                          <>
                            {/* "All Areas" option */}
                            <button
                              type="button"
                              onClick={() => {
                                setDraftMarkets([]);
                              }}
                              className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-xs transition-colors cursor-pointer ${
                                draftMarkets.length === 0 || draftMarkets.includes('ALL') || draftMarkets.includes('All Areas')
                                  ? 'bg-[#EDE9FE] text-[#5B21B6] font-bold'
                                  : 'text-[#1F1F1F] hover:bg-[#FAF9FC]'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-gray-400" />
                                <span>All Areas</span>
                              </div>
                              {(draftMarkets.length === 0 || draftMarkets.includes('ALL') || draftMarkets.includes('All Areas')) && (
                                <Check className="h-3.5 w-3.5 text-[#5B21B6]" />
                              )}
                            </button>

                            {/* Dynamic area options from existing API response */}
                            {availableAreas.map((area) => {
                              const isSelected = draftMarkets.includes(area);
                              return (
                                <button
                                  key={area}
                                  type="button"
                                  onClick={() => {
                                    setDraftMarkets([area]);
                                  }}
                                  className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-xs transition-colors cursor-pointer ${
                                    isSelected
                                      ? 'bg-[#EDE9FE] text-[#5B21B6] font-bold'
                                      : 'text-[#1F1F1F] hover:bg-[#FAF9FC]'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-3 w-3 text-[#5B21B6]" />
                                    <span>{area}</span>
                                  </div>
                                  {isSelected && <Check className="h-3.5 w-3.5 text-[#5B21B6]" />}
                                </button>
                              );
                            })}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Popover Footer */}
                <div className="border-t border-[#EEEEF2] bg-white p-3.5 flex items-center justify-between gap-3 shrink-0 rounded-b-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      setDraftStatuses([]);
                      setDraftMarkets([]);
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
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#EEEEF2]">
            <span className="text-[11px] font-semibold text-[#6B6B6B]">Applied:</span>

            {/* Status chips */}
            {selectedStatuses.filter((s) => s !== 'All Status' && s !== 'ALL').map((st) => (
              <span key={st} className="inline-flex items-center gap-1.5 rounded-lg bg-[#FAF9FC] border border-[#DDD6FE] px-2.5 py-0.5 text-[11px] font-semibold text-[#5B21B6]">
                Status: {st}
                <button 
                  onClick={() => setSelectedStatuses(selectedStatuses.filter((x) => x !== st))} 
                  className="hover:text-rose-600 transition-colors cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}

            {/* Area chips */}
            {selectedMarkets.filter((m) => m !== 'All Areas' && m !== 'ALL').map((mId) => (
              <span key={mId} className="inline-flex items-center gap-1.5 rounded-lg bg-[#FAF9FC] border border-[#DDD6FE] px-2.5 py-0.5 text-[11px] font-semibold text-[#5B21B6]">
                Area: {mId}
                <button 
                  onClick={() => setSelectedMarkets(selectedMarkets.filter((x) => x !== mId))} 
                  className="hover:text-rose-600 transition-colors cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
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
            onClick={() => fetchExperts()}
            className="rounded-xl border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-[#B42318] hover:bg-rose-50 transition-colors cursor-pointer shadow-soft-xs shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Desktop View: Data Table */}
      <div className="hidden md:block w-full max-w-full overflow-hidden">
        <DataTable
          compact
          columns={columns}
          data={displayedExperts}
          keyExtractor={(w) => w.tableId || w.workerId}
          isLoading={isLoading}
          emptyTitle="No experts found"
          emptyDescription="No expert records match your active search or filter configuration."
        />
      </div>

      {/* Mobile View: Dedicated Expert Cards */}
      <div className="block md:hidden space-y-3 w-full max-w-full">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 rounded-2xl border border-[#EEEEF2] bg-white animate-pulse" />
            ))}
          </div>
        ) : displayedExperts.length === 0 ? (
          <div className="rounded-2xl border border-[#EEEEF2] bg-white p-8 text-center shadow-soft-sm">
            <h3 className="text-sm font-bold text-[#1F1F1F]">No experts found</h3>
            <p className="text-xs text-[#6B6B6B] mt-1">Try adjusting your filters or search keywords.</p>
          </div>
        ) : (
          displayedExperts.map((w) => {
            const name = (w.fullName || 'Unnamed Expert').trim();
            const rawImg = w.profileImage || (w as any).profileImg || (w as any).avatar || (w as any).photo || '';
            const imgSrc = formatImageUrl(rawImg);
            const rawStatus = w.joiningStatus || 'Active';
            const statusClean = typeof rawStatus === 'string' ? rawStatus.trim() : 'Active';

            return (
              <div
                key={w.tableId || w.workerId}
                className="rounded-2xl border border-[#EEEEF2] bg-white p-3 sm:p-3.5 shadow-soft-sm hover:border-[#5B21B6]/30 transition-all space-y-2 w-full max-w-full overflow-hidden"
              >
                {/* Card Header: Profile & Status */}
                <div className="flex items-center justify-between gap-2.5 border-b border-[#EEEEF2] pb-1.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-9 w-9 shrink-0 rounded-full overflow-hidden border border-[#EEEEF2] bg-[#EDE9FE] flex items-center justify-center relative">
                      <span className="font-bold text-xs text-[#5B21B6] select-none">
                        {name ? name.charAt(0).toUpperCase() : <User className="h-4 w-4 text-[#5B21B6]" />}
                      </span>
                      {imgSrc ? (
                        <img
                          src={imgSrc}
                          alt={name}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-[#1F1F1F] truncate" title={name}>{name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="font-mono text-[11px] text-[#6B6B6B] font-semibold">{w.workerId}</span>
                        <span className="inline-flex items-center gap-0.5 font-mono text-[10px] font-semibold text-[#5B21B6] bg-[#EDE9FE] px-1.5 py-0.5 rounded-md truncate max-w-[120px]">
                          <MapPin className="h-2.5 w-2.5 shrink-0" />
                          <span className="truncate">{w.areaName || '—'}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <StatusBadge status={statusClean} size="sm" pulse={statusClean === 'Active'} />
                  </div>
                </div>

                {/* Details Row */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
                  <div className="min-w-0">
                    <span className="text-[10px] text-[#6B6B6B] block">Mobile Number</span>
                    <span className="font-mono text-[11px] text-[#1F1F1F] font-semibold truncate block">{w.mobileNumber || '—'}</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-[#6B6B6B] block">Verification</span>
                    <span className="font-mono text-[11px] text-[#027A48] font-semibold truncate block">{w.verificationStatus || 'Verified'}</span>
                  </div>
                </div>

                {/* Footer: Actions */}
                <div className="flex items-center justify-end gap-2 pt-1.5 border-t border-[#EEEEF2]" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      const routeId = w.tableId || w.workerId;
                      navigate(`/experts/${routeId}?edit=true`, {
                        state: { tableId: w.tableId, edit: true },
                      });
                    }}
                    className="flex items-center gap-1 rounded-xl border border-[#EEEEF2] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#1F1F1F] hover:bg-[#FAF9FC] transition-all cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5 text-[#5B21B6]" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectExpert(w)}
                    title="Inspect Details"
                    aria-label="Inspect Details"
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white shadow-soft-sm transition-all cursor-pointer shrink-0"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls - Strictly 20 profiles per page */}
      {pagination.totalRecords > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border border-[#EEEEF2] bg-white px-4 py-3 rounded-2xl shadow-soft-sm w-full">
          <div className="text-xs text-[#6B6B6B]">
            Showing <strong className="text-[#1F1F1F] font-semibold">{startRecord}</strong> to{' '}
            <strong className="text-[#1F1F1F] font-semibold">{endRecord}</strong> of{' '}
            <strong className="text-[#1F1F1F] font-semibold">{pagination.totalRecords}</strong> experts (20 per page)
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Previous Button */}
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
              className="flex items-center gap-1 rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] px-3 py-1.5 text-xs font-semibold text-[#1F1F1F] hover:bg-[#EDE9FE] hover:text-[#5B21B6] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>

            {/* Page number buttons */}
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => {
              // Only show nearby pages if total pages > 7
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
              disabled={page >= pagination.totalPages || isLoading}
              className="flex items-center gap-1 rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] px-3 py-1.5 text-xs font-semibold text-[#1F1F1F] hover:bg-[#EDE9FE] hover:text-[#5B21B6] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Eye Sidebar Quick Drawer */}
      <ExpertDetailDrawer
        expert={inspectExpert}
        isOpen={Boolean(inspectExpert)}
        onClose={() => setInspectExpert(null)}
      />

      {/* New Expert Registration Modal */}
      <AddExpertModal
        isOpen={isAddExpertModalOpen}
        onClose={() => setIsAddExpertModalOpen(false)}
        onSuccess={() => {
          setPage(1);
          fetchExperts();
        }}
      />
    </div>
  );
};
