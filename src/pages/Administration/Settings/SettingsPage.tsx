import React, { useState } from 'react';
import { useOperations } from '../../../context/OperationsContext';
import { 
  Settings, 
  Sliders, 
  Store, 
  Users, 
  CreditCard, 
  Shield, 
  Database, 
  Server, 
  Zap, 
  Check, 
  Radio,
  Save
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { addToast } = useOperations();

  const [activeTab, setActiveTab] = useState<'dispatch' | 'market' | 'worker' | 'payout' | 'architecture'>('dispatch');

  // Form states
  const [initialRadius, setInitialRadius] = useState('300');
  const [maxRadius, setMaxRadius] = useState('1500');
  const [slaMinutes, setSlaMinutes] = useState('8');
  const [autoDispatch, setAutoDispatch] = useState(true);
  const [surgeThreshold, setSurgeThreshold] = useState('85');
  const [gpsTimeout, setGpsTimeout] = useState('15');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    addToast('Configuration Saved', 'Operations policy rules successfully updated in live store.');
  };

  const tabs = [
    { id: 'dispatch', label: 'Dispatch Rules', icon: Sliders },
    { id: 'market', label: 'Market Policies', icon: Store },
    { id: 'worker', label: 'Expert Rules', icon: Users },
    { id: 'payout', label: 'Payout Policies', icon: CreditCard },
    { id: 'architecture', label: 'Phase 2 Architecture Blueprint', icon: Database },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[#1F1F1F] flex items-center gap-2">
          Operations Settings & Policies
        </h1>
        <p className="text-xs text-[#6B6B6B] mt-0.5">
          Tune automated dispatch algorithms, capacity escalation triggers, and review Phase 2 backend specs.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#EEEEF2] pb-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#EDE9FE] border border-[#DDD6FE] text-[#5B21B6] shadow-soft-sm'
                  : 'bg-white border border-[#EEEEF2] text-[#6B6B6B] hover:text-[#1F1F1F] hover:bg-[#FAF9FC] shadow-soft-sm'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="rounded-2xl border border-[#EEEEF2] bg-white p-6 shadow-soft-sm">
        {activeTab === 'dispatch' && (
          <form onSubmit={handleSave} className="space-y-5">
            <h3 className="text-sm font-bold text-[#1F1F1F] uppercase tracking-wider border-b border-[#EEEEF2] pb-3">
              Automated Dispatch Algorithm Tuning
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-[#1F1F1F]">Initial Search Perimeter</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={initialRadius}
                    onChange={(e) => setInitialRadius(e.target.value)}
                    className="w-full rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-2 font-mono text-[#1F1F1F] focus:outline-none focus:border-[#5B21B6]"
                  />
                  <span className="font-mono text-[#6B6B6B]">meters</span>
                </div>
                <p className="text-[11px] text-[#6B6B6B]">First-pass candidate search radius around booking coordinates.</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#1F1F1F]">Max Auto-Expansion Radius</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={maxRadius}
                    onChange={(e) => setMaxRadius(e.target.value)}
                    className="w-full rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-2 font-mono text-[#1F1F1F] focus:outline-none focus:border-[#5B21B6]"
                  />
                  <span className="font-mono text-[#6B6B6B]">meters</span>
                </div>
                <p className="text-[11px] text-[#6B6B6B]">Hard boundary limit before triggering supervisor queue.</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#1F1F1F]">SLA Breach Warning Threshold</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={slaMinutes}
                    onChange={(e) => setSlaMinutes(e.target.value)}
                    className="w-full rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-2 font-mono text-[#1F1F1F] focus:outline-none focus:border-[#5B21B6]"
                  />
                  <span className="font-mono text-[#6B6B6B]">minutes</span>
                </div>
                <p className="text-[11px] text-[#6B6B6B]">Unassigned bookings trigger high-priority SLA Risk alarm.</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#1F1F1F]">Auto-Dispatch Matching Engine</label>
                <div className="pt-1">
                  <label className="flex items-center gap-2 text-[#1F1F1F] cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={autoDispatch}
                      onChange={(e) => setAutoDispatch(e.target.checked)}
                      className="rounded border-[#EEEEF2] text-[#5B21B6] focus:ring-0 accent-[#5B21B6]"
                    />
                    Enable automated batch candidate matching
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-[#EEEEF2] pt-4">
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-[#5B21B6] px-4 py-2 text-xs font-semibold text-white shadow-soft-sm hover:bg-[#4C1D95] transition-all active:scale-95"
              >
                <Save className="h-4 w-4" /> Save Dispatch Rules
              </button>
            </div>
          </form>
        )}

        {activeTab === 'market' && (
          <form onSubmit={handleSave} className="space-y-5">
            <h3 className="text-sm font-bold text-[#1F1F1F] uppercase tracking-wider border-b border-[#EEEEF2] pb-3">
              Nano-Market Governance & Surge Configuration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-[#1F1F1F]">Capacity Crunch Trigger Threshold</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={surgeThreshold}
                    onChange={(e) => setSurgeThreshold(e.target.value)}
                    className="w-full rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-2 font-mono text-[#1F1F1F] focus:outline-none focus:border-[#5B21B6]"
                  />
                  <span className="font-mono text-[#6B6B6B]">%</span>
                </div>
                <p className="text-[11px] text-[#6B6B6B]">
                  When utilization exceeds this level, market marks status as Tight / Critical.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#1F1F1F]">Cross-Cluster Neighbor Sharing</label>
                <p className="text-[#6B6B6B] pt-1">
                  Active for all 6 Bangalore zones (KOR-03, HSR-01, IND-02, KOR-04, BTM-01, JYN-02).
                </p>
              </div>
            </div>

            <div className="flex justify-end border-t border-[#EEEEF2] pt-4">
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-[#5B21B6] px-4 py-2 text-xs font-semibold text-white shadow-soft-sm hover:bg-[#4C1D95] transition-all active:scale-95"
              >
                <Save className="h-4 w-4" /> Save Market Policies
              </button>
            </div>
          </form>
        )}

        {activeTab === 'worker' && (
          <form onSubmit={handleSave} className="space-y-5">
            <h3 className="text-sm font-bold text-[#1F1F1F] uppercase tracking-wider border-b border-[#EEEEF2] pb-3">
              Expert Availability & Telemetry Policies
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-[#1F1F1F]">GPS Stale Heartbeat Timeout</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={gpsTimeout}
                    onChange={(e) => setGpsTimeout(e.target.value)}
                    className="w-full rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-2 font-mono text-[#1F1F1F] focus:outline-none focus:border-[#5B21B6]"
                  />
                  <span className="font-mono text-[#6B6B6B]">minutes</span>
                </div>
                <p className="text-[11px] text-[#6B6B6B]">
                  Experts not sending coordinates within this window are flagged as GPS Stale.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#1F1F1F]">Max Daily Shift Commitment</label>
                <p className="text-[#1F1F1F] font-mono pt-1">4 jobs maximum per expert / day</p>
              </div>
            </div>

            <div className="flex justify-end border-t border-[#EEEEF2] pt-4">
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-[#5B21B6] px-4 py-2 text-xs font-semibold text-white shadow-soft-sm hover:bg-[#4C1D95] transition-all active:scale-95"
              >
                <Save className="h-4 w-4" /> Save Expert Rules
              </button>
            </div>
          </form>
        )}

        {activeTab === 'payout' && (
          <div className="space-y-5 text-xs">
            <h3 className="text-sm font-bold text-[#1F1F1F] uppercase tracking-wider border-b border-[#EEEEF2] pb-3">
              Finance & Daily Settlement Configurations
            </h3>

            <div className="space-y-3 text-[#1F1F1F]">
              <div className="flex justify-between py-2 border-b border-[#EEEEF2]">
                <span className="text-[#6B6B6B]">Settlement Frequency:</span>
                <span className="font-mono font-bold text-emerald-700">Daily T+0 (23:59 IST)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#EEEEF2]">
                <span className="text-[#6B6B6B]">Approval Threshold for Auto-Disbursement:</span>
                <span className="font-mono font-semibold text-[#1F1F1F]">₹5,000 / expert</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#EEEEF2]">
                <span className="text-[#6B6B6B]">Mandatory Reason for Deductions:</span>
                <span className="font-semibold text-emerald-700">Enabled (Strict Audit)</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'architecture' && (
          <div className="space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-[#EEEEF2] pb-3">
              <h3 className="text-sm font-bold text-[#1F1F1F] uppercase tracking-wider flex items-center gap-2">
                <Database className="h-4 w-4 text-[#5B21B6]" />
                Phase 2 Architecture & Integration Blueprint
              </h3>
              <span className="rounded-lg bg-[#EDE9FE] text-[#5B21B6] font-mono font-semibold text-[10px] px-2 py-0.5">
                Ready for Backend Handoff
              </span>
            </div>

            <p className="text-[#6B6B6B] leading-relaxed">
              This frontend has been architected strictly adhering to clean service abstractions (<code>src/services/</code>). In Phase 2, the mock layer can be seamlessly replaced with real cloud infrastructure without modifying component markup or page flows:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 font-semibold text-xs">
                  <Database className="h-4 w-4" />
                  PostgreSQL & PostGIS
                </div>
                <p className="text-[#6B6B6B] leading-relaxed text-[11px]">
                  Serves as single source of truth for Workers, Orders, Payout Ledgers, and Compliance documents. PostGIS handles geospatial indexing (<code>ST_DWithin</code>) for sub-second nano-market proximity matching.
                </p>
              </div>

              <div className="rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-4 space-y-2">
                <div className="flex items-center gap-2 text-rose-700 font-semibold text-xs">
                  <Server className="h-4 w-4" />
                  Redis In-Memory State
                </div>
                <p className="text-[#6B6B6B] leading-relaxed text-[11px]">
                  Caches high-frequency partner GPS coordinates (GEOADD, GEORADIUS) and real-time availability states with sub-millisecond latencies, offloading DB read pressure.
                </p>
              </div>

              <div className="rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-4 space-y-2">
                <div className="flex items-center gap-2 text-[#5B21B6] font-semibold text-xs">
                  <Radio className="h-4 w-4" />
                  WebSockets / SSE Live Sync
                </div>
                <p className="text-[#6B6B6B] leading-relaxed text-[11px]">
                  Streams partner location updates and incoming booking events directly into <code>OperationsContext</code>, keeping tactical map markers and SLA countdown timers live in real time.
                </p>
              </div>

              <div className="rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-4 space-y-2">
                <div className="flex items-center gap-2 text-[#7C3AED] font-semibold text-xs">
                  <Zap className="h-4 w-4" />
                  Dispatch Engine Microservice
                </div>
                <p className="text-[#6B6B6B] leading-relaxed text-[11px]">
                  Autonomous matching daemon evaluating worker distance, ratings, specialized skills, and escalation stages (local → buffer → cross-market).
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
