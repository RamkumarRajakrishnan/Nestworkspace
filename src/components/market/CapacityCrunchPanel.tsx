import React, { useState } from 'react';
import { Market, Booking } from '../../types';
import { useOperations } from '../../context/OperationsContext';
import { 
  Radio, 
  PauseCircle, 
  Zap, 
  CheckCircle2, 
  Users
} from 'lucide-react';
import { AssignWorkerModal } from '../operations/AssignWorkerModal';

interface CapacityCrunchPanelProps {
  market: Market;
}

export const CapacityCrunchPanel: React.FC<CapacityCrunchPanelProps> = ({ market }) => {
  const { 
    bookings, 
    expandMarketRadius, 
    toggleMarketSurge, 
    toggleMarketPause 
  } = useOperations();

  const [currentStage, setCurrentStage] = useState<number>(market.radius >= 1000 ? 3 : market.radius >= 500 ? 2 : 1);
  const [selectedBookingForAssign, setSelectedBookingForAssign] = useState<Booking | null>(null);

  const marketWaitingBookings = bookings.filter(
    (b) => b.areaId === market.id && (b.status === 'Searching' || b.status === 'Queued' || b.status === 'SLA Risk')
  );

  const escalationStages = [
    {
      stage: 1,
      title: 'Stage 1: Local Radius Search (300m)',
      desc: 'Initial search radius within designated nano-market cluster.',
      status: market.availableWorkers === 0 ? 'Failed: 0 experts available locally' : 'Active',
      action: 'Expand Radius to 500m',
      nextRadius: 500,
    },
    {
      stage: 2,
      title: 'Stage 2: Buffer Radius (500m)',
      desc: 'Extended perimeter search covering adjacent arterial roads.',
      status: currentStage >= 2 ? (market.availableWorkers === 0 ? 'Exhausted: No local buffer supply' : '1 Candidate Found') : 'Pending',
      action: 'Search Neighbor Markets (HSR-01 / KOR-04)',
      nextRadius: 1000,
    },
    {
      stage: 3,
      title: 'Stage 3: Neighbor Market Cross-Dispatch',
      desc: `Querying supply pools in ${market.neighboringMarkets.join(', ')}.`,
      status: currentStage >= 3 ? 'Active: Found candidate supply in HSR-01 (Arun Varma, 850m)' : 'Standby',
      action: 'Assign Neighbor Expert',
      nextRadius: 1500,
    },
    {
      stage: 4,
      title: 'Stage 4: Automated Queue & Surge Balancing',
      desc: 'Apply surge incentive multiplier & buffer arrival countdown.',
      status: market.surgeIncentiveActive ? `Active (${market.surgeMultiplier}x Surge Multiplier Enabled)` : 'Available',
      action: 'Toggle Surge Multiplier',
    },
    {
      stage: 5,
      title: 'Stage 5: Manual Supervisor Intervention',
      desc: 'Ops Manager override for forced reassignment or booking rescheduling.',
      status: 'Ready',
      action: 'Open Manual Dispatch',
    },
  ];

  const handleEscalate = async (nextRadius?: number) => {
    if (nextRadius) {
      await expandMarketRadius(market.id, nextRadius);
      setCurrentStage((prev) => Math.min(5, prev + 1));
    }
  };

  const primaryTargetBooking = marketWaitingBookings[0] || bookings.find(b => b.id === 'BK-8821');

  return (
    <div className="rounded-3xl border border-[#EEEEF2] bg-white p-6 shadow-soft-sm space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EEEEF2] pb-5">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FEF2F2] border border-[#FECDCA] text-[#B42318]">
            <Radio className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#1F1F1F]">
                Capacity Shortage & Escalation Engine
              </h3>
              <span className="rounded-full bg-[#FEF2F2] border border-[#FECDCA] px-2.5 py-0.5 text-[10px] font-bold text-[#B42318] uppercase">
                {market.status}
              </span>
            </div>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              Market <strong>{market.name} ({market.id})</strong> is at {market.capacity}% utilization with {marketWaitingBookings.length} waiting order(s).
            </p>
          </div>
        </div>

        {/* Operational Control Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => toggleMarketSurge(market.id)}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold border transition-colors ${
              market.surgeIncentiveActive
                ? 'bg-[#FFF7ED] border-[#FED7AA] text-[#C2410C]'
                : 'bg-[#F7F5FA] border-[#EEEEF2] text-[#6B6B6B] hover:text-[#1F1F1F]'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            {market.surgeIncentiveActive ? `Surge Active (${market.surgeMultiplier}x)` : 'Enable Surge Incentive'}
          </button>

          <button
            onClick={() => toggleMarketPause(market.id)}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold border transition-colors ${
              market.paused
                ? 'bg-[#FEF2F2] border-[#FECDCA] text-[#B42318]'
                : 'bg-[#F7F5FA] border-[#EEEEF2] text-[#6B6B6B] hover:text-[#1F1F1F]'
            }`}
          >
            <PauseCircle className="h-3.5 w-3.5" />
            {market.paused ? 'Resume Market' : 'Pause Intake'}
          </button>
        </div>
      </div>

      {/* Real-time State Telemetry */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-[#EEEEF2] bg-[#FAF9FC] p-3.5">
          <div className="text-[10px] uppercase font-mono text-[#6B6B6B] font-semibold">Available Experts</div>
          <div className="text-2xl font-bold font-mono text-[#B42318] mt-1">{market.availableWorkers}</div>
          <div className="text-[10px] text-[#6B6B6B]">Local supply pool</div>
        </div>
        <div className="rounded-2xl border border-[#EEEEF2] bg-[#FAF9FC] p-3.5">
          <div className="text-[10px] uppercase font-mono text-[#6B6B6B] font-semibold">Busy Experts</div>
          <div className="text-2xl font-bold font-mono text-[#5B21B6] mt-1">{market.busyWorkers}</div>
          <div className="text-[10px] text-[#6B6B6B]">100% active on jobs</div>
        </div>
        <div className="rounded-2xl border border-[#EEEEF2] bg-[#FAF9FC] p-3.5">
          <div className="text-[10px] uppercase font-mono text-[#6B6B6B] font-semibold">Search Radius</div>
          <div className="text-2xl font-bold font-mono text-[#027A48] mt-1">{market.radius}m</div>
          <div className="text-[10px] text-[#6B6B6B]">Max limit: {market.maxRadius}m</div>
        </div>
        <div className="rounded-2xl border border-[#EEEEF2] bg-[#FAF9FC] p-3.5">
          <div className="text-[10px] uppercase font-mono text-[#6B6B6B] font-semibold">Waiting Orders</div>
          <div className="text-2xl font-bold font-mono text-[#C2410C] mt-1">{marketWaitingBookings.length}</div>
          <div className="text-[10px] text-[#6B6B6B]">Requires candidate</div>
        </div>
      </div>

      {/* 5-Stage Stepper Workflow */}
      <div className="space-y-3 pt-1">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B]">
          Escalation Sequence & Auto-Interventions
        </h4>

        <div className="space-y-2.5">
          {escalationStages.map((stg) => {
            const isCompleted = currentStage > stg.stage;
            const isCurrent = currentStage === stg.stage;

            return (
              <div
                key={stg.stage}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border p-4 transition-all shadow-soft-sm ${
                  isCurrent
                    ? 'border-[#DDD6FE] bg-[#F5F3FF]'
                    : isCompleted
                    ? 'border-[#EEEEF2] bg-white'
                    : 'border-[#EEEEF2] bg-[#FAF9FC] opacity-60'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold font-mono ${
                      isCompleted
                        ? 'bg-[#10B981] text-white'
                        : isCurrent
                        ? 'bg-[#5B21B6] text-white'
                        : 'bg-[#EEEEF2] text-[#6B6B6B]'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : stg.stage}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#1F1F1F]">{stg.title}</div>
                    <div className="text-[11px] text-[#6B6B6B]">{stg.desc}</div>
                    <div className="mt-1 text-[11px] font-mono text-[#C2410C] font-semibold">
                      Status: {stg.status}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {stg.nextRadius && isCurrent && (
                    <button
                      onClick={() => handleEscalate(stg.nextRadius)}
                      className="rounded-xl bg-[#5B21B6] px-4 py-2 text-xs font-bold text-white shadow-soft-sm hover:bg-[#4C1D95] transition-all active:scale-95"
                    >
                      {stg.action} →
                    </button>
                  )}

                  {stg.stage === 3 && isCurrent && primaryTargetBooking && (
                    <button
                      onClick={() => setSelectedBookingForAssign(primaryTargetBooking)}
                      className="rounded-xl bg-[#5B21B6] px-4 py-2 text-xs font-bold text-white shadow-soft-sm hover:bg-[#4C1D95] transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <Users className="h-3.5 w-3.5" />
                      View & Assign Candidates
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Target Booking Action Bar */}
      {primaryTargetBooking && (
        <div className="flex items-center justify-between rounded-2xl border border-[#EEEEF2] bg-[#FAF9FC] p-4 text-xs">
          <div>
            <span className="text-[#6B6B6B]">Immediate Action Booking:</span>{' '}
            <strong className="text-[#1F1F1F]">#{primaryTargetBooking.id}</strong> ({primaryTargetBooking.service})
          </div>
          <button
            onClick={() => setSelectedBookingForAssign(primaryTargetBooking)}
            className="rounded-xl bg-[#5B21B6] px-4 py-2 text-xs font-bold text-white hover:bg-[#4C1D95] transition-colors shadow-soft-sm"
          >
            Assign Candidate Now →
          </button>
        </div>
      )}

      {/* Assignment Modal if launched */}
      {selectedBookingForAssign && (
        <AssignWorkerModal
          booking={selectedBookingForAssign}
          isOpen={true}
          onClose={() => setSelectedBookingForAssign(null)}
        />
      )}
    </div>
  );
};
