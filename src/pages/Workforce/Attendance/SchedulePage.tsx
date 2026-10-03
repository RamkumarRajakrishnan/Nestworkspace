import React, { useState, useMemo } from 'react';
import { useOperations } from '../../../context/OperationsContext';
import { Worker, Booking } from '../../../types';
import { SearchInput } from '../../../components/common/SearchInput';
import { BookingDetailDrawer } from '../../../components/operations/BookingDetailDrawer';
import { 
  CalendarDays, 
  MapPin, 
  Clock, 
  Filter,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SchedulePage: React.FC = () => {
  const { workers, bookings, markets } = useOperations();
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [search, setSearch] = useState('');
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  // Popover state
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Drafts
  const [draftMarkets, setDraftMarkets] = useState<string[]>([]);
  const [draftStatuses, setDraftStatuses] = useState<string[]>([]);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    market: true,
    status: true,
  });

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Time slots for Day view: 09:00 AM to 06:00 PM
  const timeSlots = [
    '09:00 AM',
    '10:30 AM',
    '12:00 PM',
    '01:30 PM',
    '03:00 PM',
    '04:30 PM',
    '06:00 PM',
  ];

  // Days for Week view
  const weekDays = [
    { label: 'Wed (Today)', date: 'Sep 23' },
    { label: 'Thu', date: 'Sep 24' },
    { label: 'Fri', date: 'Sep 25' },
    { label: 'Sat', date: 'Sep 26' },
    { label: 'Sun', date: 'Sep 27' },
  ];

  const handleOpenFilter = () => {
    setDraftMarkets([...selectedMarkets]);
    setDraftStatuses([...selectedStatuses]);
    setIsFilterOpen(true);
  };

  const handleApplyFilter = () => {
    setSelectedMarkets([...draftMarkets]);
    setSelectedStatuses([...draftStatuses]);
    setIsFilterOpen(false);
  };

  const handleRemoveFilters = () => {
    setSelectedMarkets([]);
    setSelectedStatuses([]);
    setDraftMarkets([]);
    setDraftStatuses([]);
    setSearch('');
  };

  const activeFilterCount = useMemo(() => {
    return selectedMarkets.length + selectedStatuses.length;
  }, [selectedMarkets, selectedStatuses]);

  const draftMatchingCount = useMemo(() => {
    return workers.filter((w) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!w.name.toLowerCase().includes(q) && !w.id.toLowerCase().includes(q)) return false;
      }
      if (draftMarkets.length > 0 && !draftMarkets.includes(w.areaId)) return false;
      if (draftStatuses.length > 0 && !draftStatuses.includes(w.status)) return false;
      return true;
    }).length;
  }, [workers, search, draftMarkets, draftStatuses]);

  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!w.name.toLowerCase().includes(q) && !w.id.toLowerCase().includes(q)) return false;
      }
      if (selectedMarkets.length > 0 && !selectedMarkets.includes(w.areaId)) return false;
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(w.status)) return false;
      return true;
    });
  }, [workers, search, selectedMarkets, selectedStatuses]);

  const toggleItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  // Helper to determine slot content for a worker
  const getSlotAssignment = (worker: Worker, slotIndex: number, isWeek: boolean) => {
    if (isWeek) {
      if (slotIndex === 0) {
        // Today
        if (worker.currentJobId) return { label: `#${worker.currentJobId}`, status: 'busy', bookingId: worker.currentJobId };
        if (worker.status === 'Available') return { label: 'Available', status: 'available' };
        return { label: worker.status, status: 'offline' };
      }
      // Alternate mock shifts for rest of week
      const mockKey = (worker.name.length + slotIndex) % 3;
      if (mockKey === 0) return { label: 'Job 108', status: 'busy', bookingId: 'BK-1001' };
      if (mockKey === 1) return { label: 'Available', status: 'available' };
      return { label: 'Off Duty', status: 'offline' };
    }

    // Day view time slots
    if (slotIndex === 1 && worker.currentJobId) {
      return { label: `Job #${worker.currentJobId}`, status: 'busy', bookingId: worker.currentJobId };
    }
    if (slotIndex === 0 && worker.todayJobs > 1) {
      return { label: 'Job #BK-9001', status: 'completed', bookingId: 'BK-9001' };
    }
    if (slotIndex === 3 && worker.id === 'WRK-1007') {
      return { label: 'Job #BK-2007', status: 'busy', bookingId: 'BK-2007' };
    }
    if (worker.status === 'Available') {
      return { label: 'Available', status: 'available' };
    }
    return { label: 'Standby', status: 'standby' };
  };

  const handleSlotClick = (bookingId?: string) => {
    if (bookingId) {
      const b = bookings.find((item) => item.id === bookingId);
      if (b) setSelectedBooking(b);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F1F1F] flex items-center gap-2">
            Expert Scheduling Matrix
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6B6B] mt-0.5">
            Resource time-grid allocation, shift coverage, and schedule conflict resolution.
          </p>
        </div>

        {/* View Switcher & Date Controls */}
        <div className="flex items-center gap-2.5">
          <div className="flex rounded-xl border border-[#EEEEF2] bg-white p-1 shadow-soft-sm">
            <button
              onClick={() => setViewMode('day')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                viewMode === 'day' ? 'bg-[#5B21B6] text-white shadow-soft-sm' : 'text-[#6B6B6B] hover:text-[#1F1F1F]'
              }`}
            >
              Day View (Hourly)
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                viewMode === 'week' ? 'bg-[#5B21B6] text-white shadow-soft-sm' : 'text-[#6B6B6B] hover:text-[#1F1F1F]'
              }`}
            >
              Week View
            </button>
          </div>
        </div>
      </div>

      {/* Top Filter Bar: Only Search Bar on Left, Filter & Remove Filter on Right */}
      <div className="relative z-30 rounded-2xl border border-[#EEEEF2] bg-white p-3 sm:p-4 shadow-soft-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: ONLY Search Bar */}
          <div className="w-full sm:max-w-md">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search partner name or ID..."
              className="w-full"
            />
          </div>

          {/* Right: Remove Filter button + Filter button */}
          <div className="flex items-center gap-2 sm:gap-2.5 self-start sm:self-auto shrink-0 flex-wrap relative">
            {/* Remove Filter Button */}
            {(activeFilterCount > 0 || search.trim().length > 0) && (
              <button
                onClick={handleRemoveFilters}
                className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-[#FEF2F2] px-3 py-2 text-xs font-semibold text-[#B42318] hover:bg-rose-100 transition-all shadow-soft-sm active:scale-95"
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
                    <h3 className="text-sm font-bold text-[#1F1F1F]">Filter Schedule</h3>
                  </div>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="rounded-lg p-1 text-[#6B6B6B] hover:bg-[#FAF9FC] hover:text-[#1F1F1F] transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Popover Body: Accordions */}
                <div className="max-h-[55vh] overflow-y-auto p-4 space-y-3 bg-[#FAF9FC]/50">
                  {/* 1. Market Accordion */}
                  <div className="rounded-xl border border-[#EEEEF2] bg-white overflow-hidden shadow-soft-xs">
                    <button
                      type="button"
                      onClick={() => toggleSection('market')}
                      className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-[#1F1F1F] hover:bg-[#FAF9FC] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span>Nano-Market Zone</span>
                        {draftMarkets.length > 0 && (
                          <span className="text-[10px] font-semibold text-[#5B21B6] bg-[#EDE9FE] px-2 py-0.5 rounded-full">
                            {draftMarkets.length}
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
                      <div className="px-3.5 pb-3.5 pt-1 border-t border-[#EEEEF2] space-y-2">
                        {markets.map((m) => (
                          <label
                            key={m.id}
                            className="flex items-center justify-between py-1 px-1 rounded-lg hover:bg-[#FAF9FC] cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={draftMarkets.includes(m.id)}
                                onChange={() => toggleItem(draftMarkets, setDraftMarkets, m.id)}
                                className="h-4 w-4 rounded border-[#DDD6FE] text-[#5B21B6] focus:ring-[#7C3AED] cursor-pointer accent-[#5B21B6]"
                              />
                              <span className="text-xs font-medium text-[#1F1F1F] select-none">
                                {m.id} — {m.name}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-[#6B6B6B]">
                              {workers.filter((w) => w.areaId === m.id).length}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 2. Expert Status Accordion */}
                  <div className="rounded-xl border border-[#EEEEF2] bg-white overflow-hidden shadow-soft-xs">
                    <button
                      type="button"
                      onClick={() => toggleSection('status')}
                      className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-[#1F1F1F] hover:bg-[#FAF9FC] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span>Expert Status</span>
                        {draftStatuses.length > 0 && (
                          <span className="text-[10px] font-semibold text-[#5B21B6] bg-[#EDE9FE] px-2 py-0.5 rounded-full">
                            {draftStatuses.length}
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
                      <div className="px-3.5 pb-3.5 pt-1 border-t border-[#EEEEF2] space-y-2">
                        {['Available', 'Busy', 'Assigned', 'Traveling', 'Offline'].map((st) => (
                          <label
                            key={st}
                            className="flex items-center justify-between py-1 px-1 rounded-lg hover:bg-[#FAF9FC] cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={draftStatuses.includes(st)}
                                onChange={() => toggleItem(draftStatuses, setDraftStatuses, st)}
                                className="h-4 w-4 rounded border-[#DDD6FE] text-[#5B21B6] focus:ring-[#7C3AED] cursor-pointer accent-[#5B21B6]"
                              />
                              <span className="text-xs font-medium text-[#1F1F1F] select-none">
                                {st}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-[#6B6B6B]">
                              {workers.filter((w) => w.status === st).length}
                            </span>
                          </label>
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
                      setDraftMarkets([]);
                      setDraftStatuses([]);
                    }}
                    className="text-xs font-semibold text-[#6B6B6B] hover:text-[#B42318] px-3.5 py-2 rounded-xl border border-[#EEEEF2] hover:bg-[#FEF2F2] transition-colors"
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyFilter}
                    className="flex items-center gap-1.5 rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white px-5 py-2.5 text-xs font-bold shadow-soft-sm hover:shadow-soft-md active:scale-95 transition-all"
                  >
                    Apply ({draftMatchingCount} partners)
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

            {/* Market chips */}
            {selectedMarkets.map((mId) => (
              <span key={mId} className="inline-flex items-center gap-1.5 rounded-lg bg-[#FAF9FC] border border-[#DDD6FE] px-2.5 py-0.5 text-[11px] font-semibold text-[#5B21B6]">
                Market: {mId}
                <button 
                  onClick={() => setSelectedMarkets(selectedMarkets.filter((x) => x !== mId))} 
                  className="hover:text-rose-600 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}

            {/* Status chips */}
            {selectedStatuses.map((st) => (
              <span key={st} className="inline-flex items-center gap-1.5 rounded-lg bg-[#FAF9FC] border border-[#DDD6FE] px-2.5 py-0.5 text-[11px] font-semibold text-[#5B21B6]">
                Status: {st}
                <button 
                  onClick={() => setSelectedStatuses(selectedStatuses.filter((x) => x !== st))} 
                  className="hover:text-rose-600 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Matrix Table */}
      <div className="w-full max-w-full overflow-hidden rounded-2xl border border-[#EEEEF2] bg-white shadow-soft-sm">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#EEEEF2] bg-[#FAF9FC] text-[#6B6B6B] uppercase text-[11px] font-semibold">
                <th className="py-3 px-2.5 sm:px-4 w-36 sm:w-56 min-w-[130px] sm:min-w-[224px] sticky left-0 bg-[#FAF9FC] z-10 border-r border-[#EEEEF2]">
                  Expert Name & ID
                </th>
                {viewMode === 'day'
                  ? timeSlots.map((slot) => (
                      <th key={slot} className="py-3 px-3 text-center border-r border-[#EEEEF2] font-mono">
                        {slot}
                      </th>
                    ))
                  : weekDays.map((d) => (
                      <th key={d.date} className="py-3 px-3 text-center border-r border-[#EEEEF2]">
                        <div>{d.label}</div>
                        <div className="font-mono text-[10px] text-[#6B6B6B] lowercase">{d.date}</div>
                      </th>
                    ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEEEF2] font-sans">
              {filteredWorkers.map((w) => (
                <tr key={w.id} className="hover:bg-[#F9F8FD] transition-colors">
                  {/* Worker Row Header */}
                  <td className="py-3 px-2.5 sm:px-4 w-36 sm:w-56 min-w-[130px] sm:min-w-[224px] sticky left-0 bg-white z-10 border-r border-[#EEEEF2]">
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                      <img
                        src={w.avatar}
                        alt={w.name}
                        className="h-7 w-7 rounded-full object-cover border border-[#EEEEF2] shrink-0"
                      />
                      <div className="min-w-0 truncate">
                        <div className="font-bold text-[#1F1F1F] text-xs truncate">{w.name.split(' ')[0]}</div>
                        <div className="font-mono text-[10px] text-[#6B6B6B] truncate">{w.id} • {w.areaId}</div>
                      </div>
                    </div>
                  </td>

                  {/* Schedule Slots */}
                  {(viewMode === 'day' ? timeSlots : weekDays).map((_, idx) => {
                    const slot = getSlotAssignment(w, idx, viewMode === 'week');

                    const getSlotStyle = () => {
                      switch (slot.status) {
                        case 'busy':
                          return 'bg-[#F3E8FF] border-[#DDD6FE] text-[#5B21B6] font-semibold hover:bg-[#EDE9FE]';
                        case 'completed':
                          return 'bg-[#ECFDF3] border-[#A6F4C5] text-[#027A48] font-semibold';
                        case 'available':
                          return 'bg-[#F5F3FF] border-[#EDE9FE] text-[#7C3AED] font-medium';
                        default:
                          return 'bg-[#FAF9FC] border-[#EEEEF2] text-[#6B6B6B]';
                      }
                    };

                    return (
                      <td key={idx} className="p-1.5 border-r border-[#EEEEF2] text-center">
                        <div
                          onClick={() => handleSlotClick(slot.bookingId)}
                          className={`rounded-xl border p-2 text-xs font-mono font-medium transition-all ${
                            slot.bookingId ? 'cursor-pointer hover:scale-[1.02] shadow-soft-sm' : ''
                          } ${getSlotStyle()}`}
                        >
                          {slot.label}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Drawer when clicking a slot */}
      <BookingDetailDrawer
        booking={selectedBooking}
        isOpen={Boolean(selectedBooking)}
        onClose={() => setSelectedBooking(null)}
      />
    </div>
  );
};
