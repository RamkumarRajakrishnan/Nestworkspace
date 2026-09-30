import React, { useState, useMemo } from 'react';
import { useOperations } from '../context/OperationsContext';
import { Booking, Assignment, APPROVED_SERVICE_TYPES } from '../types';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { AssignWorkerModal } from '../components/assignments/AssignWorkerModal';
import { ReassignWorkerModal } from '../components/assignments/ReassignWorkerModal';
import { SearchInput } from '../components/common/SearchInput';
import { 
  UserCheck, 
  Share2, 
  Users, 
  Clock, 
  MapPin, 
  AlertTriangle,
  History,
  ShieldAlert,
  Flame,
  Filter,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AssignmentsPage: React.FC = () => {
  const { bookings, workers, assignments, markets } = useOperations();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedFulfillments, setSelectedFulfillments] = useState<string[]>([]);

  // Popover state
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Draft states
  const [draftMarkets, setDraftMarkets] = useState<string[]>([]);
  const [draftServices, setDraftServices] = useState<string[]>([]);
  const [draftFulfillments, setDraftFulfillments] = useState<string[]>([]);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    fulfillment: true,
    service: true,
    market: false,
  });

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [assignBooking, setAssignBooking] = useState<Booking | null>(null);
  const [reassignAssignment, setReassignAssignment] = useState<Assignment | null>(null);

  const handleOpenFilter = () => {
    setDraftMarkets([...selectedMarkets]);
    setDraftServices([...selectedServices]);
    setDraftFulfillments([...selectedFulfillments]);
    setIsFilterOpen(true);
  };

  const handleApplyFilter = () => {
    setSelectedMarkets([...draftMarkets]);
    setSelectedServices([...draftServices]);
    setSelectedFulfillments([...draftFulfillments]);
    setIsFilterOpen(false);
  };

  const handleRemoveFilters = () => {
    setSelectedMarkets([]);
    setSelectedServices([]);
    setSelectedFulfillments([]);
    setDraftMarkets([]);
    setDraftServices([]);
    setDraftFulfillments([]);
    setSearch('');
  };

  const activeFilterCount = useMemo(() => {
    return selectedMarkets.length + selectedServices.length + selectedFulfillments.length;
  }, [selectedMarkets, selectedServices, selectedFulfillments]);

  const draftMatchingCount = useMemo(() => {
    return bookings.filter((b) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!b.id.toLowerCase().includes(q) && !b.service.toLowerCase().includes(q) && !b.customer.name.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (draftMarkets.length > 0 && !draftMarkets.includes(b.areaId)) return false;
      if (draftServices.length > 0 && !draftServices.includes(b.service)) return false;
      if (draftFulfillments.length > 0) {
        const isUnassigned = b.assignedWorkerIds.length === 0;
        const isFull = b.assignedWorkerIds.length >= b.requiredWorkers;
        const isPartial = !isUnassigned && !isFull;
        const matchUnassigned = draftFulfillments.includes('UNASSIGNED') && isUnassigned;
        const matchPartial = draftFulfillments.includes('PARTIAL') && isPartial;
        const matchFull = draftFulfillments.includes('FULL') && isFull;
        if (!matchUnassigned && !matchPartial && !matchFull) return false;
      }
      return true;
    }).length;
  }, [bookings, search, draftMarkets, draftServices, draftFulfillments]);

  // Filter bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!b.id.toLowerCase().includes(q) && !b.service.toLowerCase().includes(q) && !b.customer.name.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (selectedMarkets.length > 0 && !selectedMarkets.includes(b.areaId)) return false;
      if (selectedServices.length > 0 && !selectedServices.includes(b.service)) return false;
      if (selectedFulfillments.length > 0) {
        const isUnassigned = b.assignedWorkerIds.length === 0;
        const isFull = b.assignedWorkerIds.length >= b.requiredWorkers;
        const isPartial = !isUnassigned && !isFull;
        const matchUnassigned = selectedFulfillments.includes('UNASSIGNED') && isUnassigned;
        const matchPartial = selectedFulfillments.includes('PARTIAL') && isPartial;
        const matchFull = selectedFulfillments.includes('FULL') && isFull;
        if (!matchUnassigned && !matchPartial && !matchFull) return false;
      }
      return true;
    });
  }, [bookings, search, selectedMarkets, selectedServices, selectedFulfillments]);

  const toggleItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  const columns: Column<Booking>[] = [
    {
      header: 'Booking Details',
      render: (b) => (
        <div>
          <div className="font-mono font-bold text-[#1F1F1F]">#{b.id}</div>
          <div className="text-[#1F1F1F] font-medium">{b.service}</div>
          <div className="text-[11px] text-[#6B6B6B]">{b.customer.name}</div>
        </div>
      ),
    },
    {
      header: 'Zone / Area',
      accessor: 'areaId',
      render: (b) => (
        <span className="font-mono text-[#5B21B6] font-semibold text-xs flex items-center gap-1 bg-[#EDE9FE] px-2 py-0.5 rounded-lg">
          <MapPin className="h-3 w-3 text-[#5B21B6]" />
          {b.areaId}
        </span>
      ),
    },
    {
      header: 'Start Slot',
      accessor: 'startTime',
      render: (b) => <span className="font-mono text-[#1F1F1F] text-xs font-medium">{b.startTime}</span>,
    },
    {
      header: 'Required / Assigned',
      render: (b) => {
        const isComplete = b.assignedWorkerIds.length >= b.requiredWorkers;
        return (
          <div className="text-xs">
            <span
              className={`font-mono font-bold ${
                isComplete ? 'text-emerald-700' : 'text-[#B42318]'
              }`}
            >
              {b.assignedWorkerIds.length} / {b.requiredWorkers} Experts Assigned
            </span>
          </div>
        );
      },
    },
    {
      header: 'Assigned Experts',
      render: (b) => {
        const assigned = workers.filter((w) => b.assignedWorkerIds.includes(w.id));
        if (assigned.length === 0) {
          return <span className="text-amber-700 text-xs italic">Pending allocation</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {assigned.map((w) => (
              <span
                key={w.id}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/workers/${w.id}`);
                }}
                className="rounded-lg bg-[#EDE9FE] border border-[#DDD6FE] px-2 py-0.5 text-xs text-[#5B21B6] hover:bg-[#DDD6FE] cursor-pointer font-semibold transition-colors"
              >
                {w.name.split(' ')[0]} ({w.id})
              </span>
            ))}
          </div>
        );
      },
    },
    {
      header: 'Status',
      render: (b) => <StatusBadge status={b.status} size="sm" pulse={b.status === 'SLA Risk'} />,
    },
    {
      header: 'Actions',
      align: 'right',
      render: (b) => {
        const asg = assignments.find((a) => a.bookingId === b.id && a.status !== 'Reassigned');
        return (
          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            {b.assignedWorkerIds.length < b.requiredWorkers ? (
              <button
                onClick={() => setAssignBooking(b)}
                className="rounded-xl bg-[#5B21B6] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#4C1D95] transition-all shadow-soft-sm active:scale-95"
              >
                Assign Expert
              </button>
            ) : asg ? (
              <button
                onClick={() => setReassignAssignment(asg)}
                className="rounded-xl border border-amber-300 bg-[#FFF7ED] px-3 py-1.5 text-xs font-semibold text-[#C2410C] hover:bg-amber-100 transition-colors shadow-soft-sm flex items-center gap-1"
              >
                <Share2 className="h-3 w-3" /> Reassign Expert
              </button>
            ) : null}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F1F1F] flex items-center gap-2">
            Expert Assignment & Dispatch Console
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6B6B] mt-0.5">
            Manage expert allocations, resolve scheduling conflicts, and execute high-priority reassignments.
          </p>
        </div>

        {/* Quick Scenario 2 trigger */}
        <button
          onClick={() => {
            const asg = assignments.find((a) => a.workerId === 'WRK-1001'); // Rahul
            if (asg) setReassignAssignment(asg);
          }}
          className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-[#FFF7ED] px-3.5 py-2 text-xs font-semibold text-[#C2410C] hover:bg-amber-100 transition-all shadow-soft-sm active:scale-95"
        >
          <Share2 className="h-3.5 w-3.5" />
          <span>Demo Scenario 2: Reassign Rahul Kumar</span>
        </button>
      </div>

      {/* Top Filter Bar: Only Search Bar on Left, Filter & Remove Filter on Right */}
      <div className="relative z-30 rounded-2xl border border-[#EEEEF2] bg-white p-3 sm:p-4 shadow-soft-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: ONLY Search Bar */}
          <div className="w-full sm:max-w-md">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search booking ID, customer, service..."
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
              <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto right-3 sm:right-0 top-20 sm:top-full mt-2 z-50 w-auto sm:w-[380px] md:w-[420px] h-[520px] max-h-[82vh] flex flex-col rounded-2xl border border-[#EEEEF2] bg-white shadow-2xl shadow-purple-950/15 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Popover Header */}
                <div className="flex items-center justify-between border-b border-[#EEEEF2] p-4 bg-white shrink-0">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-[#5B21B6]" />
                    <h3 className="text-sm font-bold text-[#1F1F1F]">Filter Assignments</h3>
                  </div>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="rounded-lg p-1 text-[#6B6B6B] hover:bg-[#FAF9FC] hover:text-[#1F1F1F] transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Popover Body: Accordions */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAF9FC]/50">
                  {/* 1. Fulfillment Accordion */}
                  <div className="rounded-xl border border-[#EEEEF2] bg-white overflow-hidden shadow-soft-xs">
                    <button
                      type="button"
                      onClick={() => toggleSection('fulfillment')}
                      className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-[#1F1F1F] hover:bg-[#FAF9FC] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span>Coverage State</span>
                        {draftFulfillments.length > 0 && (
                          <span className="text-[10px] font-semibold text-[#5B21B6] bg-[#EDE9FE] px-2 py-0.5 rounded-full">
                            {draftFulfillments.length}
                          </span>
                        )}
                      </div>
                      {expandedSections.fulfillment ? (
                        <ChevronUp className="h-4 w-4 text-[#5B21B6]" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-[#6B6B6B]" />
                      )}
                    </button>

                    {expandedSections.fulfillment && (
                      <div className="px-3.5 pb-3.5 pt-1 border-t border-[#EEEEF2] space-y-2">
                        {[
                          { id: 'UNASSIGNED', label: 'Unassigned / Pending Allocation' },
                          { id: 'PARTIAL', label: 'Partially Assigned' },
                          { id: 'FULL', label: 'Fully Assigned' },
                        ].map((item) => (
                          <label
                            key={item.id}
                            className="flex items-center justify-between py-1 px-1 rounded-lg hover:bg-[#FAF9FC] cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={draftFulfillments.includes(item.id)}
                                onChange={() => toggleItem(draftFulfillments, setDraftFulfillments, item.id)}
                                className="h-4 w-4 rounded border-[#DDD6FE] text-[#5B21B6] focus:ring-[#7C3AED] cursor-pointer accent-[#5B21B6]"
                              />
                              <span className="text-xs font-medium text-[#1F1F1F] select-none">
                                {item.label}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-[#6B6B6B]">
                              {
                                bookings.filter((b) => {
                                  if (item.id === 'UNASSIGNED') return b.assignedWorkerIds.length === 0;
                                  if (item.id === 'PARTIAL') return b.assignedWorkerIds.length > 0 && b.assignedWorkerIds.length < b.requiredWorkers;
                                  return b.assignedWorkerIds.length >= b.requiredWorkers;
                                }).length
                              }
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 2. Service Accordion */}
                  <div className="rounded-xl border border-[#EEEEF2] bg-white overflow-hidden shadow-soft-xs">
                    <button
                      type="button"
                      onClick={() => toggleSection('service')}
                      className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-[#1F1F1F] hover:bg-[#FAF9FC] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span>Service Category</span>
                        {draftServices.length > 0 && (
                          <span className="text-[10px] font-semibold text-[#5B21B6] bg-[#EDE9FE] px-2 py-0.5 rounded-full">
                            {draftServices.length}
                          </span>
                        )}
                      </div>
                      {expandedSections.service ? (
                        <ChevronUp className="h-4 w-4 text-[#5B21B6]" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-[#6B6B6B]" />
                      )}
                    </button>

                    {expandedSections.service && (
                      <div className="px-3.5 pb-3.5 pt-1 border-t border-[#EEEEF2] space-y-2">
                        {APPROVED_SERVICE_TYPES.map((serviceName) => (
                          <label
                            key={serviceName}
                            className="flex items-center justify-between py-1 px-1 rounded-lg hover:bg-[#FAF9FC] cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={draftServices.includes(serviceName)}
                                onChange={() => toggleItem(draftServices, setDraftServices, serviceName)}
                                className="h-4 w-4 rounded border-[#DDD6FE] text-[#5B21B6] focus:ring-[#7C3AED] cursor-pointer accent-[#5B21B6]"
                              />
                              <span className="text-xs font-medium text-[#1F1F1F] select-none">
                                {serviceName}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-[#6B6B6B]">
                              {bookings.filter((b) => b.service === serviceName).length}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 3. Market Accordion */}
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
                              {bookings.filter((b) => b.areaId === m.id).length}
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
                      setDraftServices([]);
                      setDraftFulfillments([]);
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
                    Apply ({draftMatchingCount} bookings)
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

            {/* Fulfillment chips */}
            {selectedFulfillments.map((f) => (
              <span key={f} className="inline-flex items-center gap-1.5 rounded-lg bg-[#FAF9FC] border border-[#DDD6FE] px-2.5 py-0.5 text-[11px] font-semibold text-[#5B21B6]">
                {f === 'UNASSIGNED' ? 'Unassigned' : f === 'PARTIAL' ? 'Partially Assigned' : 'Fully Assigned'}
                <button 
                  onClick={() => setSelectedFulfillments(selectedFulfillments.filter((x) => x !== f))} 
                  className="hover:text-rose-600 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}

            {/* Service chips */}
            {selectedServices.map((serv) => (
              <span key={serv} className="inline-flex items-center gap-1.5 rounded-lg bg-[#FAF9FC] border border-[#DDD6FE] px-2.5 py-0.5 text-[11px] font-semibold text-[#5B21B6]">
                {serv}
                <button 
                  onClick={() => setSelectedServices(selectedServices.filter((s) => s !== serv))} 
                  className="hover:text-rose-600 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}

            {/* Market chips */}
            {selectedMarkets.map((mId) => (
              <span key={mId} className="inline-flex items-center gap-1.5 rounded-lg bg-[#FAF9FC] border border-[#DDD6FE] px-2.5 py-0.5 text-[11px] font-semibold text-[#5B21B6]">
                Market: {mId}
                <button 
                  onClick={() => setSelectedMarkets(selectedMarkets.filter((m) => m !== mId))} 
                  className="hover:text-rose-600 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Assignments Table */}
      <DataTable
        columns={columns}
        data={filteredBookings}
        keyExtractor={(b) => b.id}
        emptyTitle="No assignments found"
        emptyDescription="All bookings are currently in terminal states or no matching filters."
      />

      {/* Audit Log Stream Preview */}
      <div className="rounded-2xl border border-[#EEEEF2] bg-white p-5 shadow-soft-sm space-y-3">
        <div className="flex items-center justify-between border-b border-[#EEEEF2] pb-3">
          <h3 className="text-sm font-bold text-[#1F1F1F] uppercase tracking-wider flex items-center gap-1.5">
            <History className="h-4 w-4 text-[#5B21B6]" />
            Recent Dispatch & Reassignment Audit Trail
          </h3>
          <span className="text-xs font-mono text-[#6B6B6B]">Recorded Live</span>
        </div>

        <div className="divide-y divide-[#EEEEF2] text-xs">
          {assignments
            .filter((a) => a.reassignmentReason || a.status === 'Reassigned')
            .slice(0, 4)
            .map((asg) => (
              <div key={asg.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[#1F1F1F]">
                    Reassigned Expert: <span className="font-mono text-[#5B21B6]">{asg.workerId}</span> to Job #{asg.bookingId}
                  </div>
                  <div className="text-[11px] text-[#6B6B6B]">
                    Justification: <span className="italic text-amber-700">{asg.reassignmentReason || 'Operational intervention'}</span>
                  </div>
                </div>
                <span className="font-mono text-[10px] text-[#6B6B6B]">{asg.assignedAt}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Modals */}
      <AssignWorkerModal
        booking={assignBooking}
        isOpen={Boolean(assignBooking)}
        onClose={() => setAssignBooking(null)}
      />

      <ReassignWorkerModal
        assignment={reassignAssignment}
        isOpen={Boolean(reassignAssignment)}
        onClose={() => setReassignAssignment(null)}
      />
    </div>
  );
};
