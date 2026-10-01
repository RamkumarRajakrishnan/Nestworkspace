import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Clock, 
  Compass, 
  Zap, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  Tag, 
  Users, 
  RotateCw,
  Layers,
  ChevronRight
} from 'lucide-react';
import { Drawer } from '../common/Drawer';
import { StatusBadge } from '../common/StatusBadge';
import { getNestAreaById, RawNestAreaDetail, RawNestAreaDurationItem } from '../../services/api';
import { useNavigate } from 'react-router-dom';

interface MarketDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tableId: string | null;
  marketName?: string;
}

export const MarketDetailDrawer: React.FC<MarketDetailDrawerProps> = ({
  isOpen,
  onClose,
  tableId,
  marketName,
}) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [areaDetail, setAreaDetail] = useState<RawNestAreaDetail | null>(null);
  const [durations, setDurations] = useState<RawNestAreaDurationItem[]>([]);

  useEffect(() => {
    if (!isOpen || !tableId) {
      setAreaDetail(null);
      setDurations([]);
      setError(null);
      return;
    }

    let isMounted = true;
    const fetchDetails = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await getNestAreaById(tableId);
        if (!isMounted) return;

        if (res.success && res.data) {
          setAreaDetail(res.data.area || null);
          setDurations(Array.isArray(res.data.durations) ? res.data.durations : []);
        } else {
          setError(res.error || 'Unable to load market details. Please try again.');
        }
      } catch (err: any) {
        if (!isMounted) return;
        setError(err?.message || 'Unable to load market details. Please try again.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchDetails();

    return () => {
      isMounted = false;
    };
  }, [isOpen, tableId]);

  const handleRetry = () => {
    if (!tableId) return;
    setIsLoading(true);
    setError(null);
    getNestAreaById(tableId).then((res) => {
      setIsLoading(false);
      if (res.success && res.data) {
        setAreaDetail(res.data.area || null);
        setDurations(Array.isArray(res.data.durations) ? res.data.durations : []);
      } else {
        setError(res.error || 'Unable to load market details. Please try again.');
      }
    }).catch((err) => {
      setIsLoading(false);
      setError(err?.message || 'Unable to load market details. Please try again.');
    });
  };

  const displayName = areaDetail?.areaName ? areaDetail.areaName.replace(/_/g, ' ') : (marketName || 'Market Details');
  const locationParts = [areaDetail?.city, areaDetail?.state, areaDetail?.country].filter(Boolean);
  const subtitle = locationParts.length > 0 ? locationParts.join(', ') : 'Nano-Market Details';

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={displayName}
      subtitle={subtitle}
      width="2xl"
      lockBackgroundScroll={true}
      actions={
        areaDetail && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                navigate(`/markets/${areaDetail.tableId || areaDetail.areaName}`, {
                  state: {
                    marketName: areaDetail.areaName,
                    areaDetail: areaDetail,
                  },
                });
              }}
              className="flex items-center gap-1.5 rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white px-3.5 py-1.5 text-xs font-semibold shadow-soft-sm transition-all cursor-pointer"
            >
              <span>Full Market Console</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      }
    >
      {/* Loading State */}
      {isLoading && (
        <div className="py-16 text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#5B21B6] mx-auto" />
          <div className="text-xs font-semibold text-[#1F1F1F]">Loading Market Details...</div>
          <p className="text-[11px] text-[#6B6B6B]">
            Fetching geographic telemetry and duration tiers from the network.
          </p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="py-12 px-4 text-center space-y-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-200">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="text-sm font-bold text-[#1F1F1F]">Unable to load market details. Please try again.</div>
          <p className="text-xs text-[#6B6B6B] max-w-sm mx-auto">
            {error}
          </p>
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 rounded-xl bg-[#5B21B6] px-4 py-2 text-xs font-semibold text-white shadow-soft-sm hover:bg-[#4C1D95] transition-all cursor-pointer"
          >
            <RotateCw className="h-3.5 w-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Data Content */}
      {!isLoading && !error && areaDetail && (
        <div className="space-y-6">
          {/* Header Status Badges */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border border-[#EEEEF2] bg-[#FAF9FC]">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#5B21B6] bg-[#EDE9FE] px-2.5 py-1 rounded-lg">
                {areaDetail.areaName}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {areaDetail.priorityArea && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                  <Zap className="h-3 w-3" />
                  Priority Area
                </span>
              )}
              <StatusBadge
                status={areaDetail.isActive !== false ? 'Healthy' : 'Critical'}
                size="sm"
              />
            </div>
          </div>

          {/* Section 1: Geographic Telemetry Grid */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#5B21B6]">
              <MapPin className="h-3.5 w-3.5" />
              <span>Geographic & Operational Telemetry</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* City & State */}
              <div className="rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-3">
                <span className="text-[10px] font-mono uppercase text-[#6B6B6B]">Location</span>
                <div className="text-xs font-bold text-[#1F1F1F] mt-0.5 truncate">
                  {[areaDetail.city, areaDetail.state].filter(Boolean).join(', ') || '—'}
                </div>
              </div>

              {/* Country & Pincode */}
              <div className="rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-3">
                <span className="text-[10px] font-mono uppercase text-[#6B6B6B]">Country / Pincode</span>
                <div className="text-xs font-bold text-[#1F1F1F] mt-0.5 font-mono">
                  {areaDetail.country || '—'} • {areaDetail.pincode ?? '—'}
                </div>
              </div>

              {/* Service Status */}
              <div className="rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-3">
                <span className="text-[10px] font-mono uppercase text-[#6B6B6B]">Service Status</span>
                <div className="mt-0.5">
                  <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                    areaDetail.serviceStatus !== false
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {areaDetail.serviceStatus !== false ? 'Operational' : 'Service Suspended'}
                  </span>
                </div>
              </div>

              {/* Coverage Radius */}
              <div className="rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-3">
                <span className="text-[10px] font-mono uppercase text-[#6B6B6B]">Coverage Radius</span>
                <div className="text-sm font-bold font-mono text-[#1F1F1F] mt-0.5">
                  {areaDetail.coverageRadius != null ? `${areaDetail.coverageRadius} meters` : '—'}
                </div>
              </div>

              {/* Working Hours */}
              <div className="rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-3">
                <span className="text-[10px] font-mono uppercase text-[#6B6B6B]">Working Hours</span>
                <div className="text-xs font-bold text-[#1F1F1F] mt-1 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-[#5B21B6] shrink-0" />
                  <span className="truncate">{areaDetail.workingHours || '—'}</span>
                </div>
              </div>

              {/* Surge Pricing */}
              <div className="rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-3">
                <span className="text-[10px] font-mono uppercase text-[#6B6B6B]">Surge Pricing</span>
                <div className="text-sm font-bold font-mono text-amber-700 mt-0.5">
                  {areaDetail.surgePricing != null ? `${areaDetail.surgePricing}` : '—'}
                </div>
              </div>

              {/* Coordinates */}
              <div className="rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-3 col-span-2 sm:col-span-3">
                <span className="text-[10px] font-mono uppercase text-[#6B6B6B]">Geographic Coordinates</span>
                <div className="text-xs font-mono text-[#1F1F1F] mt-1">
                  Latitude: <span className="font-semibold">{areaDetail.latitude ?? '—'}</span> • Longitude: <span className="font-semibold">{areaDetail.longitude ?? '—'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Durations & Pricing Configuration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#5B21B6]">
                <span className="font-bold text-sm text-[#5B21B6] font-mono">₹</span>
                <span>Duration Tiers & Pricing ({durations.length})</span>
              </div>
            </div>

            {durations.length === 0 ? (
              <div className="rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-6 text-center text-xs text-[#6B6B6B]">
                No duration tiers configured for this market.
              </div>
            ) : (
              <div className="rounded-2xl border border-[#EEEEF2] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-[#EEEEF2] bg-[#FAF9FC] text-[11px] font-bold text-[#6B6B6B] uppercase font-mono">
                      <tr>
                        <th className="px-3.5 py-2.5">Duration</th>
                        <th className="px-3.5 py-2.5">Standard</th>
                        <th className="px-3.5 py-2.5">Original</th>
                        <th className="px-3.5 py-2.5">1st Time</th>
                        <th className="px-3.5 py-2.5">2nd Time</th>
                        <th className="px-3.5 py-2.5">Regular</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EEEEF2]">
                      {durations.map((d, idx) => (
                        <tr key={d.tableId || idx} className="hover:bg-[#F5F3FF]/40 transition-colors">
                          <td className="px-3.5 py-3 font-semibold text-[#1F1F1F]">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] text-[#6B6B6B]">#{d.sequence ?? idx + 1}</span>
                              <span>{d.displayTime || (d.duration ? `${d.duration} Mins` : '—')}</span>
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
    </Drawer>
  );
};
