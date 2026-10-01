import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Assignment } from '../../types';
import { useOperations } from '../../context/OperationsContext';
import { AlertTriangle, ShieldAlert, Check } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

interface ReassignWorkerModalProps {
  assignment: Assignment | null;
  isOpen: boolean;
  onClose: () => void;
  preselectedTargetBookingId?: string;
}

export const ReassignWorkerModal: React.FC<ReassignWorkerModalProps> = ({
  assignment,
  isOpen,
  onClose,
  preselectedTargetBookingId,
}) => {
  const { workers, bookings, reassignWorker } = useOperations();

  const [targetBookingId, setTargetBookingId] = useState<string>(
    preselectedTargetBookingId || 'BK-1005'
  );
  const [replacementWorkerId, setReplacementWorkerId] = useState<string>('WRK-2002');
  const [reason, setReason] = useState<string>('SLA intervention');
  const [customReason, setCustomReason] = useState<string>('');
  const [step, setStep] = useState<'configure' | 'confirm'>('configure');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!assignment) return null;

  const currentWorker = workers.find((w) => w.id === assignment.workerId);
  const sourceBooking = bookings.find((b) => b.id === assignment.bookingId);
  const targetBooking = bookings.find((b) => b.id === targetBookingId);
  const replacementWorker = workers.find((w) => w.id === replacementWorkerId);

  const availableReplacements = workers.filter(
    (w) => w.id !== currentWorker?.id && (w.status === 'Available' || w.areaId === sourceBooking?.areaId)
  );

  const reasonsList = [
    'Customer request',
    'Expert unavailable',
    'SLA intervention',
    'Operational balancing',
    'Emergency / Breakdown',
    'Other',
  ];

  const handleNextStep = () => {
    setStep('confirm');
  };

  const handleExecuteReassignment = async () => {
    setIsSubmitting(true);
    const finalReason = reason === 'Other' ? customReason : reason;
    await reassignWorker(
      assignment.id,
      targetBookingId,
      assignment.workerId,
      replacementWorkerId === 'none' ? null : replacementWorkerId,
      finalReason
    );
    setIsSubmitting(false);
    onClose();
    setStep('configure');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Expert Reassignment Console"
      subtitle={`Reallocating ${currentWorker?.name || assignment.workerId} between bookings`}
      maxWidth="2xl"
      footer={
        step === 'configure' ? (
          <>
            <button
              onClick={onClose}
              className="rounded-xl border border-[#EEEEF2] bg-white px-4 py-2 text-xs font-semibold text-[#6B6B6B] hover:bg-[#FAF9FC] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleNextStep}
              className="rounded-xl bg-[#5B21B6] px-4 py-2 text-xs font-bold text-white shadow-soft-sm hover:bg-[#4C1D95] transition-all active:scale-95"
            >
              Review Reassignment →
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setStep('configure')}
              className="rounded-xl border border-[#EEEEF2] bg-white px-4 py-2 text-xs font-semibold text-[#6B6B6B] hover:bg-[#FAF9FC] transition-colors"
            >
              ← Back to Adjust
            </button>
            <button
              onClick={handleExecuteReassignment}
              disabled={isSubmitting}
              className="rounded-xl bg-[#B42318] px-4 py-2 text-xs font-bold text-white shadow-soft-sm hover:bg-[#991B1B] transition-all active:scale-95"
            >
              {isSubmitting ? 'Applying Reassignment...' : 'Confirm & Execute Reassignment'}
            </button>
          </>
        )
      }
    >
      {step === 'configure' ? (
        <div className="space-y-4">
          {/* Conflict Warning Box */}
          <div className="flex items-start gap-3 rounded-2xl border border-[#FED7AA] bg-[#FFF7ED] p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#C2410C]" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-[#C2410C]">
                Active Assignment Conflict Detected
              </h4>
              <p className="text-xs text-[#9A3412] leading-relaxed">
                <strong>{currentWorker?.name}</strong> is currently assigned to{' '}
                <strong>Job #{sourceBooking?.id} ({sourceBooking?.service})</strong> scheduled until{' '}
                {assignment.endTime}. Reassigning without a replacement will leave #{sourceBooking?.id} unfulfilled.
              </p>
            </div>
          </div>

          {/* Source vs Target Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Source Job */}
            <div className="rounded-2xl border border-[#EEEEF2] bg-[#FAF9FC] p-4">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#6B6B6B] font-bold">
                Source Booking (Current)
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs font-bold text-[#1F1F1F]">#{sourceBooking?.id}</span>
                <StatusBadge status={sourceBooking?.status || 'In Progress'} size="sm" />
              </div>
              <div className="mt-1 text-xs text-[#1F1F1F] font-semibold">{sourceBooking?.service}</div>
              <div className="text-[11px] text-[#6B6B6B]">{sourceBooking?.customer.name}</div>
              <div className="mt-2.5 text-[10px] text-[#6B6B6B] border-t border-[#EEEEF2] pt-2">
                Zone: <span className="font-mono text-[#5B21B6] font-semibold">{sourceBooking?.areaId}</span> • Time:{' '}
                <span className="text-[#1F1F1F]">{sourceBooking?.startTime}</span>
              </div>
            </div>

            {/* Target Job */}
            <div className="rounded-2xl border border-[#DDD6FE] bg-[#F5F3FF] p-4">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#5B21B6] font-bold">
                Destination Target Booking
              </div>
              <div className="mt-1">
                <select
                  value={targetBookingId}
                  onChange={(e) => setTargetBookingId(e.target.value)}
                  aria-label="Select Target Booking"
                  className="w-full rounded-xl border border-[#DDD6FE] bg-white p-2 text-xs font-semibold text-[#1F1F1F] focus:border-[#7C3AED] focus:outline-none"
                >
                  {bookings
                    .filter((b) => b.id !== sourceBooking?.id && b.status !== 'Completed')
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        #{b.id} — {b.service} ({b.priority})
                      </option>
                    ))}
                </select>
              </div>
              {targetBooking && (
                <div className="mt-2.5 text-xs text-[#6B6B6B] space-y-0.5">
                  <div className="text-[11px] text-[#1F1F1F] font-bold">{targetBooking.customer.name}</div>
                  <div className="text-[10px] text-[#5B21B6] font-semibold">
                    Priority: <strong>{targetBooking.priority}</strong> • Status: {targetBooking.status}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Replacement Candidate Selection */}
          <div className="rounded-2xl border border-[#EEEEF2] bg-white p-4.5 space-y-2.5 shadow-soft-sm">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1F1F1F]">
                Select Replacement Expert for #{sourceBooking?.id}
              </label>
              <span className="text-[11px] text-[#6B6B6B]">Prevents service drop</span>
            </div>

            <select
              value={replacementWorkerId}
              onChange={(e) => setReplacementWorkerId(e.target.value)}
              aria-label="Select Replacement Expert"
              className="w-full rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-2.5 text-xs text-[#1F1F1F] font-semibold focus:border-[#7C3AED] focus:bg-white focus:outline-none"
            >
              <option value="none">⚠️ Do not replace (Mark source booking unassigned)</option>
              {availableReplacements.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.id}) — {w.status} • {w.areaId} • ⭐ {w.rating}
                </option>
              ))}
            </select>

            {replacementWorker && replacementWorkerId !== 'none' && (
              <div className="flex items-center gap-2 pt-1 text-[11px] text-[#027A48] font-semibold">
                <Check className="h-3.5 w-3.5" />
                <span>
                  {replacementWorker.name} will be dispatched to #{sourceBooking?.id} automatically.
                </span>
              </div>
            )}
          </div>

          {/* Reason Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#1F1F1F]">
              Operational Reason <span className="text-[#B42318]">*</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {reasonsList.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold border transition-all ${
                    reason === r
                      ? 'bg-[#EDE9FE] border-[#7C3AED] text-[#5B21B6]'
                      : 'bg-[#F7F5FA] border-[#EEEEF2] text-[#6B6B6B] hover:text-[#1F1F1F]'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {reason === 'Other' && (
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter specific justification..."
                className="w-full rounded-xl border border-[#EEEEF2] bg-[#F7F5FA] p-2.5 text-xs text-[#1F1F1F] focus:border-[#7C3AED] focus:bg-white focus:outline-none"
              />
            )}
          </div>
        </div>
      ) : (
        /* Confirmation Step */
        <div className="space-y-4 py-2">
          <div className="rounded-2xl border border-[#FECDCA] bg-[#FEF2F2] p-5 text-center space-y-2">
            <ShieldAlert className="mx-auto h-8 w-8 text-[#B42318]" />
            <h3 className="text-sm font-bold text-[#1F1F1F]">
              Confirm Expert Reallocation
            </h3>
            <p className="text-xs text-[#6B6B6B] max-w-md mx-auto">
              Are you sure you want to reassign <strong>{currentWorker?.name}</strong> from{' '}
              <strong>Job #{sourceBooking?.id}</strong> to <strong>Job #{targetBooking?.id}</strong>?
            </p>
          </div>

          <div className="rounded-2xl border border-[#EEEEF2] bg-[#FAF9FC] p-4 space-y-2 text-xs">
            <div className="flex justify-between text-[#1F1F1F]">
              <span className="text-[#6B6B6B]">Reassigned Expert:</span>
              <span className="font-bold">{currentWorker?.name} ({currentWorker?.id})</span>
            </div>
            <div className="flex justify-between text-[#1F1F1F]">
              <span className="text-[#6B6B6B]">Target Booking:</span>
              <span className="font-bold text-[#5B21B6]">#{targetBooking?.id} ({targetBooking?.service})</span>
            </div>
            <div className="flex justify-between text-[#1F1F1F]">
              <span className="text-[#6B6B6B]">Source Booking Replacement:</span>
              <span className="font-bold text-[#C2410C]">
                {replacementWorkerId === 'none' ? 'None (Unassigned)' : `${replacementWorker?.name}`}
              </span>
            </div>
            <div className="flex justify-between text-[#1F1F1F] border-t border-[#EEEEF2] pt-2">
              <span className="text-[#6B6B6B]">Audit Justification:</span>
              <span className="font-mono text-[#5B21B6] font-semibold">{reason === 'Other' ? customReason : reason}</span>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
