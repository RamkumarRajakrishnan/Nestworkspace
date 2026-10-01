import React, { useState, useMemo } from 'react';
import { useOperations } from '../context/OperationsContext';
import { WorkerDocument, DocStatus } from '../types';
import { KpiCard } from '../components/common/KpiCard';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { DocumentReviewModal } from '../components/compliance/DocumentReviewModal';
import { SearchInput } from '../components/common/SearchInput';
import { 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  FileX, 
  FileCheck, 
  AlertCircle,
  Eye,
  CheckCircle2,
  Filter,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const CompliancePage: React.FC = () => {
  const { documents } = useOperations();

  const [search, setSearch] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  // Filter Popover state
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Draft states inside Popover
  const [draftStatuses, setDraftStatuses] = useState<string[]>([]);
  const [draftTypes, setDraftTypes] = useState<string[]>([]);

  // Accordion expansion state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    status: true,
    type: true,
  });

  const toggleSection = (sectionKey: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const [selectedDoc, setSelectedDoc] = useState<WorkerDocument | null>(null);

  // Compute KPIs
  const verifiedCount = documents.filter((d) => d.status === 'Verified').length;
  const pendingCount = documents.filter((d) => d.status === 'Pending').length;
  const expiringSoonCount = documents.filter((d) => d.status === 'Expiring Soon').length;
  const expiredCount = documents.filter((d) => d.status === 'Expired').length;
  const rejectedCount = documents.filter((d) => d.status === 'Rejected').length;

  const docTypes = useMemo(() => {
    return Array.from(new Set(documents.map((d) => d.type)));
  }, [documents]);

  const handleOpenFilter = () => {
    setDraftStatuses([...selectedStatuses]);
    setDraftTypes([...selectedTypes]);
    setIsFilterOpen(true);
  };

  const handleApplyFilter = () => {
    setSelectedStatuses([...draftStatuses]);
    setSelectedTypes([...draftTypes]);
    setIsFilterOpen(false);
  };

  const handleRemoveFilters = () => {
    setSelectedStatuses([]);
    setSelectedTypes([]);
    setDraftStatuses([]);
    setDraftTypes([]);
    setSearch('');
  };

  const activeFilterCount = useMemo(() => {
    return selectedStatuses.length + selectedTypes.length;
  }, [selectedStatuses, selectedTypes]);

  const draftMatchingCount = useMemo(() => {
    return documents.filter((d) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !d.workerName.toLowerCase().includes(q) &&
          !d.workerId.toLowerCase().includes(q) &&
          !d.documentNumber.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      if (draftStatuses.length > 0 && !draftStatuses.includes(d.status)) return false;
      if (draftTypes.length > 0 && !draftTypes.includes(d.type)) return false;
      return true;
    }).length;
  }, [documents, search, draftStatuses, draftTypes]);

  const filteredDocs = useMemo(() => {
    return documents.filter((d) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !d.workerName.toLowerCase().includes(q) &&
          !d.workerId.toLowerCase().includes(q) &&
          !d.documentNumber.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(d.status)) return false;
      if (selectedTypes.length > 0 && !selectedTypes.includes(d.type)) return false;
      return true;
    });
  }, [documents, search, selectedStatuses, selectedTypes]);

  const toggleItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  const columns: Column<WorkerDocument>[] = [
    {
      header: 'Expert',
      render: (d) => (
        <div>
          <div className="font-semibold text-[#1F1F1F]">{d.workerName}</div>
          <div className="font-mono text-[11px] text-[#6B6B6B]">{d.workerId}</div>
        </div>
      ),
    },
    {
      header: 'Document Type',
      accessor: 'type',
      render: (d) => <span className="font-semibold text-[#1F1F1F]">{d.type}</span>,
    },
    {
      header: 'Document / Policy ID',
      accessor: 'documentNumber',
      render: (d) => (
        <span className="font-mono text-[#5B21B6] font-semibold text-xs bg-[#EDE9FE] px-2 py-0.5 rounded-lg inline-block">
          {d.documentNumber}
        </span>
      ),
    },
    {
      header: 'Submission Date',
      accessor: 'uploadedDate',
      render: (d) => <span className="font-mono text-[#6B6B6B] text-xs">{d.uploadedDate}</span>,
    },
    {
      header: 'Expiry Date',
      accessor: 'expiryDate',
      render: (d) => (
        <span
          className={`font-mono text-xs font-semibold ${
            d.status === 'Expiring Soon' || d.status === 'Expired'
              ? 'text-[#B42318] font-bold'
              : 'text-[#1F1F1F]'
          }`}
        >
          {d.expiryDate}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (d) => <StatusBadge status={d.status} size="sm" pulse={d.status === 'Expiring Soon'} />,
    },
    {
      header: 'Actions',
      align: 'right',
      render: (d) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedDoc(d);
          }}
          className="rounded-xl bg-[#5B21B6] text-white px-3 py-1.5 text-xs font-semibold hover:bg-[#4C1D95] shadow-soft-sm transition-all flex items-center gap-1.5 ml-auto active:scale-95"
        >
          <Eye className="h-3.5 w-3.5" /> Review Document
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F1F1F] flex items-center gap-2">
          Expert Compliance & Verification
        </h1>
        <p className="text-xs sm:text-sm text-[#6B6B6B] mt-0.5">
          Audit government IDs, background checks, police verification, and insurance coverage.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard
          title="Verified"
          value={verifiedCount}
          subtext="Active on platform"
          icon={CheckCircle2}
          variant="success"
        />
        <KpiCard
          title="Pending Review"
          value={pendingCount}
          subtext="Requires approval"
          icon={Clock}
          variant={pendingCount > 0 ? 'warning' : 'default'}
        />
        <KpiCard
          title="Expiring Soon"
          value={expiringSoonCount}
          subtext="Under 30 days"
          icon={AlertTriangle}
          variant={expiringSoonCount > 0 ? 'warning' : 'default'}
        />
        <KpiCard
          title="Expired"
          value={expiredCount}
          subtext="Suspended access"
          icon={AlertCircle}
          variant={expiredCount > 0 ? 'critical' : 'default'}
        />
        <KpiCard
          title="Rejected"
          value={rejectedCount}
          subtext="Needs re-upload"
          icon={FileX}
        />
      </div>

      {/* Top Filter Bar: Only Search Bar on Left, Filter & Remove Filter on Right */}
      <div className="relative z-30 rounded-2xl border border-[#EEEEF2] bg-white p-3 sm:p-4 shadow-soft-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: ONLY Search Bar */}
          <div className="w-full sm:max-w-md">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search partner name, ID, doc number..."
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
                    <h3 className="text-sm font-bold text-[#1F1F1F]">Filter Documents</h3>
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
                  {/* 1. Status Accordion */}
                  <div className="rounded-xl border border-[#EEEEF2] bg-white overflow-hidden shadow-soft-xs">
                    <button
                      type="button"
                      onClick={() => toggleSection('status')}
                      className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-[#1F1F1F] hover:bg-[#FAF9FC] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span>Verification Status</span>
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
                        {['Verified', 'Pending', 'Expiring Soon', 'Expired', 'Rejected'].map((st) => (
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
                              {documents.filter((d) => d.status === st).length}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 2. Document Type Accordion */}
                  <div className="rounded-xl border border-[#EEEEF2] bg-white overflow-hidden shadow-soft-xs">
                    <button
                      type="button"
                      onClick={() => toggleSection('type')}
                      className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-[#1F1F1F] hover:bg-[#FAF9FC] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span>Document Category</span>
                        {draftTypes.length > 0 && (
                          <span className="text-[10px] font-semibold text-[#5B21B6] bg-[#EDE9FE] px-2 py-0.5 rounded-full">
                            {draftTypes.length}
                          </span>
                        )}
                      </div>
                      {expandedSections.type ? (
                        <ChevronUp className="h-4 w-4 text-[#5B21B6]" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-[#6B6B6B]" />
                      )}
                    </button>

                    {expandedSections.type && (
                      <div className="px-3.5 pb-3.5 pt-1 border-t border-[#EEEEF2] space-y-2">
                        {docTypes.map((t) => (
                          <label
                            key={t}
                            className="flex items-center justify-between py-1 px-1 rounded-lg hover:bg-[#FAF9FC] cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={draftTypes.includes(t)}
                                onChange={() => toggleItem(draftTypes, setDraftTypes, t)}
                                className="h-4 w-4 rounded border-[#DDD6FE] text-[#5B21B6] focus:ring-[#7C3AED] cursor-pointer accent-[#5B21B6]"
                              />
                              <span className="text-xs font-medium text-[#1F1F1F] select-none">
                                {t}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-[#6B6B6B]">
                              {documents.filter((d) => d.type === t).length}
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
                      setDraftTypes([]);
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
                    Apply ({draftMatchingCount} docs)
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

            {/* Type chips */}
            {selectedTypes.map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5 rounded-lg bg-[#FAF9FC] border border-[#DDD6FE] px-2.5 py-0.5 text-[11px] font-semibold text-[#5B21B6]">
                Type: {t}
                <button 
                  onClick={() => setSelectedTypes(selectedTypes.filter((x) => x !== t))} 
                  className="hover:text-rose-600 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Documents Table */}
      <DataTable
        columns={columns}
        data={filteredDocs}
        keyExtractor={(d) => d.id}
        onRowClick={(d) => setSelectedDoc(d)}
        emptyTitle="No documents match criteria"
        emptyDescription="All partner compliance records have been processed."
      />

      {/* Review Modal */}
      <DocumentReviewModal
        document={selectedDoc}
        isOpen={Boolean(selectedDoc)}
        onClose={() => setSelectedDoc(null)}
      />
    </div>
  );
};
