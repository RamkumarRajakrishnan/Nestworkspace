import React, { useState, useMemo } from 'react';
import { useOperations } from '../context/OperationsContext';
import { Worker, APPROVED_SERVICE_TYPES } from '../types';
import { mockEmployees } from '../data/mockEmployees';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { SearchInput } from '../components/common/SearchInput';
import { WorkerDetailDrawer } from '../components/dispatch/WorkerDetailDrawer';
import { 
  Star, 
  MapPin, 
  Eye, 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp,
  Plus
} from 'lucide-react';
import { AddEmployeeModal } from '../components/employees/AddEmployeeModal';

export const EmployeesPage: React.FC = () => {
  const { markets } = useOperations();

  // Employees data (duplicated from Experts mock data)
  const [employees, setEmployees] = useState<Worker[]>(mockEmployees);

  // Add Employee Modal state
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);

  const handleAddEmployeeSuccess = (newEmployee: Worker) => {
    setEmployees((prev) => [newEmployee, ...prev]);
  };

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

  // Accordion sections expansion state
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
  const [inspectEmployee, setInspectEmployee] = useState<Worker | null>(null);

  // Open Popover and sync drafts with applied state
  const handleOpenFilter = () => {
    setDraftStatuses([...selectedStatuses]);
    setDraftSkills([...selectedSkills]);
    setDraftMarkets([...selectedMarkets]);
    setDraftCompliances([...selectedCompliances]);
    setIsFilterOpen(true);
  };

  // Apply draft filters
  const handleApplyFilters = () => {
    setSelectedStatuses([...draftStatuses]);
    setSelectedSkills([...draftSkills]);
    setSelectedMarkets([...draftMarkets]);
    setSelectedCompliances([...draftCompliances]);
    setIsFilterOpen(false);
  };

  // Reset drafts inside popover
  const handleResetDrafts = () => {
    setDraftStatuses([]);
    setDraftSkills([]);
    setDraftMarkets([]);
    setDraftCompliances([]);
  };

  // Remove all active filters and search
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
    setIsFilterOpen(false);
  };

  // Count active filters for badge
  const activeFilterCount =
    selectedStatuses.length +
    selectedSkills.length +
    selectedMarkets.length +
    selectedCompliances.length;

  // Toggle helper for arrays
  const toggleArrayItem = (list: string[], item: string): string[] => {
    return list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
  };

  // Status options
  const statusOptions = [
    { id: 'Available', label: 'Available', color: '#10B981' },
    { id: 'Assigned', label: 'Assigned', color: '#5B21B6' },
    { id: 'Busy', label: 'Busy', color: '#7C3AED' },
    { id: 'GPS Stale', label: 'GPS Stale', color: '#F59E0B' },
    { id: 'Offline', label: 'Offline', color: '#6B6B6B' },
  ];

  // Compliance options
  const complianceOptions = [
    { id: 'Verified', label: 'Verified' },
    { id: 'Pending', label: 'Pending Review' },
    { id: 'Expiring Soon', label: 'Expiring Soon' },
    { id: 'Rejected', label: 'Rejected' },
  ];

  // Filtering logic
  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => {
      // 1. Text search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = e.name.toLowerCase().includes(q);
        const matchesId = e.id.toLowerCase().includes(q);
        const matchesPhone = e.phone.includes(q);
        const matchesArea = e.areaId.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesPhone && !matchesArea) {
          return false;
        }
      }

      // 2. Status filter
      if (selectedStatuses.length > 0) {
        if (!selectedStatuses.includes(e.status)) return false;
      }

      // 3. Skills filter
      if (selectedSkills.length > 0) {
        const hasAnySkill = selectedSkills.some((s) => e.skills.includes(s as any));
        if (!hasAnySkill) return false;
      }

      // 4. Market filter
      if (selectedMarkets.length > 0) {
        if (!selectedMarkets.includes(e.areaId)) return false;
      }

      // 5. Compliance filter
      if (selectedCompliances.length > 0) {
        if (!selectedCompliances.includes(e.complianceStatus)) return false;
      }

      return true;
    });
  }, [
    employees,
    search,
    selectedStatuses,
    selectedSkills,
    selectedMarkets,
    selectedCompliances,
  ]);

  // Desktop Table Columns
  const columns: Column<Worker>[] = [
    {
      header: 'Employee Profile',
      render: (e) => (
        <div className="flex items-center gap-3">
          <img
            src={e.avatar}
            alt={e.name}
            className="h-9 w-9 rounded-full object-cover border border-[#EEEEF2]"
          />
          <div>
            <div className="font-semibold text-[#1F1F1F] hover:text-[#5B21B6] transition-colors">{e.name}</div>
            <div className="font-mono text-[11px] text-[#6B6B6B]">{e.phone}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Employee ID',
      accessor: 'id',
      render: (e) => <span className="font-mono text-[#6B6B6B] text-xs">{e.id}</span>,
    },
    {
      header: 'Zone / Location',
      accessor: 'areaId',
      render: (e) => (
        <span className="inline-flex items-center gap-1 font-mono text-[#5B21B6] font-semibold text-xs bg-[#EDE9FE] px-2 py-0.5 rounded-lg">
          <MapPin className="h-3 w-3 text-[#5B21B6]" />
          {e.areaId}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (e) => <StatusBadge status={e.status} size="sm" pulse={e.status === 'Available'} />,
    },
    {
      header: 'Current Task',
      render: (e) => (
        <span className="font-mono text-xs text-[#5B21B6] font-semibold">
          {e.currentJobId ? `#${e.currentJobId}` : <span className="text-[#6B6B6B] font-normal">Idle</span>}
        </span>
      ),
    },
    {
      header: 'Today Tasks',
      accessor: 'todayJobs',
      align: 'center',
      render: (e) => <span className="font-mono font-bold text-[#1F1F1F]">{e.todayJobs}</span>,
    },
    {
      header: 'Rating',
      render: (e) => (
        <span className="inline-flex items-center gap-1 font-mono text-amber-600 text-xs font-semibold">
          <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
          {e.rating}
        </span>
      ),
    },
    {
      header: 'Compliance',
      render: (e) => <StatusBadge status={e.complianceStatus} size="sm" />,
    },
    {
      header: 'Actions',
      align: 'right',
      render: (e) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(ev) => ev.stopPropagation()}>
          <button
            onClick={() => setInspectEmployee(e)}
            className="rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-1.5 text-[#6B6B6B] hover:text-[#5B21B6] hover:bg-[#EDE9FE] transition-colors shadow-soft-sm cursor-pointer"
            title="Inspect Employee (Quick Drawer)"
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
            Employees
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6B6B] mt-0.5">
            Manage and monitor all internal employees and operations personnel.
          </p>
        </div>

        {/* Primary Action: + New Employee */}
        <button
          type="button"
          onClick={() => setIsAddEmployeeModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white px-4 py-2.5 text-xs sm:text-sm font-bold transition-all shadow-soft-sm hover:shadow-soft-md active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>New Employee</span>
        </button>
      </div>

      {/* Top Filter Bar */}
      <div className="relative z-30 rounded-2xl border border-[#EEEEF2] bg-white p-3 sm:p-4 shadow-soft-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Search Bar */}
          <div className="w-full sm:max-w-md">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search employee by name, ID, phone..."
              className="w-full"
            />
          </div>

          {/* Right: Remove Filter button + Filter button */}
          <div className="flex items-center gap-2 sm:gap-2.5 self-start sm:self-auto shrink-0 flex-wrap relative">
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

            {/* Backdrop for dismiss */}
            {isFilterOpen && (
              <div 
                className="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs sm:bg-transparent"
                onClick={() => setIsFilterOpen(false)}
              />
            )}

            {/* Filter Popover Panel */}
            {isFilterOpen && (
              <div 
                className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 rounded-2xl border border-[#EEEEF2] bg-white p-4 shadow-soft-xl animate-in fade-in zoom-in-95"
                style={{ maxHeight: 'calc(100vh - 240px)', overflowY: 'auto' }}
              >
                <div className="flex items-center justify-between border-b border-[#EEEEF2] pb-3">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-[#5B21B6]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F1F1F]">
                      Filter Employees
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="rounded-lg p-1 text-[#6B6B6B] hover:bg-[#FAF9FC] hover:text-[#1F1F1F]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="divide-y divide-[#EEEEF2] py-2">
                  {/* Status Section */}
                  <div className="py-2.5">
                    <button
                      type="button"
                      onClick={() => toggleSection('status')}
                      className="flex w-full items-center justify-between text-left text-xs font-bold text-[#1F1F1F]"
                    >
                      <span>Employee Status ({draftStatuses.length})</span>
                      {expandedSections.status ? <ChevronUp className="h-3.5 w-3.5 text-[#6B6B6B]" /> : <ChevronDown className="h-3.5 w-3.5 text-[#6B6B6B]" />}
                    </button>
                    {expandedSections.status && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {statusOptions.map((st) => {
                          const isSelected = draftStatuses.includes(st.id);
                          return (
                            <button
                              key={st.id}
                              type="button"
                              onClick={() => setDraftStatuses(toggleArrayItem(draftStatuses, st.id))}
                              className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold border transition-all ${
                                isSelected
                                  ? 'border-[#5B21B6] bg-[#EDE9FE] text-[#5B21B6] shadow-soft-xs'
                                  : 'border-[#EEEEF2] bg-[#FAF9FC] text-[#6B6B6B] hover:bg-[#F3F2F7]'
                              }`}
                            >
                              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: st.color }} />
                              <span>{st.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Skills Section */}
                  <div className="py-2.5">
                    <button
                      type="button"
                      onClick={() => toggleSection('skill')}
                      className="flex w-full items-center justify-between text-left text-xs font-bold text-[#1F1F1F]"
                    >
                      <span>Skills & Services ({draftSkills.length})</span>
                      {expandedSections.skill ? <ChevronUp className="h-3.5 w-3.5 text-[#6B6B6B]" /> : <ChevronDown className="h-3.5 w-3.5 text-[#6B6B6B]" />}
                    </button>
                    {expandedSections.skill && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {APPROVED_SERVICE_TYPES.map((srv) => {
                          const isSelected = draftSkills.includes(srv);
                          return (
                            <button
                              key={srv}
                              type="button"
                              onClick={() => setDraftSkills(toggleArrayItem(draftSkills, srv))}
                              className={`rounded-xl px-2.5 py-1 text-xs font-semibold border transition-all ${
                                isSelected
                                  ? 'border-[#5B21B6] bg-[#EDE9FE] text-[#5B21B6] shadow-soft-xs'
                                  : 'border-[#EEEEF2] bg-[#FAF9FC] text-[#6B6B6B] hover:bg-[#F3F2F7]'
                              }`}
                            >
                              {srv}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Markets Section */}
                  <div className="py-2.5">
                    <button
                      type="button"
                      onClick={() => toggleSection('market')}
                      className="flex w-full items-center justify-between text-left text-xs font-bold text-[#1F1F1F]"
                    >
                      <span>Markets & Clusters ({draftMarkets.length})</span>
                      {expandedSections.market ? <ChevronUp className="h-3.5 w-3.5 text-[#6B6B6B]" /> : <ChevronDown className="h-3.5 w-3.5 text-[#6B6B6B]" />}
                    </button>
                    {expandedSections.market && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {markets.map((m) => {
                          const isSelected = draftMarkets.includes(m.id);
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => setDraftMarkets(toggleArrayItem(draftMarkets, m.id))}
                              className={`rounded-xl px-2.5 py-1 text-xs font-semibold border font-mono transition-all ${
                                isSelected
                                  ? 'border-[#5B21B6] bg-[#EDE9FE] text-[#5B21B6] shadow-soft-xs'
                                  : 'border-[#EEEEF2] bg-[#FAF9FC] text-[#6B6B6B] hover:bg-[#F3F2F7]'
                              }`}
                            >
                              {m.id}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Compliance Section */}
                  <div className="py-2.5">
                    <button
                      type="button"
                      onClick={() => toggleSection('compliance')}
                      className="flex w-full items-center justify-between text-left text-xs font-bold text-[#1F1F1F]"
                    >
                      <span>Compliance Verification ({draftCompliances.length})</span>
                      {expandedSections.compliance ? <ChevronUp className="h-3.5 w-3.5 text-[#6B6B6B]" /> : <ChevronDown className="h-3.5 w-3.5 text-[#6B6B6B]" />}
                    </button>
                    {expandedSections.compliance && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {complianceOptions.map((c) => {
                          const isSelected = draftCompliances.includes(c.id);
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => setDraftCompliances(toggleArrayItem(draftCompliances, c.id))}
                              className={`rounded-xl px-2.5 py-1 text-xs font-semibold border transition-all ${
                                isSelected
                                  ? 'border-[#5B21B6] bg-[#EDE9FE] text-[#5B21B6] shadow-soft-xs'
                                  : 'border-[#EEEEF2] bg-[#FAF9FC] text-[#6B6B6B] hover:bg-[#F3F2F7]'
                              }`}
                            >
                              {c.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="mt-3 flex items-center justify-between border-t border-[#EEEEF2] pt-3">
                  <button
                    type="button"
                    onClick={handleResetDrafts}
                    className="text-xs font-bold text-[#6B6B6B] hover:text-[#B42318] transition-colors"
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyFilters}
                    className="rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white px-4 py-1.5 text-xs font-bold shadow-soft-sm transition-all active:scale-95"
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
                Skill: {sk}
                <button 
                  onClick={() => setSelectedSkills(selectedSkills.filter((x) => x !== sk))} 
                  className="hover:text-rose-600 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}

            {/* Market chips */}
            {selectedMarkets.map((mk) => (
              <span key={mk} className="inline-flex items-center gap-1.5 rounded-lg bg-[#FAF9FC] border border-[#DDD6FE] px-2.5 py-0.5 text-[11px] font-semibold text-[#5B21B6]">
                Market: {mk}
                <button 
                  onClick={() => setSelectedMarkets(selectedMarkets.filter((x) => x !== mk))} 
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
          data={filteredEmployees}
          keyExtractor={(e) => e.id}
          onRowClick={(e) => setInspectEmployee(e)}
          emptyTitle="No employees found"
          emptyDescription="No employee records match your active search or filter configuration."
        />
      </div>

      {/* Mobile View: Dedicated Employee Cards */}
      <div className="block md:hidden space-y-3">
        {filteredEmployees.length === 0 ? (
          <div className="rounded-2xl border border-[#EEEEF2] bg-white p-8 text-center shadow-soft-sm">
            <h3 className="text-sm font-bold text-[#1F1F1F]">No employees found</h3>
            <p className="text-xs text-[#6B6B6B] mt-1">Try adjusting your filters or search keywords.</p>
          </div>
        ) : (
          filteredEmployees.map((e) => (
            <div
              key={e.id}
              onClick={() => setInspectEmployee(e)}
              className="rounded-2xl border border-[#EEEEF2] bg-white p-3 sm:p-3.5 shadow-soft-sm hover:border-[#5B21B6]/30 transition-all cursor-pointer space-y-2 w-full max-w-full overflow-hidden"
            >
              {/* Card Header: Profile & Status */}
              <div className="flex items-center justify-between gap-2.5 border-b border-[#EEEEF2] pb-1.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={e.avatar}
                    alt={e.name}
                    className="h-9 w-9 rounded-full object-cover border border-[#EEEEF2] shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-[#1F1F1F] truncate">{e.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="font-mono text-[11px] text-[#6B6B6B] font-semibold">{e.id}</span>
                      <span className="inline-flex items-center gap-0.5 font-mono text-[10px] font-semibold text-[#5B21B6] bg-[#EDE9FE] px-1.5 py-0.5 rounded-md truncate">
                        <MapPin className="h-2.5 w-2.5 shrink-0" />
                        <span className="truncate">{e.areaId}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="shrink-0">
                  <StatusBadge status={e.status} size="sm" pulse={e.status === 'Available'} />
                </div>
              </div>

              {/* Skills Tags */}
              <div className="flex flex-wrap gap-1">
                {e.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center rounded-lg bg-[#FAF9FC] border border-[#EEEEF2] px-2 py-0.5 text-[10px] font-medium text-[#1F1F1F]"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {/* Footer info & Inspect button */}
              <div className="flex items-center justify-between border-t border-[#EEEEF2] pt-1.5 text-xs">
                <div className="flex items-center gap-1 font-mono text-amber-600 font-semibold">
                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                  <span>{e.rating}</span>
                </div>
                <button
                  type="button"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    setInspectEmployee(e);
                  }}
                  title="Inspect Details"
                  aria-label="Inspect Details"
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white shadow-soft-sm transition-all cursor-pointer shrink-0"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Inspect Drawer */}
      <WorkerDetailDrawer
        worker={inspectEmployee}
        isOpen={Boolean(inspectEmployee)}
        onClose={() => setInspectEmployee(null)}
      />

      {/* Add New Employee Modal */}
      <AddEmployeeModal
        isOpen={isAddEmployeeModalOpen}
        onClose={() => setIsAddEmployeeModalOpen(false)}
        onSuccess={handleAddEmployeeSuccess}
      />
    </div>
  );
};
