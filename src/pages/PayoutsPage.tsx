import React, { useState, useMemo } from 'react';
import { useOperations } from '../context/OperationsContext';
import { WorkerPayout, PayoutStatus } from '../types';
import { KpiCard } from '../components/common/KpiCard';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { PayoutLedgerDrawer } from '../components/payouts/PayoutLedgerDrawer';
import { SearchInput } from '../components/common/SearchInput';
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  FileText,
  Eye,
  Receipt,
  AlertCircle,
  Filter,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const PayoutsPage: React.FC = () => {
  const { payouts, markets, approvePayout, addToast } = useOperations();

  const [search, setSearch] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);

  // Popover state
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Draft states
  const [draftStatuses, setDraftStatuses] = useState<string[]>([]);
  const [draftMarkets, setDraftMarkets] = useState<string[]>([]);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    status: true,
    market: true,
  });

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [selectedPayout, setSelectedPayout] = useState<WorkerPayout | null>(null);

  // Compute Top KPIs
  const totalGross = useMemo(() => payouts.reduce((acc, p) => acc + p.gross, 0), [payouts]);
  const totalBonuses = useMemo(() => payouts.reduce((acc, p) => acc + p.bonuses, 0), [payouts]);
  const totalDeductions = useMemo(() => payouts.reduce((acc, p) => acc + p.deductions, 0), [payouts]);
  const totalNet = useMemo(() => payouts.reduce((acc, p) => acc + p.netPayable, 0), [payouts]);
  const pendingApprovalsCount = useMemo(
    () => payouts.filter((p) => p.status === 'Under Review' || p.status === 'Calculated').length,
    [payouts]
  );

  const handleOpenFilter = () => {
    setDraftStatuses([...selectedStatuses]);
    setDraftMarkets([...selectedMarkets]);
    setIsFilterOpen(true);
  };

  const handleApplyFilter = () => {
    setSelectedStatuses([...draftStatuses]);
    setSelectedMarkets([...draftMarkets]);
    setIsFilterOpen(false);
  };

  const handleRemoveFilters = () => {
    setSelectedStatuses([]);
    setSelectedMarkets([]);
    setDraftStatuses([]);
    setDraftMarkets([]);
    setSearch('');
  };

  const activeFilterCount = useMemo(() => {
    return selectedStatuses.length + selectedMarkets.length;
  }, [selectedStatuses, selectedMarkets]);

  const draftMatchingCount = useMemo(() => {
    return payouts.filter((p) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!p.workerName.toLowerCase().includes(q) && !p.workerId.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (draftStatuses.length > 0 && !draftStatuses.includes(p.status)) return false;
      if (draftMarkets.length > 0 && !draftMarkets.includes(p.areaId)) return false;
      return true;
    }).length;
  }, [payouts, search, draftStatuses, draftMarkets]);

  const filteredPayouts = useMemo(() => {
    return payouts.filter((p) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!p.workerName.toLowerCase().includes(q) && !p.workerId.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(p.status)) return false;
      if (selectedMarkets.length > 0 && !selectedMarkets.includes(p.areaId)) return false;
      return true;
    });
  }, [payouts, search, selectedStatuses, selectedMarkets]);

  const toggleItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleBatchApprove = () => {
    payouts.forEach((p) => {
      if (p.status === 'Under Review' || p.status === 'Calculated') {
        approvePayout(p.id);
      }
    });
    addToast('Batch Approval Complete', 'All pending expert payouts marked Approved.');
  };

  const columns: Column<WorkerPayout>[] = [
    {
      header: 'Expert',
      render: (p) => (
        <div>
          <div className="font-semibold text-[#1F1F1F]">{p.workerName}</div>
          <div className="font-mono text-[11px] text-[#6B6B6B]">
            {p.workerId} • {p.areaId}
          </div>
        </div>
      ),
    },
    {
      header: 'Jobs Completed',
      accessor: 'jobsCompleted',
      align: 'center',
      render: (p) => <span className="font-mono font-bold text-[#1F1F1F]">{p.jobsCompleted}</span>,
    },
    {
      header: 'Base Earnings',
      render: (p) => <span className="font-mono text-[#1F1F1F]">₹{p.baseEarnings}</span>,
    },
    {
      header: 'Bonuses & Surge',
      render: (p) => <span className="font-mono text-emerald-700 font-semibold">+₹{p.bonuses}</span>,
    },
    {
      header: 'Deductions',
      render: (p) => (
        <span className={`font-mono ${p.deductions > 0 ? 'text-[#B42318] font-semibold' : 'text-[#6B6B6B]'}`}>
          {p.deductions > 0 ? `-₹${p.deductions}` : '₹0'}
        </span>
      ),
    },
    {
      header: 'Gross Total',
      render: (p) => <span className="font-mono font-bold text-[#1F1F1F]">₹{p.gross}</span>,
    },
    {
      header: 'Net Payable',
      render: (p) => (
        <span className="font-mono font-bold text-[#5B21B6] bg-[#EDE9FE] px-2 py-0.5 rounded-lg">
          ₹{p.netPayable}
        </span>
      ),
    },
    {
      header: 'Settlement Status',
      render: (p) => <StatusBadge status={p.status} size="sm" pulse={p.status === 'Under Review'} />,
    },
    {
      header: 'Actions',
      align: 'right',
      render: (p) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedPayout(p);
          }}
          className="rounded-xl bg-[#5B21B6] text-white px-3 py-1.5 text-xs font-semibold hover:bg-[#4C1D95] shadow-soft-sm transition-all flex items-center gap-1.5 ml-auto active:scale-95"
        >
          <Receipt className="h-3.5 w-3.5" /> Ledger Details
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F1F1F] flex items-center gap-2">
            Daily Expert Payout Console
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6B6B] mt-0.5">
            Audit itemized expert earnings, incentive bonuses, uniform deductions, and disburse daily settlements.
          </p>
        </div>

        {pendingApprovalsCount > 0 && (
          <button
            onClick={handleBatchApprove}
            className="rounded-xl bg-[#5B21B6] px-4 py-2 text-xs font-semibold text-white shadow-soft-sm hover:bg-[#4C1D95] transition-all active:scale-95 flex items-center gap-1.5"
          >
            <CheckCircle2 className="h-4 w-4" />
            Approve All Pending ({pendingApprovalsCount})
          </button>
        )}
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <KpiCard
          title="Total Gross"
          value={`₹${totalGross.toLocaleString()}`}
          subtext="Base + incentives"
          icon={TrendingUp}
        />
        <KpiCard
          title="Total Bonuses"
          value={`₹${totalBonuses.toLocaleString()}`}
          subtext="Peak & attendance"
          icon={CreditCard}
          variant="success"
        />
        <KpiCard
          title="Total Deductions"
          value={`₹${totalDeductions.toLocaleString()}`}
          subtext="Supplies & adjustments"
          icon={AlertCircle}
          variant={totalDeductions > 0 ? 'warning' : 'default'}
        />
        <KpiCard
          title="Net Payable"
          value={`₹${totalNet.toLocaleString()}`}
          subtext="Final disbursement"
          icon={DollarSign}
          variant="info"
        />
        <KpiCard
          title="Pending Approval"
          value={pendingApprovalsCount}
          subtext="Requires sign-off"
          icon={Clock}
          variant={pendingApprovalsCount > 0 ? 'warning' : 'default'}
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
              <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto right-3 sm:right-0 top-20 sm:top-full mt-2 z-50 w-auto sm:w-[380px] md:w-[420px] h-[480px] max-h-[82vh] flex flex-col rounded-2xl border border-[#EEEEF2] bg-white shadow-2xl shadow-purple-950/15 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Popover Header */}
                <div className="flex items-center justify-between border-b border-[#EEEEF2] p-4 bg-white shrink-0">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-[#5B21B6]" />
                    <h3 className="text-sm font-bold text-[#1F1F1F]">Filter Payouts</h3>
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
                  {/* 1. Status Accordion */}
                  <div className="rounded-xl border border-[#EEEEF2] bg-white overflow-hidden shadow-soft-xs">
                    <button
                      type="button"
                      onClick={() => toggleSection('status')}
                      className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-[#1F1F1F] hover:bg-[#FAF9FC] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span>Settlement Status</span>
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
                        {['Calculated', 'Under Review', 'Approved', 'Paid', 'Draft'].map((st) => (
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
                              {payouts.filter((p) => p.status === st).length}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 2. Nano-Market Zone Accordion */}
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
                              {payouts.filter((p) => p.areaId === m.id).length}
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
                      setDraftMarkets([]);
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
                    Apply ({draftMatchingCount} records)
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
          </div>
        )}
      </div>

      {/* Payouts Table */}
      <DataTable
        columns={columns}
        data={filteredPayouts}
        keyExtractor={(p) => p.id}
        onRowClick={(p) => setSelectedPayout(p)}
        emptyTitle="No payouts found"
        emptyDescription="All expert financial ledgers have been disbursed or no records match filters."
      />

      {/* Ledger Drawer */}
      <PayoutLedgerDrawer
        payout={selectedPayout}
        isOpen={Boolean(selectedPayout)}
        onClose={() => setSelectedPayout(null)}
      />
    </div>
  );
};
