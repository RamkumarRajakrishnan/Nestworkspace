import React, { useState, useEffect } from 'react';
import { 
  X, 
  Ticket, 
  MapPin, 
  Calendar, 
  Clock, 
  Layers, 
  AlertCircle, 
  Loader2, 
  Save, 
  Lock 
} from 'lucide-react';
import { getNestPassDetails, updateNestPass, RawNestPassDetail } from '../../services/api';
import { useOperations } from '../../context/OperationsContext';

interface EditNestPassModalProps {
  passId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditNestPassModal: React.FC<EditNestPassModalProps> = ({
  passId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { addToast } = useOperations();

  const [details, setDetails] = useState<RawNestPassDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Editable fields per API contract
  const [active, setActive] = useState(true);
  const [offerexpire, setOfferexpire] = useState('');

  useEffect(() => {
    if (!isOpen || !passId) {
      setDetails(null);
      setApiError(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setApiError(null);

    getNestPassDetails(passId)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setDetails(res.data);
          setActive(Boolean(res.data.active));
          // Format offerexpire to YYYY-MM-DD for date input
          if (res.data.offerexpire) {
            try {
              const d = new Date(res.data.offerexpire);
              if (!isNaN(d.getTime())) {
                setOfferexpire(d.toISOString().split('T')[0]);
              } else {
                setOfferexpire(res.data.offerexpire);
              }
            } catch {
              setOfferexpire(res.data.offerexpire);
            }
          } else {
            setOfferexpire('');
          }
        } else {
          setApiError(res.error || 'Failed to load Nest Pass details.');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setApiError(err?.message || 'Error fetching pass details.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, passId]);

  // Lock background scroll when open
  useEffect(() => {
    if (!isOpen) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyPaddingRight = document.body.style.paddingRight;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const handleTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      const isInsideScrollable = target?.closest('.modal-scroll-container');
      if (!isInsideScrollable) {
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.paddingRight = originalBodyPaddingRight;
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passId || isSaving) return;

    if (!offerexpire.trim()) {
      setApiError('Offer expiry date is required.');
      return;
    }

    setIsSaving(true);
    setApiError(null);

    try {
      const res = await updateNestPass({
        passId,
        active,
        offerexpire: offerexpire.trim(),
      });

      if (res.success) {
        addToast('Success', 'Nest Pass updated successfully', 'success');
        onSuccess();
        onClose();
      } else {
        setApiError(res.error || 'Failed to update Nest Pass. Please try again.');
      }
    } catch (err: any) {
      setApiError(err?.message || 'Network error while updating Nest Pass.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed top-16 bottom-0 right-0 left-0 md:left-[var(--sidebar-width,15rem)] z-30 overflow-hidden flex items-center justify-center p-3 sm:p-4 lg:p-0 lg:block animate-in fade-in duration-150">
      <div 
        className="absolute inset-0 bg-[#1F1F1F]/40 backdrop-blur-xs cursor-pointer" 
        onClick={isSaving ? undefined : onClose}
        aria-label="Close edit pass panel" 
      />

      <div 
        className="relative z-10 w-full max-w-lg flex flex-col bg-white overflow-hidden max-h-[85vh] rounded-2xl border border-[#EEEEF2] shadow-soft-lg lg:absolute lg:inset-y-0 lg:right-0 lg:h-full lg:max-h-full lg:rounded-none lg:border-l lg:border-t-0 lg:border-r-0 lg:border-b-0 lg:border-[#EEEEF2] lg:shadow-2xl lg:animate-in lg:slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EEEEF2] px-6 py-4 bg-[#FAF9FC] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-[#EDE9FE] flex items-center justify-center text-[#5B21B6]">
              <Ticket className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1F1F1F]">Edit Nest Pass</h2>
              <p className="text-xs text-[#6B6B6B]">{details?.packId ? `Pack ID: ${details.packId}` : 'Update status & expiry'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl border border-[#EEEEF2] bg-white p-2 text-[#6B6B6B] hover:text-[#1F1F1F] hover:bg-[#FAF9FC] transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="modal-scroll-container flex-1 overflow-y-auto overscroll-contain p-6 space-y-5">
          {apiError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 flex items-start gap-2.5 text-xs text-rose-700 font-medium">
              <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{apiError}</span>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-4 py-4">
              <div className="h-20 rounded-xl bg-[#F5F3FF] animate-pulse" />
              <div className="h-10 rounded-xl bg-[#F5F3FF] animate-pulse" />
              <div className="h-10 rounded-xl bg-[#F5F3FF] animate-pulse" />
            </div>
          ) : (
            <>
              {/* Read-Only Summary Card */}
              {details && (
                <div className="rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#5B21B6] bg-[#EDE9FE] px-2 py-0.5 rounded-md">
                      {details.packId}
                    </span>
                    <span className="font-extrabold text-[#1F1F1F] text-sm">
                      {details.price ? `₹${Number(details.price).toLocaleString('en-IN')}` : '—'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#EEEEF2] text-[#6B6B6B]">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-[#5B21B6]" />
                      <span className="truncate">{details.areaName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Layers className="h-3 w-3 text-[#5B21B6]" />
                      <span>{details.packType} • {details.visits} Visits</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-[#8C8C8C] pt-1">
                    <Lock className="h-3 w-3" />
                    <span>Price, visits & core metadata are read-only per API rules</span>
                  </div>
                </div>
              )}

              {/* Editable Fields: Active & Offer Expiry */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-bold text-[#5B21B6] uppercase tracking-wider">
                  Update Configuration
                </h3>

                {/* Active Status Toggle */}
                <div>
                  <label className="block text-xs font-semibold text-[#1F1F1F] mb-1.5">
                    Package Status
                  </label>
                  <button
                    type="button"
                    onClick={() => setActive(!active)}
                    className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 text-xs font-semibold transition-colors cursor-pointer ${
                      active 
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800' 
                        : 'border-[#EEEEF2] bg-[#FAF9FC] text-[#6B6B6B]'
                    }`}
                  >
                    <div>
                      <span className="font-bold block text-sm">{active ? 'Active' : 'Inactive'}</span>
                      <span className="text-[11px] text-[#6B6B6B] block">
                        {active ? 'Package is live and purchasable by customers' : 'Package is deactivated'}
                      </span>
                    </div>
                    <div className={`h-6 w-11 rounded-full transition-colors relative shrink-0 ${active ? 'bg-emerald-600' : 'bg-gray-300'}`}>
                      <div className={`h-5 w-5 rounded-full bg-white transition-transform absolute top-0.5 ${active ? 'left-5.5' : 'left-0.5'}`} />
                    </div>
                  </button>
                </div>

                {/* Offer Expiry Date */}
                <div>
                  <label className="block text-xs font-semibold text-[#1F1F1F] mb-1.5">
                    Offer Expiry Date <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-[#6B6B6B]" />
                    <input
                      type="date"
                      value={offerexpire}
                      onChange={(e) => setOfferexpire(e.target.value)}
                      required
                      className="w-full rounded-xl border border-[#EEEEF2] bg-white pl-9 pr-3 py-2 text-xs font-mono focus:ring-2 focus:ring-[#7C3AED] focus:outline-hidden"
                    />
                  </div>
                  <p className="text-[11px] text-[#6B6B6B] mt-1">
                    Date after which this promotional pass will no longer be available.
                  </p>
                </div>
              </div>

              {/* Internal passId badge */}
              <div className="pt-2">
                <span className="text-[10px] text-[#8C8C8C] font-mono block">Pass ID: {passId}</span>
              </div>
            </>
          )}

          {/* Footer Submit Buttons */}
          <div className="border-t border-[#EEEEF2] pt-4 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl border border-[#EEEEF2] bg-white px-4 py-2.5 text-xs font-semibold text-[#6B6B6B] hover:text-[#1F1F1F] hover:bg-[#FAF9FC] transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white px-5 py-2.5 text-xs font-bold transition-all shadow-soft-sm active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
