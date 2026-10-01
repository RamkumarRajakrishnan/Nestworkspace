import React, { useState, useEffect, useCallback } from 'react';
import { useOperations } from '../../../context/OperationsContext';
import { Market, MarketStatus } from '../../../types';
import { StatusBadge } from '../../../components/common/StatusBadge';
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
  Flame,
  Plus,
  Loader2,
  AlertCircle,
  RotateCw,
  Clock,
  Sparkles
} from 'lucide-react';
import { CreateMarketModal } from '../../../components/market/CreateMarketModal';
import { MarketDetailDrawer } from '../../../components/market/MarketDetailDrawer';
import { getNestAreas, RawNestAreaItem } from '../../../services/api';

export const MarketsPage: React.FC = () => {
  const { markets: contextMarkets, runScenario1CapacityCrunch, refreshMarkets } = useOperations();
  const navigate = useNavigate();

  // Modal and Drawer States
  const [isCreateMarketModalOpen, setIsCreateMarketModalOpen] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [selectedMarketName, setSelectedMarketName] = useState<string>('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // API Data State for Front-Page Markets List
  const [apiMarkets, setApiMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Markets List using GET https://www.haatza.com/_functions/getNestAreas
  const loadMarketsList = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await getNestAreas();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const mapped: Market[] = res.data.map((a: RawNestAreaItem, idx: number) => {
          const expertsCount = typeof a.Experts === 'number' ? a.Experts : (a.Experts ? Number(a.Experts) : 0);
          const availableCount = Math.round(expertsCount * 0.7);
          const busyCount = Math.max(0, expertsCount - availableCount);

          return {
            id: a.areaName || a.tableId,
            tableId: a.tableId,
            name: (a.areaName || '').replace(/_/g, ' '),
            area: [a.city, a.state].filter(Boolean).join(', ') || a.country || '',
            city: a.city || '',
            state: a.state || '',
            country: a.country || '',
            radius: typeof a.coverageRadius === 'number' ? a.coverageRadius : (a.coverageRadius ? Number(a.coverageRadius) : 0),
            maxRadius: 2500,
            availableWorkers: availableCount,
            busyWorkers: busyCount,
            activeOrders: 0,
            queuedOrders: 0,
            capacity: Math.min(100, Math.round(((idx + 1) / Math.max(1, res.data.length)) * 100)),
            status: (a.isActive ? (a.serviceStatus !== false ? 'Healthy' : 'Tight') : 'Critical') as MarketStatus,
            neighboringMarkets: res.data
              .filter((other: RawNestAreaItem) => other.areaName !== a.areaName)
              .map((o: RawNestAreaItem) => o.areaName || o.tableId),
            center: { lat: 12.8452 + (idx * 0.005), lng: 77.6602 + (idx * 0.005) },
            bounds: { minLat: 12.83, maxLat: 12.86, minLng: 77.64, maxLng: 77.68 },
            instantBookingEnabled: true,
            surgeIncentiveActive: false,
            surgeMultiplier: 1.0,
            rawArea: a,
          };
        });
        setApiMarkets(mapped);
      } else if (res.success && Array.isArray(res.data) && res.data.length === 0) {
        setApiMarkets([]);
      } else {
        setError(res.error || 'Unable to load markets. Please try again.');
        setApiMarkets([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch nest areas:', err);
      setError('Unable to load markets. Please try again.');
      setApiMarkets([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMarketsList();
  }, [loadMarketsList]);

  // Handle clicking a market card or Manage Market
  const handleMarketClick = (market: Market) => {
    const tableId = market.tableId || market.id;
    setSelectedTableId(tableId);
    setSelectedMarketName(market.name);
    setIsDrawerOpen(true);
  };

  // Strictly dynamic data from getNestAreas API only
  const displayMarkets = apiMarkets;

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
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

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCreateMarketModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white px-4 py-2 text-xs font-bold transition-all shadow-soft-sm hover:shadow-soft-md active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Market</span>
          </button>
        </div>
      </div>

      {/* Create New Market Modal */}
      <CreateMarketModal
        isOpen={isCreateMarketModalOpen}
        onClose={() => setIsCreateMarketModalOpen(false)}
        onSuccess={() => {
          loadMarketsList();
          refreshMarkets();
        }}
      />

      {/* Selected Market Detail Drawer (Using GET /_functions/getNestAreaById?tableId={tableId}) */}
      <MarketDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        tableId={selectedTableId}
        marketName={selectedMarketName}
      />

      {/* API Error State */}
      {!isLoading && error && displayMarkets.length === 0 && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-center text-rose-800 space-y-3">
          <AlertCircle className="h-8 w-8 text-rose-600 mx-auto" />
          <h3 className="text-sm font-bold text-[#1F1F1F]">Unable to load markets</h3>
          <p className="text-xs text-[#6B6B6B] max-w-sm mx-auto">{error}</p>
          <button
            onClick={loadMarketsList}
            className="inline-flex items-center gap-2 rounded-xl bg-[#5B21B6] px-4 py-2 text-xs font-semibold text-white shadow-soft-sm hover:bg-[#4C1D95] transition-all cursor-pointer"
          >
            <RotateCw className="h-3.5 w-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Loading Skeleton State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-[#EEEEF2] bg-white p-5 shadow-soft-sm animate-pulse space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-[#EEEEF2] rounded-lg" />
                  <div className="h-3.5 w-24 bg-[#FAF9FC] rounded" />
                </div>
                <div className="h-6 w-24 bg-[#EEEEF2] rounded-full" />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="h-16 bg-[#FAF9FC] rounded-xl" />
                <div className="h-16 bg-[#FAF9FC] rounded-xl" />
                <div className="h-16 bg-[#FAF9FC] rounded-xl" />
              </div>

              <div className="h-9 bg-[#FAF9FC] rounded-xl" />

              <div className="flex justify-between border-t border-[#EEEEF2] pt-3">
                <div className="h-4 w-24 bg-[#EEEEF2] rounded" />
                <div className="h-4 w-24 bg-[#EEEEF2] rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && displayMarkets.length === 0 && (
        <div className="rounded-2xl border border-[#EEEEF2] bg-white p-12 text-center shadow-soft-sm space-y-3">
          <Store className="h-10 w-10 text-[#5B21B6] mx-auto" />
          <h3 className="text-base font-bold text-[#1F1F1F]">No Markets Available</h3>
          <p className="text-xs text-[#6B6B6B] max-w-sm mx-auto">
            No active nano-markets found in the database. Create a new market using the button above to begin operations.
          </p>
        </div>
      )}

      {/* Market Cards Grid */}
      {!isLoading && displayMarkets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayMarkets.map((m) => {
            const isPriority = Boolean(m.rawArea?.priorityArea);
            const isOperational = m.rawArea?.serviceStatus !== false;
            const isActive = m.rawArea?.isActive !== false;
            const expertsCount = m.rawArea?.Experts ?? 0;
            const radiusMeters = m.rawArea?.coverageRadius ?? m.radius;
            const workingHours = m.rawArea?.workingHours || '—';

            return (
              <div
                key={m.id}
                className={`rounded-2xl border p-5 shadow-soft-sm transition-all relative overflow-hidden group ${
                  isPriority
                    ? 'border-amber-300/80 bg-gradient-to-b from-amber-50/20 via-white to-white ring-1 ring-amber-400/20'
                    : 'border-[#EEEEF2] bg-white'
                }`}
              >
                {/* Priority Area Top Glow Ribbon */}
                {isPriority && (
                  <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />
                )}

                {/* Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-[#1F1F1F]">{m.name}</h3>
                      <span className="font-mono text-xs font-semibold text-[#6B6B6B]">({m.rawArea?.areaName || m.id})</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#6B6B6B] mt-1">
                      <MapPin className="h-3.5 w-3.5 text-[#5B21B6] shrink-0" />
                      <span>{m.area}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isPriority ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/10 border border-amber-300 text-amber-800 shadow-soft-xs">
                        <Sparkles className="h-3 w-3 text-amber-500 fill-amber-400 animate-pulse" />
                        <span>Priority Area</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-zinc-100 border border-zinc-200 text-zinc-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                        <span>Standard</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Dynamic Telemetry Metrics (Experts, Radius, Priority Area) */}
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[#EEEEF2] pt-3 text-center">
                  {/* Dynamic Experts */}
                  <div className="rounded-xl bg-[#FAF9FC] border border-[#EEEEF2] p-2.5">
                    <div className="flex items-center justify-center gap-1 text-[10px] font-mono uppercase font-bold text-[#6B6B6B]">
                      <Users className="h-3 w-3 text-[#5B21B6]" />
                      <span>Experts</span>
                    </div>
                    <div className="text-lg font-bold font-mono text-[#5B21B6] mt-0.5">
                      {expertsCount}
                    </div>
                    <span className="text-[10px] text-[#6B6B6B] font-medium">Assigned</span>
                  </div>

                  {/* Dynamic Coverage Radius */}
                  <div className="rounded-xl bg-[#FAF9FC] border border-[#EEEEF2] p-2.5">
                    <div className="flex items-center justify-center gap-1 text-[10px] font-mono uppercase font-bold text-[#6B6B6B]">
                      <Radio className="h-3 w-3 text-indigo-600" />
                      <span>Radius</span>
                    </div>
                    <div className="text-lg font-bold font-mono text-[#1F1F1F] mt-0.5">
                      {radiusMeters}m
                    </div>
                    <span className="text-[10px] text-[#6B6B6B] font-medium">Coverage</span>
                  </div>

                  {/* Dynamic Priority Area Attractiveness (Without True/False text) */}
                  <div className={`rounded-xl border p-2.5 transition-all flex flex-col justify-between items-center ${
                    isPriority
                      ? 'bg-amber-50/70 border-amber-200 text-amber-900 shadow-soft-xs'
                      : 'bg-[#FAF9FC] border-[#EEEEF2] text-[#1F1F1F]'
                  }`}>
                    <div className="flex items-center justify-center gap-1 text-[10px] font-mono uppercase font-bold">
                      {isPriority ? (
                        <>
                          <Zap className="h-3 w-3 text-amber-600 fill-amber-500 animate-pulse" />
                          <span className="text-amber-800">Priority</span>
                        </>
                      ) : (
                        <>
                          <Compass className="h-3 w-3 text-[#6B6B6B]" />
                          <span className="text-[#6B6B6B]">Priority</span>
                        </>
                      )}
                    </div>
                    <div className={`text-sm font-bold font-mono mt-1 ${isPriority ? 'text-amber-700' : 'text-zinc-600'}`}>
                      {isPriority ? 'High Tier' : 'Standard Tier'}
                    </div>
                    <span className={`text-[10px] font-medium ${isPriority ? 'text-amber-700 font-semibold' : 'text-[#6B6B6B]'}`}>
                      {isPriority ? 'Fast Dispatch' : 'Standard Zone'}
                    </span>
                  </div>
                </div>

                {/* Dynamic Working Hours & Operational Status */}
                <div className="mt-3 flex items-center justify-between rounded-xl bg-[#FAF9FC] border border-[#EEEEF2] px-3 py-2 text-xs">
                  <div className="flex items-center gap-1.5 text-[#6B6B6B] truncate mr-2">
                    <Clock className="h-3.5 w-3.5 text-[#5B21B6] shrink-0" />
                    <span className="text-[11px] font-medium">Hours:</span>
                    <span className="font-mono font-bold text-[#1F1F1F] text-xs truncate">
                      {workingHours}
                    </span>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                    isOperational
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${isOperational ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    {isOperational ? 'Operational' : 'Suspended'}
                  </span>
                </div>

                {/* Bottom Active Status & Manage Market Action */}
                <div className="mt-3.5 flex items-center justify-between border-t border-[#EEEEF2] pt-3 text-xs">
                  <div className="flex items-center gap-1.5 text-[#6B6B6B]">
                    <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                    <span className="text-[11px] font-medium">
                      {isActive ? 'Active Market' : 'Inactive'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleMarketClick(m)}
                    className="text-[#5B21B6] hover:text-[#4C1D95] font-semibold flex items-center gap-1 hover:underline cursor-pointer transition-colors"
                  >
                    <span>Manage Market</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

