import React from 'react';
import { useOperations } from '../context/OperationsContext';
import { Market } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { useNavigate } from 'react-router-dom';
import { 
  Store, 
  MapPin, 
  Users, 
  ShoppingBag, 
  Radio, 
  Compass, 
  Zap, 
  ChevronRight,
  Flame
} from 'lucide-react';

export const MarketsPage: React.FC = () => {
  const { markets, runScenario1CapacityCrunch } = useOperations();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#1F1F1F] flex items-center gap-2">
            Nano-Market Operations Hub
          </h1>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Micro-geography telemetry, supply-demand balancing thresholds, and cross-district expansion buffers.
          </p>
        </div>

        <button
          onClick={() => {
            runScenario1CapacityCrunch();
            navigate('/markets/KOR-03');
          }}
          className="flex items-center gap-2 rounded-xl border border-rose-200 bg-[#FEF2F2] px-3.5 py-2 text-xs font-semibold text-[#B42318] hover:bg-rose-100 transition-all shadow-soft-sm active:scale-95"
        >
          <Flame className="h-4 w-4 text-rose-500 animate-pulse" />
          <span>Trigger Scenario 1: KOR-03 Crunch Console</span>
        </button>
      </div>

      {/* Market Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {markets.map((m) => {
          const isCritical = m.capacity >= 90;
          const isTight = m.capacity >= 70 && m.capacity < 90;

          return (
            <div
              key={m.id}
              onClick={() => navigate(`/markets/${m.id}`)}
              className={`rounded-2xl border p-5 shadow-soft-sm transition-all cursor-pointer hover:shadow-soft-md ${
                isCritical
                  ? 'border-rose-200 bg-rose-50/30 hover:border-rose-400'
                  : isTight
                  ? 'border-amber-200 bg-amber-50/30 hover:border-amber-400'
                  : 'border-[#EEEEF2] bg-white hover:border-[#5B21B6]/40'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#1F1F1F]">{m.name}</h3>
                    <span className="font-mono text-xs font-semibold text-[#6B6B6B]">({m.id})</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#6B6B6B] mt-0.5">
                    <MapPin className="h-3.5 w-3.5 text-[#5B21B6]" />
                    <span>{m.area}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-bold text-[#5B21B6] bg-[#EDE9FE] px-2 py-0.5 rounded-lg">
                    Experts: {m.availableWorkers + m.busyWorkers}
                  </span>
                  <StatusBadge status={m.status} size="sm" pulse={isCritical} />
                </div>
              </div>

              {/* Capacity Progress Bar */}
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#6B6B6B]">Capacity Saturation</span>
                  <span className="font-mono font-bold text-[#1F1F1F]">{m.capacity}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#EEEEF2] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isCritical ? 'bg-rose-500' : isTight ? 'bg-amber-500' : 'bg-[#5B21B6]'
                    }`}
                    style={{ width: `${Math.min(100, m.capacity)}%` }}
                  />
                </div>
              </div>

              {/* Telemetry Numbers */}
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[#EEEEF2] pt-3 text-center">
                <div className="rounded-xl bg-[#FAF9FC] border border-[#EEEEF2] p-2">
                  <span className="text-[10px] text-[#6B6B6B] uppercase font-mono">Available</span>
                  <div className="text-sm font-bold font-mono text-emerald-700 mt-0.5">
                    {m.availableWorkers}
                  </div>
                </div>
                <div className="rounded-xl bg-[#FAF9FC] border border-[#EEEEF2] p-2">
                  <span className="text-[10px] text-[#6B6B6B] uppercase font-mono">Busy</span>
                  <div className="text-sm font-bold font-mono text-[#7C3AED] mt-0.5">
                    {m.busyWorkers}
                  </div>
                </div>
                <div className="rounded-xl bg-[#FAF9FC] border border-[#EEEEF2] p-2">
                  <span className="text-[10px] text-[#6B6B6B] uppercase font-mono">Active Orders</span>
                  <div className="text-sm font-bold font-mono text-[#1F1F1F] mt-0.5">
                    {m.activeOrders}
                  </div>
                </div>
              </div>

              {/* Bottom Neighbor Info */}
              <div className="mt-4 flex items-center justify-between border-t border-[#EEEEF2] pt-3 text-xs">
                <div className="text-[#6B6B6B]">
                  Radius: <span className="font-mono font-semibold text-[#1F1F1F]">{m.radius}m</span>
                </div>
                <div className="text-[#5B21B6] font-semibold flex items-center gap-1 hover:underline">
                  Manage Market <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
