import React from 'react';
import { useOperations } from '../../../context/OperationsContext';
import { InteractiveMap } from '../../../components/operations/InteractiveMap';
import { Radio, Users, ShoppingBag, Flame, MapPin, Sparkles } from 'lucide-react';

export const LiveDispatchPage: React.FC = () => {
  const { workers, bookings, markets, runScenario1CapacityCrunch } = useOperations();

  const availableWorkersCount = workers.filter(w => w.status === 'Available').length;
  const busyWorkersCount = workers.filter(w => w.status === 'Busy' || w.status === 'Assigned' || w.status === 'Traveling').length;
  const slaRiskCount = bookings.filter(b => b.status === 'SLA Risk').length;
  const activeOrdersCount = bookings.filter(b => b.status === 'In Progress' || b.status === 'Searching').length;

  return (
    <div className="space-y-4">
      {/* Top Telemetry Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#1F1F1F] flex items-center gap-2">
            Live Tactical Dispatch
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </h1>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Geographic candidate tracking, real-time expert availability pins, and dynamic buffer radii.
          </p>
        </div>

        {/* Telemetry quick counters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-[#EEEEF2] bg-white px-3.5 py-1.5 text-xs shadow-soft-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[#6B6B6B]">Available Experts:</span>
            <span className="font-semibold text-[#1F1F1F]">{availableWorkersCount}</span>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-[#EEEEF2] bg-white px-3.5 py-1.5 text-xs shadow-soft-sm">
            <span className="h-2 w-2 rounded-full bg-[#7C3AED]" />
            <span className="text-[#6B6B6B]">Busy Experts:</span>
            <span className="font-semibold text-[#1F1F1F]">{busyWorkersCount}</span>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-[#EEEEF2] bg-white px-3.5 py-1.5 text-xs shadow-soft-sm">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[#6B6B6B]">SLA Risk:</span>
            <span className="font-bold text-[#B42318]">{slaRiskCount}</span>
          </div>

          <button
            onClick={() => runScenario1CapacityCrunch()}
            className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-[#FEF2F2] px-3.5 py-1.5 text-xs font-semibold text-[#B42318] hover:bg-rose-100 transition-all shadow-soft-sm active:scale-95"
            title="Simulate Koramangala KOR-03 Capacity Crunch"
          >
            <Flame className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
            Simulate Crunch
          </button>
        </div>
      </div>

      {/* Interactive Map Component */}
      <InteractiveMap
        workers={workers}
        bookings={bookings}
        markets={markets}
      />
    </div>
  );
};
