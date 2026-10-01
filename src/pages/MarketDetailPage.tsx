import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { StatusBadge } from '../components/common/StatusBadge';
import { 
  ArrowLeft, 
  MapPin, 
  Radio, 
  Clock, 
  RotateCw, 
  AlertCircle, 
  Loader2, 
  Sparkles 
} from 'lucide-react';
import { getNestAreaById, RawNestAreaDetail, RawNestAreaDurationItem } from '../services/api';

export const MarketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as { marketName?: string; areaDetail?: RawNestAreaDetail } | null;

  // Real API details state via getNestAreaById?tableId={tableId}
  const [areaDetail, setAreaDetail] = useState<RawNestAreaDetail | null>(() => routeState?.areaDetail || null);
  const [durations, setDurations] = useState<RawNestAreaDurationItem[]>([]);
  const [isLoadingApi, setIsLoadingApi] = useState<boolean>(!routeState?.areaDetail);
  const [apiError, setApiError] = useState<string | null>(null);

  // Fetch complete details by tableId using GET https://www.haatza.com/_functions/getNestAreaById?tableId={tableId}
  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    if (!areaDetail) {
      setIsLoadingApi(true);
    }
    setApiError(null);

    getNestAreaById(id)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setAreaDetail(res.data.area || null);
          setDurations(Array.isArray(res.data.durations) ? res.data.durations : []);
        } else {
          setApiError(res.error || 'Unable to load market details. Please try again.');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setApiError(err?.message || 'Unable to load market details. Please try again.');
      })
      .finally(() => {
        if (isMounted) setIsLoadingApi(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleRetryApi = () => {
    if (!id) return;
    setIsLoadingApi(true);
    setApiError(null);
    getNestAreaById(id)
      .then((res) => {
        setIsLoadingApi(false);
        if (res.success && res.data) {
          setAreaDetail(res.data.area || null);
          setDurations(Array.isArray(res.data.durations) ? res.data.durations : []);
        } else {
          setApiError(res.error || 'Unable to load market details. Please try again.');
        }
      })
      .catch((err) => {
        setIsLoadingApi(false);
        setApiError(err?.message || 'Unable to load market details. Please try again.');
      });
  };

  const passedMarketName = routeState?.marketName || routeState?.areaDetail?.areaName;
  const displayName = areaDetail?.areaName 
    ? areaDetail.areaName.replace(/_/g, ' ') 
    : (passedMarketName ? passedMarketName.replace(/_/g, ' ') : 'Market Details');
  const locationText = [areaDetail?.city, areaDetail?.state, areaDetail?.country].filter(Boolean).join(', ') || '—';
  const isPriority = Boolean(areaDetail?.priorityArea);
  const isOperational = areaDetail?.serviceStatus !== false;
  const isActive = areaDetail?.isActive !== false;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/area')}
            className="rounded-xl border border-[#EEEEF2] bg-white p-2 text-[#6B6B6B] hover:text-[#5B21B6] hover:bg-[#EDE9FE] shadow-soft-sm transition-colors cursor-pointer shrink-0 mt-0.5 sm:mt-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <h1 className="text-xl font-bold text-[#1F1F1F]">{displayName}</h1>
              {isPriority ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-300 text-amber-800 shadow-soft-xs">
                  <Sparkles className="h-3 w-3 text-amber-500 fill-amber-400 animate-pulse" />
                  <span>Priority Area</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 border border-zinc-200 text-zinc-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                  <span>Standard Area</span>
                </span>
              )}
              <StatusBadge status={isActive ? 'Healthy' : 'Critical'} size="md" />
            </div>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              {locationText} • Primary dispatch perimeter: {areaDetail?.coverageRadius ?? 0}m
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRetryApi}
            className="flex items-center gap-1.5 rounded-xl border border-[#EEEEF2] bg-white px-3 py-2 text-xs font-semibold text-[#1F1F1F] hover:bg-[#FAF9FC] transition-all shadow-soft-sm cursor-pointer"
          >
            <RotateCw className="h-3.5 w-3.5 text-[#6B6B6B]" />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoadingApi && (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#5B21B6] mx-auto" />
          <div className="text-sm font-semibold text-[#1F1F1F]">Loading Market Telemetry...</div>
          <p className="text-xs text-[#6B6B6B]">
            Fetching market parameters and complete pricing tiers from API.
          </p>
        </div>
      )}

      {/* API Error Banner */}
      {!isLoadingApi && apiError && (
        <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{apiError}</span>
          </div>
          <button
            onClick={handleRetryApi}
            className="flex items-center gap-1 rounded-lg bg-rose-600 text-white px-3 py-1 font-semibold hover:bg-rose-700 transition-colors cursor-pointer"
          >
            <RotateCw className="h-3 w-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Real API Operational Telemetry Cards */}
      {!isLoadingApi && !apiError && areaDetail && (
        <div className="space-y-6">
          {/* Section 1: Geographic & Operational Spec */}
          <div className="rounded-2xl border border-[#EEEEF2] bg-white p-5 shadow-soft-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#EEEEF2] pb-3">
              <h3 className="text-sm font-bold text-[#1F1F1F] uppercase tracking-wider flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#5B21B6]" />
                Geographic Boundary & Dispatch Spec
              </h3>
              <span className="font-mono text-xs font-bold text-[#5B21B6] bg-[#EDE9FE] px-2.5 py-1 rounded-lg">
                Pincode: {areaDetail.pincode ?? '—'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xl bg-[#FAF9FC] border border-[#EEEEF2] p-3">
                <span className="text-[10px] text-[#6B6B6B] uppercase font-mono">Working Hours</span>
                <div className="font-semibold text-[#1F1F1F] mt-1 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-[#5B21B6] shrink-0" />
                  <span className="truncate">{areaDetail.workingHours || '—'}</span>
                </div>
              </div>

              <div className="rounded-xl bg-[#FAF9FC] border border-[#EEEEF2] p-3">
                <span className="text-[10px] text-[#6B6B6B] uppercase font-mono">Surge Pricing</span>
                <div className="font-semibold text-amber-700 font-mono mt-1">
                  {areaDetail.surgePricing != null ? `${areaDetail.surgePricing}%` : '—'}
                </div>
              </div>

              <div className="rounded-xl bg-[#FAF9FC] border border-[#EEEEF2] p-3">
                <span className="text-[10px] text-[#6B6B6B] uppercase font-mono">Coverage Radius</span>
                <div className="font-semibold text-[#1F1F1F] font-mono mt-1 flex items-center gap-1">
                  <Radio className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                  <span>{areaDetail.coverageRadius != null ? `${areaDetail.coverageRadius}m` : '—'}</span>
                </div>
              </div>

              <div className="rounded-xl bg-[#FAF9FC] border border-[#EEEEF2] p-3">
                <span className="text-[10px] text-[#6B6B6B] uppercase font-mono">Service Status</span>
                <div className="mt-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    isOperational
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${isOperational ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    {isOperational ? 'Operational' : 'Suspended'}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-[#FAF9FC] border border-[#EEEEF2] p-3">
                <span className="text-[10px] text-[#6B6B6B] uppercase font-mono">Latitude</span>
                <div className="font-mono font-semibold text-[#1F1F1F] mt-1">{areaDetail.latitude ?? '—'}</div>
              </div>

              <div className="rounded-xl bg-[#FAF9FC] border border-[#EEEEF2] p-3">
                <span className="text-[10px] text-[#6B6B6B] uppercase font-mono">Longitude</span>
                <div className="font-mono font-semibold text-[#1F1F1F] mt-1">{areaDetail.longitude ?? '—'}</div>
              </div>

              <div className="rounded-xl bg-[#FAF9FC] border border-[#EEEEF2] p-3">
                <span className="text-[10px] text-[#6B6B6B] uppercase font-mono">Location</span>
                <div className="font-semibold text-[#1F1F1F] mt-1 truncate">
                  {[areaDetail.city, areaDetail.state].filter(Boolean).join(', ') || '—'}
                </div>
              </div>

              <div className="rounded-xl bg-[#FAF9FC] border border-[#EEEEF2] p-3">
                <span className="text-[10px] text-[#6B6B6B] uppercase font-mono">Country Code</span>
                <div className="font-semibold font-mono text-[#1F1F1F] mt-1">{areaDetail.country || 'IN'}</div>
              </div>
            </div>
          </div>

          {/* Section 2: COMPLETE Duration Tiers & Pricing Table */}
          <div className="rounded-2xl border border-[#EEEEF2] bg-white p-5 shadow-soft-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#EEEEF2] pb-3">
              <h3 className="text-sm font-bold text-[#1F1F1F] uppercase tracking-wider flex items-center gap-2">
                <span className="font-bold text-sm text-[#5B21B6] font-mono">₹</span>
                <span>Complete Duration Tiers & Pricing Console ({durations.length})</span>
              </h3>
              <span className="text-xs text-[#6B6B6B] font-mono">
                Dispatch Radius: {areaDetail.coverageRadius ?? 0}m
              </span>
            </div>

            {durations.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#6B6B6B]">
                No duration pricing records configured for this market.
              </div>
            ) : (
              <div className="rounded-2xl border border-[#EEEEF2] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[850px]">
                    <thead className="border-b border-[#EEEEF2] bg-[#FAF9FC] text-[11px] font-bold text-[#6B6B6B] uppercase font-mono">
                      <tr>
                        <th className="px-3.5 py-3">Duration</th>
                        <th className="px-3.5 py-3">Standard</th>
                        <th className="px-3.5 py-3">Original</th>
                        <th className="px-3.5 py-3">1st Time</th>
                        <th className="px-3.5 py-3">2nd Time</th>
                        <th className="px-3.5 py-3">Regular</th>
                        <th className="px-3.5 py-3 text-center">Timing</th>
                        <th className="px-3.5 py-3 text-center">Badge</th>
                        <th className="px-3.5 py-3 text-center">Workers</th>
                        <th className="px-3.5 py-3 text-center">ETA</th>
                        <th className="px-3.5 py-3 text-center">Nearest</th>
                        <th className="px-3.5 py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EEEEF2]">
                      {durations.map((d, idx) => (
                        <tr key={d.tableId || idx} className="hover:bg-[#F5F3FF]/40 transition-colors">
                          <td className="px-3.5 py-3 font-semibold text-[#1F1F1F]">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] text-[#6B6B6B]">#{d.sequence ?? idx + 1}</span>
                              <span className="font-mono font-bold">{d.displayTime || (d.duration ? `${d.duration} Mins` : '—')}</span>
                            </div>
                          </td>
                          <td className="px-3.5 py-3 font-mono font-bold text-[#1F1F1F]">
                            ₹{d.price}
                          </td>
                          <td className="px-3.5 py-3 font-mono text-[#6B6B6B] line-through">
                            ₹{d.originalPrice}
                          </td>
                          <td className="px-3.5 py-3 font-mono text-emerald-700 font-semibold">
                            {d.firstTimeUser != null ? `₹${d.firstTimeUser}` : '—'}
                          </td>
                          <td className="px-3.5 py-3 font-mono text-[#7C3AED] font-semibold">
                            {d.secoundtimeuser != null ? `₹${d.secoundtimeuser}` : '—'}
                          </td>
                          <td className="px-3.5 py-3 font-mono text-[#1F1F1F]">
                            {d.regularUser != null ? `₹${d.regularUser}` : '—'}
                          </td>
                          <td className="px-3.5 py-3 font-mono text-[10px] text-[#6B6B6B] text-center">
                            {d.startTime || d.endTime ? `${d.startTime || '00:00'} - ${d.endTime || '00:00'}` : '—'}
                          </td>
                          <td className="px-3.5 py-3 text-center">
                            {d.badge ? (
                              <span className="inline-block rounded-md bg-[#EDE9FE] px-2 py-0.5 text-[10px] font-bold text-[#5B21B6]">
                                {d.badge}
                              </span>
                            ) : (
                              <span className="text-[#9E9E9E]">—</span>
                            )}
                          </td>
                          <td className="px-3.5 py-3 font-mono text-[11px] text-[#1F1F1F] text-center">
                            {d.workersAvailable !== undefined && d.workersAvailable !== '' ? d.workersAvailable : '—'}
                          </td>
                          <td className="px-3.5 py-3 font-mono text-[11px] text-[#1F1F1F] text-center">
                            {d.estimatedTimeInMinutes !== undefined && d.estimatedTimeInMinutes !== '' ? `${d.estimatedTimeInMinutes}m` : '—'}
                          </td>
                          <td className="px-3.5 py-3 font-mono text-[11px] text-[#1F1F1F] text-center">
                            {d.nearestWorkerDistanceMeters !== undefined && d.nearestWorkerDistanceMeters !== '' ? `${d.nearestWorkerDistanceMeters}m` : '—'}
                          </td>
                          <td className="px-3.5 py-3 text-center">
                            <span
                              className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                d.isActive !== false
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-zinc-100 text-zinc-600'
                              }`}
                            >
                              {d.isActive !== false ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
