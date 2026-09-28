import React, { useState } from 'react';
import { Drawer } from '../common/Drawer';
import { Booking } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { useOperations } from '../../context/OperationsContext';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Clock, 
  AlertTriangle, 
  Share2, 
  Users, 
  Compass, 
  ArrowRight,
  UserCheck,
  Ban,
  RefreshCw
} from 'lucide-react';
import { AssignWorkerModal } from '../assignments/AssignWorkerModal';
import { ReassignWorkerModal } from '../assignments/ReassignWorkerModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { cancelBooking } from '../../services/api';
import { formatDurationInHours } from '../../services/bookingService';

interface BookingDetailDrawerProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderCancelled?: (tableId: string) => void;
}

export const BookingDetailDrawer: React.FC<BookingDetailDrawerProps> = ({
  booking,
  isOpen,
  onClose,
  onOrderCancelled,
}) => {
  const navigate = useNavigate();
  const { workers, assignments, expandMarketRadius, addToast } = useOperations();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  if (!booking) return null;

  const bookingIdDisplay = booking.bookingId || booking.id;
  const areaDisplay = booking.areaName || booking.areaId || 'Neo_Town';
  const customerName = booking.customerName || booking.customer?.name || '—';
  const customerPhone = booking.customerPhone || booking.customer?.phone || '—';
  const amountDisplay = booking.totalAmount !== undefined && booking.totalAmount !== '' 
    ? booking.totalAmount 
    : (booking.amount || '—');
  // Requirement: in eye icon page and order details page convert duration from min to hours
  const durationDisplay = formatDurationInHours(booking.duration || booking.durationMinutes);

  // Requirement: Assign expert button is only showed for booked, assigned orders. Completed orders should not show it.
  const statusLower = String(booking.bookingStatus || booking.status || '').trim().toLowerCase();
  const isCompleted = statusLower === 'completed' || statusLower === 'cancelled';
  const showAssignExpert = statusLower === 'booked' || statusLower === 'assigned';
  const canCancel = !isCompleted;

  const assignedWorkers = workers.filter((w) => booking.assignedWorkerIds?.includes(w.id));
  const activeAssignment = assignments.find((a) => a.bookingId === booking.id || a.bookingId === booking.bookingId);
  const hasAssignedVendor = Boolean(booking.vendorName || booking.vendorId);

  // Requirement: for cancel button use this api https://haatza.com/_functions/cancelNestBooking
  // Pass table id dynamically from orders page api like nestBookings api
  const handleConfirmCancel = async () => {
    const tableIdToCancel = booking.tableId || booking.id;
    if (!tableIdToCancel) {
      addToast('Error', 'Unable to cancel: Missing tableId for this booking.', 'error');
      return;
    }

    setIsCancelling(true);
    try {
      const res = await cancelBooking(tableIdToCancel);
      if (res.success) {
        booking.bookingStatus = 'Cancelled';
        booking.status = 'Cancelled';
        if (!booking.timeline) booking.timeline = [];
        booking.timeline.push({
          time: 'Just now',
          title: 'Booking Cancelled',
          description: res.data?.message || 'Booking cancelled successfully and refund initiated',
          completed: true,
        });
        addToast(
          'Booking Cancelled',
          res.data?.message || 'Booking cancelled successfully and refund initiated',
          'success'
        );
        setShowCancelConfirm(false);
        onOrderCancelled?.(tableIdToCancel);
      } else {
        addToast(
          'Cancellation Failed',
          res.error || 'Failed to cancel booking. Please try again.',
          'error'
        );
      }
    } catch (err: any) {
      addToast('Error', err?.message || 'An unexpected error occurred while cancelling booking.', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title={`Booking #${bookingIdDisplay}`}
        subtitle={`${booking.service} • Zone: ${areaDisplay}`}
        width="lg"
        actions={
          <button
            onClick={() => {
              if (booking.tableId) {
                navigate(`/orders/${booking.tableId}`, { state: { booking } });
                onClose();
              }
            }}
            className="flex items-center gap-1.5 rounded-xl border border-[#EEEEF2] bg-white px-3 py-1.5 text-xs font-semibold text-[#5B21B6] hover:bg-[#F5F3FF] transition-colors shadow-soft-sm active:scale-95"
            title="Open Full Order Details Page"
          >
            <span>Order Details</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        }
      >
        <div className="space-y-4 pb-6">
          {/* Header Card */}
          <div className="rounded-2xl border border-[#EEEEF2] bg-[#FAF9FC] p-4 sm:p-5 shadow-soft-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#1F1F1F]">{booking.service}</h3>
                  <StatusBadge 
                    status={(booking.bookingStatus || booking.status) === 'In Progress' ? 'Ongoing' : (booking.bookingStatus || booking.status)} 
                    size="sm" 
                    pulse={booking.status === 'SLA Risk' || booking.slaAlert === 'SLA Risk'} 
                  />
                </div>
                <div className="mt-1 text-xs text-[#6B6B6B]">
                  Priority: <span className="font-bold text-[#B42318]">{booking.priority || 'Normal'}</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-base font-bold font-mono text-[#5B21B6]">₹{amountDisplay}</span>
                <span className="block text-[10px] text-[#6B6B6B]">{durationDisplay} slot</span>
              </div>
            </div>

            {/* SLA Timer Alert */}
            {(booking.status === 'SLA Risk' || booking.slaAlert === 'SLA Risk') && (
              <div className="mt-3.5 flex items-center gap-2.5 rounded-xl border border-[#FECDCA] bg-[#FEF2F2] p-3 text-xs text-[#B42318]">
                <AlertTriangle className="h-4 w-4 shrink-0 text-[#B42318] animate-pulse" />
                <span>
                  <strong>SLA Threshold Alert:</strong> {booking.slaTimer || `${Math.floor(booking.slaSecondsRemaining / 60)}m ${booking.slaSecondsRemaining % 60}s`} remaining before SLA breach.
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons: Assign expert only when not yet assigned (Reassign and Cancel buttons removed per user request) */}
          {showAssignExpert && !hasAssignedVendor && assignedWorkers.length === 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowAssignModal(true)}
                className="w-full rounded-xl bg-[#5B21B6] px-4 py-2.5 text-xs font-bold text-white shadow-soft-sm hover:bg-[#4C1D95] transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Users className="h-3.5 w-3.5" />
                Assign Expert
              </button>
            </div>
          )}

          {/* Customer & Location */}
          <div className="rounded-2xl border border-[#EEEEF2] bg-white p-4 sm:p-5 space-y-2.5 text-xs shadow-soft-sm">
            <h4 className="font-bold text-[#6B6B6B] uppercase font-mono text-[10px] tracking-wider">Customer Details</h4>
            <div className="flex flex-wrap items-center justify-between gap-2 text-[#1F1F1F]">
              <span className="font-bold text-sm truncate max-w-[220px]" title={customerName}>{customerName}</span>
              <span className="text-[#6B6B6B] font-mono text-xs shrink-0">{customerPhone}</span>
            </div>
            <div className="flex items-start gap-2 text-[#6B6B6B] pt-1 border-t border-[#F3F2F7]">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#5B21B6] mt-0.5" />
              <span className="leading-relaxed break-words">{booking.address}</span>
            </div>
          </div>

          {/* Assigned Experts Allocation */}
          <div className="rounded-2xl border border-[#EEEEF2] bg-white p-4 sm:p-5 space-y-3 shadow-soft-sm">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-[#1F1F1F] text-xs">Assigned Expert</h4>
              <span className="font-mono text-xs font-bold text-[#5B21B6]">
                {hasAssignedVendor || assignedWorkers.length > 0 ? '1 / 1 Expert' : '0 / 1 Expert'}
              </span>
            </div>

            {hasAssignedVendor ? (
              <div className="flex items-center justify-between rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-3">
                <div className="flex items-center gap-3">
                  {booking.vendorPhoto ? (
                    <img
                      src={booking.vendorPhoto}
                      alt={booking.vendorName}
                      className="h-9 w-9 rounded-full object-cover border border-white shadow-soft-sm"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-[#EDE9FE] text-[#5B21B6] font-bold text-xs flex items-center justify-center border border-[#DDD6FE]">
                      {booking.vendorName ? booking.vendorName.slice(0, 2).toUpperCase() : 'EX'}
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-bold text-[#1F1F1F]">{booking.vendorName || 'Assigned Expert'}</div>
                    <div className="text-[10px] text-[#6B6B6B] font-mono">Expert ID: {booking.vendorId}</div>
                  </div>
                </div>
                <StatusBadge status={booking.bookingStatus || 'Assigned'} size="sm" />
              </div>
            ) : assignedWorkers.length > 0 ? (
              <div className="space-y-2">
                {assignedWorkers.map((w) => (
                  <div
                    key={w.id}
                    className="flex items-center justify-between rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-3"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={w.avatar}
                        alt={w.name}
                        className="h-8 w-8 rounded-full object-cover border border-white shadow-soft-sm"
                      />
                      <div>
                        <div className="text-xs font-bold text-[#1F1F1F]">{w.name}</div>
                        <div className="text-[10px] text-[#6B6B6B] font-mono">{w.phone}</div>
                      </div>
                    </div>
                    <StatusBadge status={w.status} size="sm" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[#DDD6FE] bg-[#FAF9FC] p-4 text-center text-xs text-[#B45309] font-medium">
                No experts currently dispatched. Immediate assignment required.
              </div>
            )}
          </div>

          {/* Chronological Timeline */}
          <div className="rounded-2xl border border-[#EEEEF2] bg-white p-4 sm:p-5 space-y-3.5 shadow-soft-sm">
            <h4 className="font-bold text-[#6B6B6B] uppercase font-mono text-[10px] tracking-wider">
              Dispatch & Fulfillment Timeline
            </h4>
            <div className="pt-1">
              {booking.timeline && booking.timeline.length > 0 ? (
                booking.timeline.map((event, idx) => {
                  const isLast = idx === (booking.timeline?.length ?? 1) - 1;
                  return (
                    <div key={idx} className="flex gap-3 text-xs">
                      {/* Timeline dot and connecting line */}
                      <div className="flex flex-col items-center shrink-0">
                        <div className="h-3 w-3 rounded-full bg-[#5B21B6] ring-4 ring-[#EDE9FE] shrink-0 mt-0.5" />
                        {!isLast && (
                          <div className="w-0.5 grow bg-[#EDE9FE] min-h-[26px] my-1" />
                        )}
                      </div>

                      {/* Content */}
                      <div className={`flex-1 ${!isLast ? 'pb-4' : 'pb-0'}`}>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="font-mono text-[11px] text-[#6B6B6B] shrink-0">{event.time}</span>
                          <span className="font-bold text-xs text-[#1F1F1F]">{event.title}</span>
                        </div>
                        {event.description && (
                          <p className="mt-1 text-xs text-[#6B6B6B] leading-relaxed break-words">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex gap-3 text-xs">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="h-3 w-3 rounded-full bg-[#5B21B6] ring-4 ring-[#EDE9FE] shrink-0 mt-0.5" />
                  </div>
                  <div className="flex-1 pb-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-[#6B6B6B]">Live Status</span>
                      <span className="font-bold text-xs text-[#1F1F1F]">{booking.bookingStatus || 'Active'}</span>
                    </div>
                    <p className="mt-1 text-xs text-[#6B6B6B] leading-relaxed">
                      SLA Status: {booking.slaTimer} ({booking.slaAlert})
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Drawer>

      {/* Modals */}
      <AssignWorkerModal
        booking={booking}
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
      />

      {activeAssignment && (
        <ReassignWorkerModal
          assignment={activeAssignment}
          isOpen={showReassignModal}
          onClose={() => setShowReassignModal(false)}
        />
      )}

      {/* Cancel Order Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleConfirmCancel}
        title={`Cancel Booking #${bookingIdDisplay}`}
        message={`Are you sure you want to cancel booking #${bookingIdDisplay}? This will cancel the booking in the dispatch engine and initiate a refund.`}
        confirmText={isCancelling ? 'Cancelling...' : 'Yes, Cancel Booking'}
        cancelText="Keep Order Active"
        variant="danger"
      />
    </>
  );
};
