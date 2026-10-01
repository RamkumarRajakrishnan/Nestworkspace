import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Booking } from '../../types';
import { useOperations } from '../../context/OperationsContext';
import { getAvailableExperts, manualAssignNestBooking } from '../../services/api';
import { UserCheck, AlertCircle, RefreshCw, CheckCircle2, MapPin } from 'lucide-react';

export interface AvailableExpert {
  workerId: string;
  expertName: string;
  profileImage?: string;
}

interface AssignWorkerModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onAssignSuccess?: (updatedBooking: Booking, expert: AvailableExpert) => void;
}

export const AssignWorkerModal: React.FC<AssignWorkerModalProps> = ({
  booking,
  isOpen,
  onClose,
  onAssignSuccess,
}) => {
  const { addToast } = useOperations();
  const [experts, setExperts] = useState<AvailableExpert[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedExpertId, setSelectedExpertId] = useState<string | null>(null);

  const fetchExperts = async (tableId: string) => {
    setLoading(true);
    setError(null);
    setSelectedExpertId(null);

    try {
      const res = await getAvailableExperts(tableId);
      if (res.success && Array.isArray(res.data)) {
        setExperts(res.data);
      } else {
        setError(res.error || 'Failed to fetch available experts.');
        setExperts([]);
      }
    } catch (err) {
      console.error('Error fetching available experts:', err);
      setError('Unable to load available experts. Please try again.');
      setExperts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!booking || !isOpen) {
      setExperts([]);
      setSelectedExpertId(null);
      setError(null);
      return;
    }

    const tableId = booking.tableId;
    if (tableId) {
      fetchExperts(tableId);
    } else {
      setError('Unable to load available experts: tableId is missing.');
    }
  }, [booking, isOpen]);

  if (!booking) return null;

  const handleAssignClick = async () => {
    if (!selectedExpertId || !booking) return;

    const tableId = booking.tableId;
    if (!tableId) {
      addToast('Error', 'Missing tableId for this order.', 'error');
      return;
    }

    const selectedExpert = experts.find((e) => e.workerId === selectedExpertId);
    if (!selectedExpert) {
      addToast('Error', 'Please select a worker first.', 'error');
      return;
    }

    setIsAssigning(true);
    try {
      const res = await manualAssignNestBooking({
        tableId,
        vendorId: selectedExpert.workerId,
        vendorName: selectedExpert.expertName,
        vendorPhoto: selectedExpert.profileImage || '',
        bookingStatus: 'Assigned',
      });

      if (res.success) {
        booking.vendorId = selectedExpert.workerId;
        booking.vendorName = selectedExpert.expertName;
        booking.vendorPhoto = selectedExpert.profileImage || '';
        booking.bookingStatus = 'Assigned';
        booking.status = 'Assigned';

        addToast(
          'Expert Assigned',
          `Successfully assigned ${selectedExpert.expertName} to Order #${booking.bookingId || booking.id}.`,
          'success'
        );

        onAssignSuccess?.(booking, selectedExpert);
        onClose();
      } else {
        addToast('Assignment Failed', res.error || 'Failed to assign expert. Please try again.', 'error');
      }
    } catch (err: any) {
      console.error('Error assigning expert:', err);
      addToast('Assignment Error', err?.message || 'Network error while assigning expert.', 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  const bookingIdDisplay = booking.bookingId || booking.id;
  const customerName = booking.customerName || booking.customer?.name || '—';
  const customerPhone = booking.customerPhone || booking.customer?.phone || '';
  const areaDisplay = booking.areaName || booking.areaId || 'Neo_Town';
  const isAlreadyAssigned = (booking.bookingStatus || booking.status) === 'Assigned' || Boolean(booking.vendorId || booking.vendorName);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${isAlreadyAssigned ? 'Reassign Expert' : 'Assign Expert'} — Order #${bookingIdDisplay}`}
      subtitle={`${booking.service} • Zone: ${areaDisplay}`}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Booking Summary Card */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#EEEEF2] bg-[#FAF9FC] p-4">
          <div className="space-y-0.5">
            <div className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wide">
              Customer & Delivery Premise
            </div>
            <div className="text-xs font-bold text-[#1F1F1F] flex items-center gap-2">
              <span>{customerName}</span>
              {customerPhone && (
                <span className="font-mono text-[11px] font-normal text-[#6B6B6B]">
                  ({customerPhone})
                </span>
              )}
            </div>
            <div className="text-[11px] text-[#6B6B6B] flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3 shrink-0 text-[#5B21B6]" />
              <span className="truncate max-w-sm sm:max-w-md">{booking.address}</span>
            </div>
          </div>

        </div>

        {/* Available Experts Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-[#1F1F1F]">
              Available Experts ({experts.length})
            </div>
            {booking.tableId && (
              <button
                type="button"
                onClick={() => fetchExperts(booking.tableId!)}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#5B21B6] hover:text-[#4C1D95] transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Experts</span>
              </button>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="space-y-2.5 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 w-full animate-pulse rounded-2xl bg-[#FAF9FC] border border-[#EEEEF2] flex items-center p-3 gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#EDE9FE] animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 w-1/3 rounded bg-slate-200" />
                    <div className="h-2.5 w-1/4 rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="rounded-2xl border border-rose-200 bg-[#FEF2F2] p-5 text-center text-xs text-[#B42318] space-y-2">
              <AlertCircle className="h-6 w-6 mx-auto text-[#B42318]" />
              <p className="font-semibold">{error}</p>
              {booking.tableId && (
                <button
                  type="button"
                  onClick={() => fetchExperts(booking.tableId!)}
                  className="rounded-xl bg-[#B42318] px-3.5 py-1.5 text-xs font-semibold text-white shadow-soft-sm hover:bg-rose-800 transition-colors"
                >
                  Retry Loading
                </button>
              )}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && experts.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#DDD6FE] bg-[#FAF9FC] p-8 text-center text-xs text-[#6B6B6B] space-y-1.5">
              <UserCheck className="h-7 w-7 mx-auto text-[#6B6B6B]" />
              <p className="font-semibold text-[#1F1F1F]">No available experts found</p>
              <p className="text-[11px] text-[#6B6B6B]">
                The backend dispatch engine returned no available experts for this booking record at this time.
              </p>
            </div>
          )}

          {/* Real Available Experts List */}
          {!loading && !error && experts.length > 0 && (
            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
              {experts.map((exp) => {
                const isSelected = selectedExpertId === exp.workerId;
                const isCurrentlyAssigned = booking.vendorId === exp.workerId;

                return (
                  <div
                    key={exp.workerId}
                    onClick={() => setSelectedExpertId(exp.workerId)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer shadow-soft-sm ${
                      isSelected
                        ? 'border-[#5B21B6] bg-[#EDE9FE]/40 ring-2 ring-[#5B21B6]/20'
                        : isCurrentlyAssigned
                        ? 'border-emerald-300 bg-[#ECFDF3]/40'
                        : 'border-[#EEEEF2] bg-white hover:border-[#DDD6FE] hover:bg-[#FAF9FC]'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      {/* Expert Avatar */}
                      {exp.profileImage ? (
                        <img
                          src={exp.profileImage}
                          alt={exp.expertName}
                          className="h-11 w-11 rounded-full object-cover border border-[#EEEEF2] shadow-soft-xs"
                          onError={(e) => {
                            // Fallback to initials if image fails to load
                            (e.currentTarget as HTMLElement).style.display = 'none';
                            const sibling = e.currentTarget.nextElementSibling;
                            if (sibling) (sibling as HTMLElement).style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className={`h-11 w-11 rounded-full bg-[#EDE9FE] text-[#5B21B6] font-bold text-xs flex items-center justify-center border border-[#DDD6FE] shadow-soft-xs ${
                          exp.profileImage ? 'hidden' : 'flex'
                        }`}
                      >
                        {exp.expertName
                          ? exp.expertName
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase()
                          : 'EX'}
                      </div>

                      {/* Expert Details */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#1F1F1F]">
                            {exp.expertName || 'Unnamed Expert'}
                          </span>
                          {isCurrentlyAssigned && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              Currently Assigned
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-[#6B6B6B] mt-0.5">
                          Expert ID: <span className="font-semibold text-[#5B21B6]">{exp.workerId}</span>
                        </div>
                      </div>
                    </div>

                    {/* Radio / Selection Indicator */}
                    <div className="flex items-center shrink-0">
                      {isSelected ? (
                        <CheckCircle2 className="h-5 w-5 text-[#5B21B6]" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-[#D1D5DB] hover:border-[#5B21B6] transition-colors" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-[#EEEEF2] pt-4">
          <div className="text-[11px] text-[#6B6B6B]">
            {selectedExpertId ? (
              <span>
                Expert ID: <strong className="font-mono text-[#5B21B6]">{selectedExpertId}</strong>
              </span>
            ) : (
              <span>Select an expert from the list above</span>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#EEEEF2] bg-white px-4 py-2 text-xs font-semibold text-[#1F1F1F] hover:bg-[#FAF9FC] transition-colors shadow-soft-sm"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleAssignClick}
              disabled={!selectedExpertId || isAssigning}
              className="rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white px-5 py-2 text-xs font-bold shadow-soft-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
              title={
                !selectedExpertId
                  ? 'Please select an available expert first'
                  : 'Assign selected expert to booking'
              }
            >
              {isAssigning && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              <span>{isAssigning ? 'Assigning...' : 'Assign'}</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
