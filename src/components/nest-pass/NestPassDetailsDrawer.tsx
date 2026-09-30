import React, { useState, useEffect } from 'react';
import { Drawer } from '../common/Drawer';
import { 
  Ticket, 
  MapPin, 
  Calendar, 
  Clock, 
  Layers, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Pencil, 
  Image as ImageIcon,
  ExternalLink,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { getNestPassDetails, formatImageUrl, RawNestPassDetail } from '../../services/api';
import { StatusBadge } from '../common/StatusBadge';

interface NestPassDetailsDrawerProps {
  passId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (passId: string) => void;
}

export const NestPassDetailsDrawer: React.FC<NestPassDetailsDrawerProps> = ({
  passId,
  isOpen,
  onClose,
  onEdit,
}) => {
  const [details, setDetails] = useState<RawNestPassDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !passId) {
      setDetails(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    getNestPassDetails(passId)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setDetails(res.data);
        } else {
          setError(res.error || 'Failed to load Nest Pass details.');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err?.message || 'Network error while loading Nest Pass details.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, passId]);

  if (!isOpen) return null;

  // Format dates
  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  // Format Currency
  const formatPrice = (val?: number) => {
    if (val === undefined || val === null) return '—';
    return `₹${Number(val).toLocaleString('en-IN')}`;
  };

  const dashboardBannerUrl = formatImageUrl(details?.dashboardBanner);
  const popupBannerUrl = formatImageUrl(details?.popupBanner);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={details?.packId ? `Nest Pass: ${details.packId}` : 'Nest Pass Details'}
      width="lg"
      lockBackgroundScroll={true}
    >
      <div className="space-y-4 w-full max-w-full overflow-hidden">
        {/* Loading Indicator banner if fetching data */}
        {isLoading && (
          <div className="flex items-center gap-2 rounded-xl bg-[#FAF9FC] border border-[#EEEEF2] p-2.5 text-xs text-[#5B21B6]">
            <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
            <span className="font-medium">Fetching complete pass details...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-center space-y-3">
            <AlertCircle className="h-8 w-8 text-rose-500 mx-auto" />
            <div className="text-xs text-rose-700 font-semibold">{error}</div>
            <button
              onClick={() => {
                if (passId) {
                  setIsLoading(true);
                  setError(null);
                  getNestPassDetails(passId).then((res) => {
                    if (res.success && res.data) setDetails(res.data);
                    else setError(res.error || 'Failed to reload.');
                    setIsLoading(false);
                  });
                }
              }}
              className="rounded-xl bg-white border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {details && (
          <>
            {/* Header Hero Pass Card */}
            <div className="relative overflow-hidden rounded-2xl border border-[#DDD6FE] bg-gradient-to-br from-[#FAF5FF] via-white to-[#F5F3FF] p-4.5 sm:p-5 shadow-soft-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="font-mono text-xs font-bold text-[#5B21B6] bg-[#EDE9FE] px-2.5 py-1 rounded-lg inline-block">
                    {details.packId || '—'}
                  </span>
                  <h3 className="text-xl font-extrabold text-[#1F1F1F] mt-2">
                    {formatPrice(details.price)}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-[#6B6B6B] mt-1">
                    <MapPin className="h-3.5 w-3.5 text-[#5B21B6]" />
                    <span className="font-semibold text-[#1F1F1F]">{details.areaName || '—'}</span>
                  </div>
                </div>
                <div>
                  <StatusBadge 
                    status={details.active ? 'Active' : 'Inactive'} 
                    size="sm" 
                    pulse={details.active}
                  />
                </div>
              </div>
            </div>

            {/* Quick Action Button: Edit Pass */}
            {onEdit && passId && (
              <div className="w-full">
                <button
                  type="button"
                  onClick={() => onEdit(passId)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#EEEEF2] bg-white hover:bg-[#FAF9FC] hover:border-[#5B21B6]/30 text-[#1F1F1F] hover:text-[#5B21B6] px-4 py-2.5 text-xs font-bold transition-all shadow-soft-sm active:scale-95 cursor-pointer"
                >
                  <Pencil className="h-3.5 w-3.5 text-[#5B21B6] shrink-0" />
                  <span>Edit Pass</span>
                </button>
              </div>
            )}

              {/* Stats Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-3 space-y-1">
                  <span className="text-[11px] text-[#6B6B6B] flex items-center gap-1">
                    <Layers className="h-3 w-3 text-[#5B21B6]" />
                    Pack Type
                  </span>
                  <p className="font-bold text-[#1F1F1F] text-sm">{details.packType || 'Visits'}</p>
                </div>

                <div className="rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-3 space-y-1">
                  <span className="text-[11px] text-[#6B6B6B] flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-[#5B21B6]" />
                    Visits Included
                  </span>
                  <p className="font-bold text-[#1F1F1F] text-sm">{details.visits ?? '—'} Visits</p>
                </div>

                <div className="rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-3 space-y-1">
                  <span className="text-[11px] text-[#6B6B6B] flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-[#5B21B6]" />
                    Validity Period
                  </span>
                  <p className="font-bold text-[#1F1F1F] text-sm">
                    {details.validityDays ? `${details.validityDays} Days` : '—'}
                  </p>
                </div>

                <div className="rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-3 space-y-1">
                  <span className="text-[11px] text-[#6B6B6B] flex items-center gap-1">
                    <Clock className="h-3 w-3 text-[#5B21B6]" />
                    Service Duration
                  </span>
                  <p className="font-bold text-[#1F1F1F] text-sm">
                    {details.duration ? `${details.duration} min` : '—'}
                  </p>
                </div>
              </div>

              {/* Offer Expiry & System Identifiers */}
              <div className="rounded-xl border border-[#EEEEF2] bg-white p-4 space-y-3 shadow-soft-xs text-xs">
                <h4 className="font-bold text-[#1F1F1F] text-xs uppercase tracking-wider text-[#6B6B6B]">
                  Validity & Compliance
                </h4>
                
                <div className="flex items-center justify-between border-b border-[#F3F2F7] pb-2">
                  <span className="text-[#6B6B6B]">Offer Expiry</span>
                  <span className="font-semibold text-[#1F1F1F] flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-[#5B21B6]" />
                    {formatDate(details.offerexpire)}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-[#F3F2F7] pb-2">
                  <span className="text-[#6B6B6B]">Active Status</span>
                  <span className="font-semibold flex items-center gap-1">
                    {details.active ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Active
                      </span>
                    ) : (
                      <span className="text-rose-600 flex items-center gap-1">
                        <XCircle className="h-3.5 w-3.5 text-rose-500" /> Inactive
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#6B6B6B]">Pass UUID</span>
                  <span className="font-mono text-[11px] text-[#5B21B6] select-all truncate max-w-[200px]" title={passId || ''}>
                    {passId}
                  </span>
                </div>
              </div>

              {/* Banners Preview Section */}
              <div id="pass-banners-section" className="space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#6B6B6B]">
                  Promotional Banners
                </h4>

                {/* Dashboard Banner */}
                <div className="rounded-xl border border-[#EEEEF2] bg-white p-3 space-y-2 shadow-soft-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#1F1F1F] flex items-center gap-1.5">
                      <ImageIcon className="h-3.5 w-3.5 text-[#5B21B6]" />
                      Dashboard Banner
                    </span>
                    {dashboardBannerUrl && (
                      <a 
                        href={dashboardBannerUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-[11px] text-[#5B21B6] hover:underline flex items-center gap-1 font-semibold"
                      >
                        View Full <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>

                  {dashboardBannerUrl ? (
                    <div className="relative aspect-[3/1] w-full rounded-lg overflow-hidden bg-[#FAF9FC] border border-[#EEEEF2]">
                      <img
                        src={dashboardBannerUrl}
                        alt="Dashboard Banner Preview"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-24 rounded-lg bg-[#FAF9FC] border border-dashed border-[#DDD6FE] flex items-center justify-center text-xs text-[#6B6B6B]">
                      No dashboard banner available
                    </div>
                  )}
                </div>

                {/* Popup Banner */}
                <div className="rounded-xl border border-[#EEEEF2] bg-white p-3 space-y-2 shadow-soft-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#1F1F1F] flex items-center gap-1.5">
                      <ImageIcon className="h-3.5 w-3.5 text-[#5B21B6]" />
                      Popup Banner
                    </span>
                    {popupBannerUrl && (
                      <a 
                        href={popupBannerUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-[11px] text-[#5B21B6] hover:underline flex items-center gap-1 font-semibold"
                      >
                        View Full <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>

                  {popupBannerUrl ? (
                    <div className="relative aspect-[4/3] w-full max-w-[280px] mx-auto rounded-lg overflow-hidden bg-[#FAF9FC] border border-[#EEEEF2]">
                      <img
                        src={popupBannerUrl}
                        alt="Popup Banner Preview"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-24 rounded-lg bg-[#FAF9FC] border border-dashed border-[#DDD6FE] flex items-center justify-center text-xs text-[#6B6B6B]">
                      No popup banner available
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </Drawer>
    );
  };
