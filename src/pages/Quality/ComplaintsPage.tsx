import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { CustomerTicketItem } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SearchInput } from '../../components/common/SearchInput';
import { CustomerTicketDetailDrawer } from '../../components/quality/CustomerTicketDetailDrawer';
import { EditTicketDrawer } from '../../components/quality/EditTicketDrawer';
import { getCustomerTickets } from '../../services/api';
import {
  Eye,
  Pencil,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  User,
  Tag
} from 'lucide-react';

const PAGE_SIZE = 15;

export const ComplaintsPage: React.FC = () => {
  const [tickets, setTickets] = useState<CustomerTicketItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Pagination
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  // Filter states
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  // Draft filter states for the popover
  const [draftStatus, setDraftStatus] = useState<string>('');
  const [draftCategory, setDraftCategory] = useState<string>('');
  const [expandedSections, setExpandedSections] = useState<{ status: boolean; category: boolean }>({
    status: false,
    category: false,
  });

  // Summary Drawer state (Eye action)
  const [inspectTicket, setInspectTicket] = useState<CustomerTicketItem | null>(null);
  const [isSummaryDrawerOpen, setIsSummaryDrawerOpen] = useState<boolean>(false);

  // Edit Drawer state (Edit / Pencil action)
  const [editTicket, setEditTicket] = useState<CustomerTicketItem | null>(null);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState<boolean>(false);

  const filterContainerRef = useRef<HTMLDivElement>(null);

  // Fetch Tickets List
  const fetchTickets = useCallback(async (isSilent = false) => {
    if (isSilent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const res = await getCustomerTickets();
      if (res.success && Array.isArray(res.data)) {
        setTickets(res.data);
      } else {
        setError(res.error || 'Failed to fetch customer tickets.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error while loading customer tickets.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Extract unique statuses and categories dynamically from real API data
  const availableStatuses = useMemo(() => {
    const set = new Set<string>();
    tickets.forEach((t) => {
      if (t.status && t.status.trim()) set.add(t.status.trim());
    });
    ['Open', 'In Progress', 'Resolved', 'Closed'].forEach((s) => set.add(s));
    return Array.from(set);
  }, [tickets]);

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    tickets.forEach((t) => {
      if (t.category && t.category.trim()) set.add(t.category.trim());
    });
    return Array.from(set);
  }, [tickets]);

  // Filter Popover handlers
  const handleOpenFilter = () => {
    setDraftStatus(selectedStatus);
    setDraftCategory(selectedCategory);
    setExpandedSections({
      status: false,
      category: false,
    });
    setIsFilterOpen(true);
  };

  const handleApplyFilters = () => {
    setSelectedStatus(draftStatus);
    setSelectedCategory(draftCategory);
    setIsFilterOpen(false);
    setPage(1);
  };

  const handleClearAllFilters = () => {
    setDraftStatus('');
    setDraftCategory('');
    setSelectedStatus('');
    setSelectedCategory('');
    setExpandedSections({
      status: false,
      category: false,
    });
    setIsFilterOpen(false);
    setPage(1);
  };

  // Close filter popover on Escape or click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterContainerRef.current && !filterContainerRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFilterOpen) {
        setIsFilterOpen(false);
      }
    };

    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFilterOpen]);

  const toggleSection = (section: 'status' | 'category') => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedStatus && selectedStatus !== 'ALL') count++;
    if (selectedCategory && selectedCategory !== 'ALL') count++;
    return count;
  }, [selectedStatus, selectedCategory]);

  // Filter & Search Tickets
  const filteredTickets = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tickets.filter((t) => {
      // Status filter
      if (selectedStatus && selectedStatus !== 'ALL') {
        if ((t.status || '').toLowerCase() !== selectedStatus.toLowerCase()) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory && selectedCategory !== 'ALL') {
        if ((t.category || '').toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
      }

      // Search match
      if (q) {
        const customerMatch = (t.customerName || '').toLowerCase().includes(q);
        const emailMatch = (t.email || '').toLowerCase().includes(q);
        const phoneMatch = String(t.phone || t.customerPhone || '').toLowerCase().includes(q);
        const subjectMatch = (t.subject || '').toLowerCase().includes(q);
        const catMatch = (t.category || '').toLowerCase().includes(q);
        const statusMatch = (t.status || '').toLowerCase().includes(q);
        const ticketIdMatch = (t.ticketId || '').toLowerCase().includes(q);

        return customerMatch || emailMatch || phoneMatch || subjectMatch || catMatch || statusMatch || ticketIdMatch;
      }

      return true;
    });
  }, [tickets, search, selectedStatus, selectedCategory]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredTickets.length / PAGE_SIZE) || 1;
  const paginatedTickets = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredTickets.slice(start, start + PAGE_SIZE);
  }, [filteredTickets, page]);

  // Action Handlers
  const handleViewTicket = (ticket: CustomerTicketItem) => {
    setInspectTicket(ticket);
    setIsSummaryDrawerOpen(true);
  };

  const handleEditTicket = (ticket: CustomerTicketItem) => {
    setEditTicket(ticket);
    setIsEditDrawerOpen(true);
  };

  const handleStatusUpdated = (tableId: string, newStatus: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.tableId === tableId ? { ...t, status: newStatus } : t))
    );
    if (inspectTicket && inspectTicket.tableId === tableId) {
      setInspectTicket((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    if (editTicket && editTicket.tableId === tableId) {
      setEditTicket((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  // EXACT COLUMN ORDER REQUIRED:
  // 1. Customer
  // 2. Contact Information (Email & Phone together, NO separate Email column)
  // 3. Subject
  // 4. Category
  // 5. Status
  // 6. Actions
  const columns: Column<CustomerTicketItem>[] = [
    {
      header: 'Customer',
      render: (t) => {
        const customerName = t.customerName?.trim();
        return (
          <div className="font-medium text-xs text-[#1F1F1F] flex items-center gap-1.5 py-1">
            <User className="h-3.5 w-3.5 text-[#6B6B6B] shrink-0" />
            <span className="truncate max-w-[180px]">
              {customerName ? customerName : '—'}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Contact Information',
      render: (t) => {
        const emailVal = t.email?.trim();
        const phoneVal = (t.phone || t.customerPhone ? String(t.phone || t.customerPhone).trim() : '');
        return (
          <div className="space-y-1 text-xs py-1">
            {emailVal && (
              <div className="flex items-center gap-1.5 text-[#6B6B6B] font-mono text-[11px] truncate max-w-[210px]">
                <Mail className="h-3 w-3 text-[#6B6B6B] shrink-0" />
                <span className="truncate">{emailVal}</span>
              </div>
            )}
            {phoneVal && (
              <div className="flex items-center gap-1.5 text-[#6B6B6B] font-mono text-[11px]">
                <Phone className="h-3 w-3 text-[#6B6B6B] shrink-0" />
                <span>{phoneVal}</span>
              </div>
            )}
            {!emailVal && !phoneVal && (
              <span className="text-[#6B6B6B] font-mono text-[11px]">—</span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Subject',
      render: (t) => (
        <div className="font-semibold text-xs text-[#1F1F1F] py-1 max-w-[260px] truncate leading-tight" title={t.subject}>
          {t.subject || '—'}
        </div>
      ),
    },
    {
      header: 'Category',
      render: (t) => (
        <div className="py-1">
          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-[#5B21B6] bg-[#EDE9FE] px-2 py-0.5 rounded-md">
            <Tag className="h-2.5 w-2.5" />
            <span>{t.category || '—'}</span>
          </span>
        </div>
      ),
    },
    {
      header: 'Status',
      align: 'center',
      render: (t) => (
        <div className="flex justify-center py-1">
          <StatusBadge status={t.status || 'Open'} size="sm" />
        </div>
      ),
    },
    {
      header: 'Actions',
      align: 'right',
      render: (t) => (
        <div className="flex items-center justify-end gap-1.5 py-1" onClick={(e) => e.stopPropagation()}>
          {/* 1. Eye / View Action */}
          <button
            type="button"
            onClick={() => handleViewTicket(t)}
            className="rounded-lg border border-[#EEEEF2] bg-[#FAF9FC] p-1.5 text-[#6B6B6B] hover:text-[#5B21B6] hover:bg-[#EDE9FE] transition-colors shadow-soft-xs cursor-pointer"
            title="View Ticket Summary"
            aria-label="View Ticket Summary"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>

          {/* 2. Edit (Pencil) Action */}
          <button
            type="button"
            onClick={() => handleEditTicket(t)}
            className="rounded-lg border border-[#EEEEF2] bg-[#FAF9FC] p-1.5 text-[#6B6B6B] hover:text-[#5B21B6] hover:bg-[#EDE9FE] transition-colors shadow-soft-xs cursor-pointer"
            title="Edit Ticket Status"
            aria-label="Edit Ticket Status"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F1F1F]">
              Complaints & Customer Tickets
            </h1>
            <span className="rounded-full bg-[#EDE9FE] px-2.5 py-0.5 text-[11px] font-semibold text-[#5B21B6]">
              Quality
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#6B6B6B] mt-0.5">
            Customer incident reports, dispute tickets, and corrective resolution queues.
          </p>
        </div>
      </div>

      {/* Top Filter Bar: Search + Refresh + Filters */}
      <div className="relative z-20 rounded-2xl border border-[#EEEEF2] bg-white p-3 sm:p-4 shadow-soft-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="w-full sm:max-w-md lg:max-w-lg">
            <SearchInput
              value={search}
              onChange={(val) => {
                setSearch(val);
                setPage(1);
              }}
              placeholder="Search by customer, email, phone, subject, category..."
              className="w-full"
            />
          </div>

          {/* Right Action Controls: Refresh + Filter */}
          <div ref={filterContainerRef} className="flex items-center gap-2 sm:gap-2.5 self-start lg:self-auto shrink-0 flex-wrap relative">
            {/* Manual Refresh Button */}
            <button
              type="button"
              onClick={() => fetchTickets(true)}
              disabled={isLoading || isRefreshing}
              className="flex items-center gap-1.5 rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] px-3.5 py-2 text-xs font-semibold text-[#1F1F1F] hover:text-[#5B21B6] hover:bg-[#EDE9FE] shadow-soft-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Refresh tickets"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading || isRefreshing ? 'animate-spin text-[#5B21B6]' : ''}`} />
              <span>Refresh</span>
            </button>

            {/* Filter Popover Toggle */}
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

            {/* Filter Backdrop for dismissal */}
            {isFilterOpen && (
              <div
                className="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs sm:bg-transparent"
                onClick={() => setIsFilterOpen(false)}
              />
            )}

            {/* Floating Filter Popover */}
            {isFilterOpen && (
              <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto right-3 sm:right-0 top-20 sm:top-full mt-2 z-50 w-auto sm:w-[380px] md:w-[420px] h-auto max-h-[85vh] flex flex-col rounded-2xl border border-[#EEEEF2] bg-white shadow-2xl shadow-purple-950/15 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Popover Header */}
                <div className="flex items-center justify-between border-b border-[#EEEEF2] p-4 bg-white shrink-0">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-[#5B21B6]" />
                    <h3 className="text-sm font-bold text-[#1F1F1F]">Filter Customer Tickets</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFilterOpen(false)}
                    className="rounded-lg p-1 text-[#6B6B6B] hover:bg-[#FAF9FC] hover:text-[#1F1F1F] transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Popover Accordion Sections */}
                <div className="max-h-[55vh] overflow-y-auto p-4 space-y-3 bg-[#FAF9FC]/50">
                  {/* Status Section */}
                  <div className="rounded-xl border border-[#EEEEF2] bg-white overflow-hidden shadow-soft-xs">
                    <button
                      type="button"
                      onClick={() => toggleSection('status')}
                      className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-[#1F1F1F] hover:bg-[#FAF9FC] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span>Ticket Status</span>
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
                          className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-xs transition-colors cursor-pointer ${
                            draftStatus === 'ALL' || draftStatus === ''
                              ? 'bg-[#EDE9FE] text-[#5B21B6] font-bold'
                              : 'text-[#1F1F1F] hover:bg-[#FAF9FC]'
                          }`}
                        >
                          <span>All Statuses</span>
                          {(draftStatus === 'ALL' || draftStatus === '') && (
                            <Check className="h-3.5 w-3.5 text-[#5B21B6]" />
                          )}
                        </button>
                        {availableStatuses.map((st) => {
                          const isSelected = draftStatus.toLowerCase() === st.toLowerCase();
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
                              <span>{st}</span>
                              {isSelected && <Check className="h-3.5 w-3.5 text-[#5B21B6]" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Category Section */}
                  <div className="rounded-xl border border-[#EEEEF2] bg-white overflow-hidden shadow-soft-xs">
                    <button
                      type="button"
                      onClick={() => toggleSection('category')}
                      className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-[#1F1F1F] hover:bg-[#FAF9FC] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Tag className="h-3.5 w-3.5 text-[#5B21B6]" />
                        <span>Ticket Category</span>
                        {draftCategory && draftCategory !== 'ALL' && (
                          <span className="text-[10px] font-semibold text-[#5B21B6] bg-[#EDE9FE] px-2 py-0.5 rounded-full">
                            {draftCategory}
                          </span>
                        )}
                      </div>
                      {expandedSections.category ? (
                        <ChevronUp className="h-4 w-4 text-[#5B21B6]" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-[#6B6B6B]" />
                      )}
                    </button>

                    {expandedSections.category && (
                      <div className="px-3.5 pb-3.5 pt-1 border-t border-[#EEEEF2] space-y-1.5">
                        <button
                          type="button"
                          onClick={() => setDraftCategory('ALL')}
                          className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-xs transition-colors cursor-pointer ${
                            draftCategory === 'ALL' || draftCategory === ''
                              ? 'bg-[#EDE9FE] text-[#5B21B6] font-bold'
                              : 'text-[#1F1F1F] hover:bg-[#FAF9FC]'
                          }`}
                        >
                          <span>All Categories</span>
                          {(draftCategory === 'ALL' || draftCategory === '') && (
                            <Check className="h-3.5 w-3.5 text-[#5B21B6]" />
                          )}
                        </button>
                        {availableCategories.map((cat) => {
                          const isSelected = draftCategory.toLowerCase() === cat.toLowerCase();
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setDraftCategory(cat)}
                              className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-xs transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-[#EDE9FE] text-[#5B21B6] font-bold'
                                  : 'text-[#1F1F1F] hover:bg-[#FAF9FC]'
                              }`}
                            >
                              <span>{cat}</span>
                              {isSelected && <Check className="h-3.5 w-3.5 text-[#5B21B6]" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Popover Footer */}
                <div className="flex items-center justify-between border-t border-[#EEEEF2] p-4 bg-white shrink-0">
                  <button
                    type="button"
                    onClick={handleClearAllFilters}
                    className="text-xs font-semibold text-[#6B6B6B] hover:text-[#B42318] transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyFilters}
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
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#EEEEF2]">
            <span className="text-[11px] font-semibold text-[#6B6B6B]">Applied:</span>

            {selectedStatus && selectedStatus !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#FAF9FC] border border-[#DDD6FE] px-2.5 py-0.5 text-[11px] font-semibold text-[#5B21B6]">
                Status: {selectedStatus}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStatus('');
                    setDraftStatus('');
                  }}
                  className="hover:text-rose-600 transition-colors cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {selectedCategory && selectedCategory !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#FAF9FC] border border-[#DDD6FE] px-2.5 py-0.5 text-[11px] font-semibold text-[#5B21B6]">
                Category: {selectedCategory}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('');
                    setDraftCategory('');
                  }}
                  className="hover:text-rose-600 transition-colors cursor-pointer"
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
            Unable to fetch real-time customer tickets from the support system. Please check your network connection and retry.
          </p>
          <button
            type="button"
            onClick={() => fetchTickets()}
            className="rounded-xl bg-[#B42318] hover:bg-rose-800 text-white px-5 py-2 text-xs font-semibold shadow-soft-sm transition-all active:scale-95 cursor-pointer"
          >
            Retry Loading Tickets
          </button>
        </div>
      )}

      {/* Desktop View: Data Table (Exact Columns: Customer, Contact Information, Subject, Category, Status, Actions) */}
      {!isLoading && !error && (
        <div className="hidden md:block">
          <DataTable
            columns={columns}
            data={paginatedTickets}
            keyExtractor={(t) => t.tableId}
            onRowClick={(t) => handleViewTicket(t)}
            emptyTitle="No customer tickets found"
            emptyDescription={
              search.trim() || activeFilterCount > 0
                ? 'No tickets match the current search or filters. Try adjusting your criteria.'
                : 'There are currently no customer support tickets logged.'
            }
          />
        </div>
      )}

      {/* Mobile View: Dedicated Ticket Cards (Shown on mobile & small screens < 768px) */}
      {!isLoading && !error && (
        <div className="block md:hidden space-y-3">
          {filteredTickets.length === 0 ? (
            <div className="rounded-2xl border border-[#EEEEF2] bg-white p-8 text-center shadow-soft-sm">
              <h3 className="text-sm font-bold text-[#1F1F1F]">No customer tickets found</h3>
              <p className="text-xs text-[#6B6B6B] mt-1">
                {search.trim() || activeFilterCount > 0
                  ? 'No tickets match your search or filters.'
                  : 'No tickets currently available.'}
              </p>
            </div>
          ) : (
            paginatedTickets.map((t) => {
              const customerName = t.customerName?.trim() || '—';
              const emailVal = t.email?.trim();
              const phoneVal = (t.phone || t.customerPhone ? String(t.phone || t.customerPhone).trim() : '');

              return (
                <div
                  key={t.tableId}
                  onClick={() => handleViewTicket(t)}
                  className="rounded-2xl border border-[#EEEEF2] bg-white p-3.5 shadow-soft-sm hover:border-[#DDD6FE] transition-all space-y-2.5 cursor-pointer"
                >
                  {/* Card Header: Category + Status */}
                  <div className="flex items-center justify-between gap-2 border-b border-[#EEEEF2] pb-2">
                    <span className="font-mono text-[11px] font-semibold text-[#5B21B6] bg-[#EDE9FE] px-2 py-0.5 rounded-lg truncate">
                      {t.category || 'Nest Booking'}
                    </span>
                    <StatusBadge status={t.status || 'Open'} size="sm" />
                  </div>

                  {/* Customer & Subject */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-[#1F1F1F]">
                      <User className="h-3.5 w-3.5 text-[#6B6B6B] shrink-0" />
                      <span className="truncate">{customerName}</span>
                    </div>
                    <p className="text-xs text-[#6B6B6B] leading-snug break-words">
                      {t.subject || 'Support Ticket'}
                    </p>
                  </div>

                  {/* Contact Information (Email & Phone together) */}
                  <div className="space-y-1 text-xs text-[#6B6B6B] pt-1.5 border-t border-[#F3F2F7]">
                    {emailVal && (
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <Mail className="h-3 w-3 text-[#6B6B6B] shrink-0" />
                        <span className="truncate">{emailVal}</span>
                      </div>
                    )}
                    {phoneVal && (
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <Phone className="h-3 w-3 text-[#6B6B6B] shrink-0" />
                        <span>{phoneVal}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Actions: Eye / View Details + Edit */}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#F3F2F7]" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleViewTicket(t)}
                      className="flex items-center gap-1.5 rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] px-3 py-1.5 text-xs font-semibold text-[#5B21B6] hover:bg-[#EDE9FE] transition-colors cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditTicket(t)}
                      className="flex items-center gap-1.5 rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] px-3 py-1.5 text-xs font-semibold text-[#5B21B6] hover:bg-[#EDE9FE] transition-colors cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Pagination Controls */}
      {!isLoading && !error && filteredTickets.length > PAGE_SIZE && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#EEEEF2] bg-white p-3 sm:p-4 shadow-soft-sm">
          <div className="text-xs text-[#6B6B6B]">
            Showing <strong className="text-[#1F1F1F] font-mono">{(page - 1) * PAGE_SIZE + 1}</strong> to{' '}
            <strong className="text-[#1F1F1F] font-mono">
              {Math.min(page * PAGE_SIZE, filteredTickets.length)}
            </strong>{' '}
            of <strong className="text-[#1F1F1F] font-mono">{filteredTickets.length}</strong> tickets
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#EEEEF2] bg-white text-[#1F1F1F] hover:bg-[#FAF9FC] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 text-xs font-mono font-semibold text-[#1F1F1F]">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#EEEEF2] bg-white text-[#1F1F1F] hover:bg-[#FAF9FC] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* 1. Summary Drawer (Eye Action) */}
      <CustomerTicketDetailDrawer
        tableId={inspectTicket?.tableId || null}
        ticketSummary={inspectTicket}
        isOpen={isSummaryDrawerOpen}
        onClose={() => setIsSummaryDrawerOpen(false)}
        onStatusUpdated={handleStatusUpdated}
      />

      {/* 2. Edit Drawer (Edit / Pencil Action) */}
      <EditTicketDrawer
        ticket={editTicket}
        isOpen={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
        onStatusUpdated={handleStatusUpdated}
      />
    </div>
  );
};
export default ComplaintsPage;
