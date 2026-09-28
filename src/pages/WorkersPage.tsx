import React, { useState, useMemo } from 'react';
import { useOperations } from '../context/OperationsContext';
import { Worker, APPROVED_SERVICE_TYPES } from '../types';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { SearchInput } from '../components/common/SearchInput';
import { WorkerDetailDrawer } from '../components/dispatch/WorkerDetailDrawer';
import { 
  Star, 
  MapPin, 
  Eye,
  Radio,
  Filter,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const WorkersPage: React.FC = () => {
  const { workers, markets } = useOperations();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');



  // Multi-select filter states
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [selectedCompliances, setSelectedCompliances] = useState<string[]>([]);

  // Filter Popover state
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Draft states inside the Filter Popover
  const [draftStatuses, setDraftStatuses] = useState<string[]>([]);
  const [draftSkills, setDraftSkills] = useState<string[]>([]);
  const [draftMarkets, setDraftMarkets] = useState<string[]>([]);
  const [draftCompliances, setDraftCompliances] = useState<string[]>([]);

  // Accordion sections expansion state (Status and Skills open by default)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    status: true,
    skill: true,
    market: false,
    compliance: false,
  });

  const toggleSection = (sectionKey: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  // Inspection Drawer
  const [inspectWorker, setInspectWorker] = useState<Worker | null>(null);

  // Open Popover and sync drafts with applied state
  const handleOpenFilter = () => {
    setDraftStatuses([...selectedStatuses]);
    setDraftSkills([...selectedSkills]);
    setDraftMarkets([...selectedMarkets]);
    setDraftCompliances([...selectedCompliances]);
    setIsFilterOpen(true);
  };

  // Apply draft filters
  const handleApplyFilter = () => {
    setSelectedStatuses([...draftStatuses]);
    setSelectedSkills([...draftSkills]);
    setSelectedMarkets([...draftMarkets]);
    setSelectedCompliances([...draftCompliances]);
    setIsFilterOpen(false);
  };

  // Clear all filters
  const handleRemoveFilters = () => {
    setSelectedStatuses([]);
    setSelectedSkills([]);
    setSelectedMarkets([]);
    setSelectedCompliances([]);
    setDraftStatuses([]);
    setDraftSkills([]);
    setDraftMarkets([]);
    setDraftCompliances([]);
    setSearch('');
  };

  // Count active filters (excluding search)
  const activeFilterCount = useMemo(() => {
    return (
      selectedStatuses.length +
      selectedSkills.length +
      selectedMarkets.length +
      selectedCompliances.length
    );
  }, [selectedStatuses, selectedSkills, selectedMarkets, selectedCompliances]);

  // Real-time count of workers matching draft filters (shown in Apply button)
  const draftMatchingCount = useMemo(() => {
    return workers.filter((w) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = w.name.toLowerCase().includes(q);
        const matchesId = w.id.toLowerCase().includes(q);
        const matchesPhone = w.phone.includes(q);
        if (!matchesName && !matchesId && !matchesPhone) return false;
      }
      if (draftStatuses.length > 0 && !draftStatuses.includes(w.status)) return false;
      if (draftSkills.length > 0 && !draftSkills.some((s) => w.skills.includes(s as any))) return false;
      if (draftMarkets.length > 0 && !draftMarkets.includes(w.areaId)) return false;
      if (draftCompliances.length > 0 && !draftCompliances.includes(w.complianceStatus)) return false;
      return true;
    }).length;
  }, [workers, search, draftStatuses, draftSkills, draftMarkets, draftCompliances]);

  // Actual filtered list displayed in the table / cards
  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = w.name.toLowerCase().includes(q);
        const matchesId = w.id.toLowerCase().includes(q);
        const matchesPhone = w.phone.includes(q);
        if (!matchesName && !matchesId && !matchesPhone) return false;
      }
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(w.status)) return false;
      if (selectedSkills.length > 0 && !selectedSkills.some((s) => w.skills.includes(s as any))) return false;
      if (selectedMarkets.length > 0 && !selectedMarkets.includes(w.areaId)) return false;
      if (selectedCompliances.length > 0 && !selectedCompliances.includes(w.complianceStatus)) return false;

      return true;
    });
  }, [workers, search, selectedStatuses, selectedSkills, selectedMarkets, selectedCompliances]);

  // Helper to toggle items in array
  const toggleItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  const columns: Column<Worker>[] = [
    {
      header: 'Expert Profile',
      render: (w) => (
        <div className="flex items-center gap-3">
          <img
            src={w.avatar}
            alt={w.name}
            className="h-9 w-9 rounded-full object-cover border border-[#EEEEF2]"
          />
          <div>
            <div className="font-semibold text-[#1F1F1F] hover:text-[#5B21B6] transition-colors">{w.name}</div>
            <div className="font-mono text-[11px] text-[#6B6B6B]">{w.phone}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Expert ID',
      accessor: 'id',
      render: (w) => <span className="font-mono text-[#6B6B6B] text-xs">{w.id}</span>,
    },
    {
      header: 'Zone / Market',
      accessor: 'areaId',
      render: (w) => (
        <span className="inline-flex items-center gap-1 font-mono text-[#5B21B6] font-semibold text-xs bg-[#EDE9FE] px-2 py-0.5 rounded-lg">
          <MapPin className="h-3 w-3 text-[#5B21B6]" />
          {w.areaId}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (w) => <StatusBadge status={w.status} size="sm" pulse={w.status === 'Available'} />,
    },
    {
      header: 'Current Job',
      render: (w) => (
        <span className="font-mono text-xs text-[#5B21B6] font-semibold">
          {w.currentJobId ? `#${w.currentJobId}` : <span className="text-[#6B6B6B] font-normal">Idle</span>}
        </span>
      ),
    },
    {
      header: 'Today Jobs',
      accessor: 'todayJobs',
      align: 'center',
      render: (w) => <span className="font-mono font-bold text-[#1F1F1F]">{w.todayJobs}</span>,
    },
    {
      header: 'Rating',
      render: (w) => (
        <span className="inline-flex items-center gap-1 font-mono text-amber-600 text-xs font-semibold">
          <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
          {w.rating}
        </span>
      ),
    },
    {
      header: 'Earnings Today',
      render: (w) => (
        <span className="font-mono font-bold text-emerald-700 text-xs">₹{w.todayEarnings}</span>
      ),
    },
    {
      header: 'Compliance',
      render: (w) => <StatusBadge status={w.complianceStatus} size="sm" />,
    },
    {
      header: 'Last GPS Telemetry',
      render: (w) => (
        <span
          className={`font-mono text-[11px] ${
            w.status === 'GPS Stale' ? 'text-orange-600 font-bold' : 'text-[#6B6B6B]'
          }`}
        >
          {w.lastGpsUpdate}
        </span>
      ),
    },
    {
      header: 'Actions',
      align: 'right',
      render: (w) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setInspectWorker(w)}
            className="rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-1.5 text-[#6B6B6B] hover:text-[#5B21B6] hover:bg-[#EDE9FE] transition-colors shadow-soft-sm"
            title="Inspect Expert (Quick Drawer)"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F1F1F] flex items-center gap-2">
            Expert Management Console
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6B6B] mt-0.5">
            Active service experts, live GPS state, performance ratings, and compliance health.
          </p>
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
              placeholder="Search expert by name, ID, phone..."
              className="w-full"
            />
          </div>

          {/* Right: Remove Filter button + Filter button */}
          <div className="flex items-center gap-2 sm:gap-2.5 self-start sm:self-auto shrink-0 flex-wrap relative">
            {/* Remove Filter Button (Visible only when filters or search are active) */}
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

            {/* ======================================================== */}
            {/* FLOATING FILTER POPOVER (Styled per user reference image) */}
            {/* ======================================================== */}
            {isFilterOpen && (
              <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto right-3 sm:right-0 top-20 sm:top-full mt-2 z-50 w-auto sm:w-[380px] md:w-[420px] h-[540px] max-h-[82vh] flex flex-col rounded-2xl border border-[#EEEEF2] bg-white shadow-2xl shadow-purple-950/15 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Popover Header */}
                <div className="flex items-center justify-between border-b border-[#EEEEF2] p-4 bg-white shrink-0">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-[#5B21B6]" />
                    <h3 className="text-sm font-bold text-[#1F1F1F]">Filter Experts</h3>
                  </div>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="rounded-lg p-1 text-[#6B6B6B] hover:bg-[#FAF9FC] hover:text-[#1F1F1F] transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Popover Scrollable Body: Expandable Accordion Cards */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAF9FC]/50">
                  {/* 1. Partner Status Accordion */}
                  <div className="rounded-xl border border-[#EEEEF2] bg-white overflow-hidden shadow-soft-xs">
                    <button
                      type="button"
                      onClick={() => toggleSection('status')}
                      className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-[#1F1F1F] hover:bg-[#FAF9FC] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span>Partner Status</span>
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
                        {[
                          'Available',
                          'Assigned',
                          'Busy',
                          'Traveling',
                          'GPS Stale',
                          'Offline',
                          'Unavailable',
                          'Suspended',
                        ].map((st) => (
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

                  {/* 2. Skills Accordion (Strictly Approved Service Types) */}
                  <div className="rounded-xl border border-[#EEEEF2] bg-white overflow-hidden shadow-soft-xs">
                    <button
                      type="button"
                      onClick={() => toggleSection('skill')}
                      className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-[#1F1F1F] hover:bg-[#FAF9FC] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span>Skills & Capabilities</span>
                        {draftSkills.length > 0 && (
                          <span className="text-[10px] font-semibold text-[#5B21B6] bg-[#EDE9FE] px-2 py-0.5 rounded-full">
                            {draftSkills.length}
                          </span>
                        )}
                      </div>
                      {expandedSections.skill ? (
                        <ChevronUp className="h-4 w-4 text-[#5B21B6]" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-[#6B6B6B]" />
                      )}
                    </button>

                    {expandedSections.skill && (
                      <div className="px-3.5 pb-3.5 pt-1 border-t border-[#EEEEF2] space-y-2">
                        {APPROVED_SERVICE_TYPES.map((serviceName) => (
                          <label
                            key={serviceName}
                            className="flex items-center justify-between py-1 px-1 rounded-lg hover:bg-[#FAF9FC] cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={draftSkills.includes(serviceName)}
                                onChange={() => toggleItem(draftSkills, setDraftSkills, serviceName)}
                                className="h-4 w-4 rounded border-[#DDD6FE] text-[#5B21B6] focus:ring-[#7C3AED] cursor-pointer accent-[#5B21B6]"
                              />
                              <span className="text-xs font-medium text-[#1F1F1F] select-none">
                                {serviceName}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-[#6B6B6B]">
                              {workers.filter((w) => w.skills.includes(serviceName)).length}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 3. Nano-Market Area Accordion */}
                  <div className="rounded-xl border border-[#EEEEF2] bg-white overflow-hidden shadow-soft-xs">
                    <button
                      type="button"
                      onClick={() => toggleSection('market')}
                      className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-[#1F1F1F] hover:bg-[#FAF9FC] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span>Base Nano-Market</span>
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

                  {/* 4. Compliance Health Accordion */}
                  <div className="rounded-xl border border-[#EEEEF2] bg-white overflow-hidden shadow-soft-xs">
                    <button
                      type="button"
                      onClick={() => toggleSection('compliance')}
                      className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-[#1F1F1F] hover:bg-[#FAF9FC] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span>Compliance Health</span>
                        {draftCompliances.length > 0 && (
                          <span className="text-[10px] font-semibold text-[#5B21B6] bg-[#EDE9FE] px-2 py-0.5 rounded-full">
                            {draftCompliances.length}
                          </span>
                        )}
                      </div>
                      {expandedSections.compliance ? (
                        <ChevronUp className="h-4 w-4 text-[#5B21B6]" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-[#6B6B6B]" />
                      )}
                    </button>

                    {expandedSections.compliance && (
                      <div className="px-3.5 pb-3.5 pt-1 border-t border-[#EEEEF2] space-y-2">
                        {['Verified', 'Pending', 'Expiring Soon', 'Expired'].map((cStatus) => (
                          <label
                            key={cStatus}
                            className="flex items-center justify-between py-1 px-1 rounded-lg hover:bg-[#FAF9FC] cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={draftCompliances.includes(cStatus)}
                                onChange={() => toggleItem(draftCompliances, setDraftCompliances, cStatus)}
                                className="h-4 w-4 rounded border-[#DDD6FE] text-[#5B21B6] focus:ring-[#7C3AED] cursor-pointer accent-[#5B21B6]"
                              />
                              <span className="text-xs font-medium text-[#1F1F1F] select-none">
                                {cStatus}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-[#6B6B6B]">
                              {workers.filter((w) => w.complianceStatus === cStatus).length}
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
                      setDraftStatuses([]);
                      setDraftSkills([]);
                      setDraftMarkets([]);
                      setDraftCompliances([]);
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

            {/* Skills chips */}
            {selectedSkills.map((sk) => (
              <span key={sk} className="inline-flex items-center gap-1.5 rounded-lg bg-[#FAF9FC] border border-[#DDD6FE] px-2.5 py-0.5 text-[11px] font-semibold text-[#5B21B6]">
                {sk}
                <button 
                  onClick={() => setSelectedSkills(selectedSkills.filter((x) => x !== sk))} 
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
                  onClick={() => setSelectedMarkets(selectedMarkets.filter((x) => x !== mId))} 
                  className="hover:text-rose-600 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}

            {/* Compliance chips */}
            {selectedCompliances.map((cp) => (
              <span key={cp} className="inline-flex items-center gap-1.5 rounded-lg bg-[#FAF9FC] border border-[#DDD6FE] px-2.5 py-0.5 text-[11px] font-semibold text-[#5B21B6]">
                Compliance: {cp}
                <button 
                  onClick={() => setSelectedCompliances(selectedCompliances.filter((x) => x !== cp))} 
                  className="hover:text-rose-600 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Desktop View: Data Table (Hidden on small screens) */}
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={filteredWorkers}
          keyExtractor={(w) => w.id}
          onRowClick={(w) => setInspectWorker(w)}
          emptyTitle="No experts found"
          emptyDescription="No expert records match your active search or filter configuration."
        />
      </div>

      {/* Mobile View: Dedicated Expert Cards (Shown on mobile & small tablets) */}
      <div className="block md:hidden space-y-3">
        {filteredWorkers.length === 0 ? (
          <div className="rounded-2xl border border-[#EEEEF2] bg-white p-8 text-center shadow-soft-sm">
            <h3 className="text-sm font-bold text-[#1F1F1F]">No experts found</h3>
            <p className="text-xs text-[#6B6B6B] mt-1">Try adjusting your filters or search keywords.</p>
          </div>
        ) : (
          filteredWorkers.map((w) => (
            <div
              key={w.id}
              onClick={() => setInspectWorker(w)}
              className="rounded-2xl border border-[#EEEEF2] bg-white p-4 shadow-soft-sm hover:border-[#5B21B6]/30 transition-all cursor-pointer space-y-3"
            >
              {/* Card Header: Profile & Status */}
              <div className="flex items-center justify-between gap-3 border-b border-[#EEEEF2] pb-2.5">
                <div className="flex items-center gap-3">
                  <img
                    src={w.avatar}
                    alt={w.name}
                    className="h-10 w-10 rounded-full object-cover border border-[#EEEEF2]"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-[#1F1F1F]">{w.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[11px] text-[#6B6B6B]">{w.id}</span>
                      <span className="inline-flex items-center gap-0.5 font-mono text-[11px] font-semibold text-[#5B21B6] bg-[#EDE9FE] px-1.5 py-0.5 rounded-md">
                        <MapPin className="h-2.5 w-2.5" />
                        {w.areaId}
                      </span>
                    </div>
                  </div>
                </div>
                <StatusBadge status={w.status} size="sm" pulse={w.status === 'Available'} />
              </div>

              {/* Skills Tags */}
              <div className="flex flex-wrap gap-1.5">
                {w.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="rounded-lg bg-[#FAF9FC] border border-[#EEEEF2] px-2 py-0.5 text-[10px] font-semibold text-[#1F1F1F]"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-2 rounded-xl bg-[#FAF9FC] p-2.5 text-center text-xs">
                <div>
                  <span className="text-[10px] text-[#6B6B6B] block">Rating</span>
                  <span className="inline-flex items-center justify-center gap-1 font-mono font-semibold text-amber-600 text-[11px]">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    {w.rating}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#6B6B6B] block">Today Jobs</span>
                  <span className="font-mono font-bold text-[#1F1F1F] text-[11px]">
                    {w.todayJobs}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#6B6B6B] block">Earnings</span>
                  <span className="font-mono font-bold text-emerald-700 text-[11px]">
                    ₹{w.todayEarnings}
                  </span>
                </div>
              </div>

              {/* Footer: GPS + Actions */}
              <div className="flex items-center justify-between pt-1" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-1 text-[11px] text-[#6B6B6B]">
                  <Radio className="h-3 w-3 text-[#5B21B6]" />
                  <span className={w.status === 'GPS Stale' ? 'text-orange-600 font-bold' : ''}>
                    {w.lastGpsUpdate}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setInspectWorker(w)}
                    className="flex items-center gap-1 rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white px-3 py-1.5 text-xs font-semibold shadow-soft-sm transition-all"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Inspect Details
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Inspect Drawer */}
      <WorkerDetailDrawer
        worker={inspectWorker}
        isOpen={Boolean(inspectWorker)}
        onClose={() => setInspectWorker(null)}
      />
    </div>
  );
};
