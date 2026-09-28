import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOperations } from '../context/OperationsContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { CapacityCrunchPanel } from '../components/markets/CapacityCrunchPanel';
import { 
  ArrowLeft, 
  MapPin, 
  Users, 
  ShoppingBag, 
  Compass, 
  Zap, 
  PauseCircle, 
  PlayCircle,
  Network, 
  Sliders,
  ChevronRight,
  Clock,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

export const MarketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    markets, 
    workers, 
    bookings, 
    expandMarketRadius, 
    toggleMarketSurge, 
    toggleMarketPause 
  } = useOperations();

  const [radiusInput, setRadiusInput] = useState<number>(500);

  const market = markets.find((m) => m.id === id);

  if (!market) {
    return (
      <div className="py-16 text-center space-y-3">
        <h2 className="text-base font-bold text-white">Nano-Market #{id} Not Found</h2>
        <button
          onClick={() => navigate('/markets')}
          className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
        >
          Return to Markets
        </button>
      </div>
    );
  }

  const marketWorkers = workers.filter((w) => w.areaId === market.id);
  const marketBookings = bookings.filter((b) => b.areaId === market.id);

  const availableWorkersCount = marketWorkers.filter((w) => w.status === 'Available').length;
  const busyWorkersCount = marketWorkers.filter((w) => w.status === 'Busy' || w.status === 'Assigned' || w.status === 'Traveling').length;
  const offlineWorkersCount = marketWorkers.filter((w) => w.status === 'Offline' || w.status === 'Unavailable').length;

  const handleApplyRadius = async () => {
    await expandMarketRadius(market.id, radiusInput);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/markets')}
            className="rounded-xl border border-[#EEEEF2] bg-white p-2 text-[#6B6B6B] hover:text-[#5B21B6] hover:bg-[#EDE9FE] shadow-soft-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-[#1F1F1F]">{market.name}</h1>
              <span className="font-mono text-xs font-semibold text-[#6B6B6B]">({market.id})</span>
              <StatusBadge status={market.status} size="md" pulse={market.capacity >= 90} />
            </div>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              {market.area} • Primary dispatch perimeter: {market.radius}m
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => toggleMarketSurge(market.id)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold border transition-all shadow-soft-sm ${
              market.surgeIncentiveActive
                ? 'bg-[#FFF7ED] border-amber-300 text-[#C2410C]'
                : 'border-[#EEEEF2] bg-white text-[#1F1F1F] hover:bg-[#FAF9FC]'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            {market.surgeIncentiveActive ? `Surge Active (${market.surgeMultiplier}x)` : 'Enable Surge Incentive'}
          </button>

          <button
            onClick={() => toggleMarketPause(market.id)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold border transition-all shadow-soft-sm ${
              market.paused
                ? 'bg-[#FEF2F2] border-rose-300 text-[#B42318]'
                : 'border-[#EEEEF2] bg-white text-[#1F1F1F] hover:bg-[#FAF9FC]'
            }`}
          >
            {market.paused ? <PlayCircle className="h-3.5 w-3.5" /> : <PauseCircle className="h-3.5 w-3.5" />}
            {market.paused ? 'Resume Market' : 'Pause Intake'}
          </button>
        </div>
      </div>

      {/* Capacity Crunch Escalation Panel (Section 17 & Scenario 1 Demonstration) */}
      <CapacityCrunchPanel market={market} />

      {/* Grid: Supply Breakdown, Demand Breakdown, Dispatch Config */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Supply Breakdown */}
        <div className="rounded-2xl border border-[#EEEEF2] bg-white p-5 shadow-soft-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#EEEEF2] pb-3">
            <h3 className="text-sm font-bold text-[#1F1F1F] uppercase tracking-wider flex items-center gap-2">
              <Users className="h-4 w-4 text-[#5B21B6]" />
              Current Expert Supply Pool
            </h3>
            <span className="font-mono text-xs text-[#5B21B6] font-bold bg-[#EDE9FE] px-2 py-0.5 rounded-lg">
              Experts: {marketWorkers.length}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-[#FAF9FC] border border-[#EEEEF2] p-3">
              <span className="text-[10px] text-[#6B6B6B] uppercase font-mono">Available</span>
              <div className="text-xl font-bold font-mono text-emerald-700 mt-1">{availableWorkersCount}</div>
            </div>
            <div className="rounded-xl bg-[#FAF9FC] border border-[#EEEEF2] p-3">
              <span className="text-[10px] text-[#6B6B6B] uppercase font-mono">Busy</span>
              <div className="text-xl font-bold font-mono text-[#7C3AED] mt-1">{busyWorkersCount}</div>
            </div>
            <div className="rounded-xl bg-[#FAF9FC] border border-[#EEEEF2] p-3">
              <span className="text-[10px] text-[#6B6B6B] uppercase font-mono">Offline</span>
              <div className="text-xl font-bold font-mono text-[#6B6B6B] mt-1">{offlineWorkersCount}</div>
            </div>
          </div>

          <div className="border-t border-[#EEEEF2] pt-3">
            <button
              onClick={() => navigate('/workers')}
              className="text-xs font-semibold text-[#5B21B6] hover:text-[#4C1D95] flex items-center gap-1"
            >
              View All Experts in this Market →
            </button>
          </div>
        </div>

        {/* Current Demand Breakdown */}
        <div className="rounded-2xl border border-[#EEEEF2] bg-white p-5 shadow-soft-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#EEEEF2] pb-3">
            <h3 className="text-sm font-bold text-[#1F1F1F] uppercase tracking-wider flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-[#5B21B6]" />
              Current Demand Load
            </h3>
            <span className="font-mono text-xs text-[#5B21B6] font-semibold">{market.activeOrders} Active</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-[#FAF9FC] border border-[#EEEEF2] p-3">
              <span className="text-[10px] text-[#6B6B6B] uppercase font-mono">Queued / Waiting</span>
              <div className="text-xl font-bold font-mono text-amber-700 mt-1">{market.queuedOrders}</div>
            </div>
            <div className="rounded-xl bg-[#FAF9FC] border border-[#EEEEF2] p-3">
              <span className="text-[10px] text-[#6B6B6B] uppercase font-mono">Expected (Next 2h)</span>
              <div className="text-xl font-bold font-mono text-[#1F1F1F] mt-1">~14 orders</div>
            </div>
          </div>

          <div className="border-t border-[#EEEEF2] pt-3">
            <button
              onClick={() => navigate('/orders')}
              className="text-xs font-semibold text-[#5B21B6] hover:text-[#4C1D95] flex items-center gap-1"
            >
              View Active Bookings in this Market →
            </button>
          </div>
        </div>

        {/* Dispatch Rules & Configuration */}
        <div className="rounded-2xl border border-[#EEEEF2] bg-white p-5 shadow-soft-sm space-y-4">
          <h3 className="text-sm font-bold text-[#1F1F1F] uppercase tracking-wider border-b border-[#EEEEF2] pb-3 flex items-center gap-2">
            <Sliders className="h-4 w-4 text-[#5B21B6]" />
            Dispatch Parameters
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#6B6B6B]">Search Radius Limit:</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="100"
                  min="200"
                  max="2500"
                  value={radiusInput}
                  onChange={(e) => setRadiusInput(Number(e.target.value))}
                  className="w-20 rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] py-1 px-2 font-mono text-[#1F1F1F] text-right focus:outline-none focus:border-[#5B21B6]"
                />
                <span className="font-mono text-[#6B6B6B]">m</span>
                <button
                  onClick={handleApplyRadius}
                  className="rounded-xl bg-[#5B21B6] px-2.5 py-1 text-white hover:bg-[#4C1D95] font-semibold shadow-soft-sm active:scale-95"
                >
                  Set
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[#EEEEF2] pt-2">
              <span className="text-[#6B6B6B]">Instant Booking Dispatch:</span>
              <span className="font-semibold text-emerald-700">Enabled (Auto-match)</span>
            </div>

            <div className="flex items-center justify-between border-t border-[#EEEEF2] pt-2">
              <span className="text-[#6B6B6B]">Max Expansion Threshold:</span>
              <span className="font-mono font-medium text-[#1F1F1F]">{market.maxRadius}m</span>
            </div>
          </div>
        </div>
      </div>

      {/* Neighboring Markets Relationships */}
      <div className="rounded-2xl border border-[#EEEEF2] bg-white p-5 shadow-soft-sm space-y-4">
        <h3 className="text-sm font-bold text-[#1F1F1F] uppercase tracking-wider flex items-center gap-2">
          <Network className="h-4 w-4 text-[#5B21B6]" />
          Neighboring Markets & Supply Sharing Interlinks
        </h3>
        <p className="text-xs text-[#6B6B6B]">
          When {market.id} reaches capacity saturation, the dispatch engine escalates candidate searches to these interconnected clusters:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {market.neighboringMarkets.map((nId) => {
            const neighbor = markets.find((m) => m.id === nId);
            return (
              <div
                key={nId}
                onClick={() => navigate(`/markets/${nId}`)}
                className="rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-3.5 hover:border-[#5B21B6]/50 hover:bg-[#F5F3FF] cursor-pointer transition-all shadow-soft-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#5B21B6]">{nId}</span>
                  <StatusBadge status={neighbor?.status || 'Healthy'} size="sm" />
                </div>
                <div className="text-xs font-semibold text-[#1F1F1F] mt-1">{neighbor?.name || nId}</div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-[#6B6B6B] font-mono">
                  <span>Available: {neighbor?.availableWorkers || 0}</span>
                  <span>Cap: {neighbor?.capacity || 0}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
