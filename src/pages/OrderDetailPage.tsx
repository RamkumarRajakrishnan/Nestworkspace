import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useOperations } from '../context/OperationsContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { AssignWorkerModal } from '../components/assignments/AssignWorkerModal';
import { ReassignWorkerModal } from '../components/assignments/ReassignWorkerModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { getOrderDetails, cancelBooking } from '../services/api';
import { mapApiBookingToBooking, formatDurationInHours } from '../services/bookingService';
import { Booking } from '../types';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Calendar, 
  User, 
  Phone, 
  ShieldCheck, 
  DollarSign, 
  Share2, 
  AlertTriangle, 
  Compass, 
  Eye,
  Ban,
  Loader2
} from 'lucide-react';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const routeBooking = (location.state as { booking?: Booking } | undefined)?.booking;

  const { bookings, workers, assignments, expandMarketRadius, addToast } = useOperations();

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Local fetched booking state initialized with route state if available to avoid blank screen
  const [fetchedBooking, setFetchedBooking] = useState<Booking | null>(routeBooking || null);
  const [loadingDirect, setLoadingDirect] = useState<boolean>(!routeBooking && !bookings.some((b) => b.tableId === id));
  const [errorDirect, setErrorDirect] = useState<string | null>(null);

  const contextBooking = bookings.find((b) => b.tableId === id);
  const booking = fetchedBooking || contextBooking;

  useEffect(() => {
    // If tableId is present, fetch latest order details from nestBookingDetails?tableId=<TABLE_ID>
    if (id) {
      if (!booking) setLoadingDirect(true);
      setErrorDirect(null);
      getOrderDetails(id)
        .then((res) => {
          if (res.success && res.data) {
            setFetchedBooking(mapApiBookingToBooking(res.data));
          } else {
            if (!booking) {
              setErrorDirect(res.error || 'Unable to load order details.');
            }
          }
        })
        .catch((e) => {
          console.error('Error fetching order details directly:', e);
          if (!booking) {
            setErrorDirect('Unable to load order details. Please check your connection.');
          }
        })
        .finally(() => setLoadingDirect(false));
    }
  }, [id]);

  if (loadingDirect) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#5B21B6]" />
        <h2 className="text-sm font-semibold text-[#1F1F1F]">Loading Order Details...</h2>
        <p className="text-xs text-[#6B6B6B]">Retrieving booking record #{id} from dispatch engine</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="py-16 text-center space-y-3">
        <h2 className="text-base font-bold text-[#1F1F1F]">Booking #{id} Not Found</h2>
        <p className="text-xs text-[#6B6B6B]">The requested order could not be located in the dispatch records.</p>
        <button
          onClick={() => navigate('/bookings')}
          className="rounded-xl bg-[#5B21B6] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4C1D95] transition-all shadow-soft-sm cursor-pointer"
        >
          Return to Bookings
        </button>
      </div>
    );
  }

  const assignedWorkers = workers.filter((w) => booking.assignedWorkerIds?.includes(w.id));
  const activeAssignment = assignments.find((a) => a.bookingId === booking.id || a.bookingId === booking.bookingId);
  const hasAssignedVendor = Boolean(booking.vendorName || booking.vendorId);

  // Requirement: Assign expert button is only showed for booked, assigned orders. Completed orders should not show it.
  const statusLower = String(booking.bookingStatus || booking.status || '').trim().toLowerCase();
  const isCompleted = statusLower === 'completed' || statusLower === 'cancelled';
  const showAssignExpert = statusLower === 'booked' || statusLower === 'assigned';

  const isAssigned = (booking.bookingStatus || booking.status) === 'Assigned' || Boolean(booking.vendorId || booking.vendorName);

  const handleCancelBooking = async (reason?: string) => {
    const tableId = booking.tableId;
    if (!tableId) {
      addToast('Error', 'Missing tableId to cancel order.', 'error');
      return;
    }
    try {
      const res = await cancelBooking(tableId);
      if (res.success) {
        booking.status = 'Cancelled';
        booking.bookingStatus = 'Cancelled';
        addToast(
          'Booking Cancelled',
          res.data?.message || `Order #${booking.bookingId || booking.id} cancelled. Reason: ${reason || 'Admin action'}`
        );
      } else {
        addToast('Cancellation Failed', res.error || 'Failed to cancel booking.', 'error');
      }
    } catch (err: any) {
      addToast('Error', err?.message || 'Error cancelling booking.', 'error');
    } finally {
      setShowCancelDialog(false);
    }
  };

  const bookingIdDisplay = booking.bookingId || booking.id;
  const areaDisplay = booking.areaName || booking.areaId || 'Neo_Town';
  const customerName = booking.customerName || booking.customer?.name || '—';
  const customerPhone = booking.customerPhone || booking.customer?.phone || '—';
  const amountDisplay = booking.totalAmount !== undefined && booking.totalAmount !== '' 
    ? booking.totalAmount 
    : (booking.amount || '—');
  // Requirement: in eye icon page and order details page convert duration from min to hours
  const durationDisplay = formatDurationInHours(booking.duration || booking.durationMinutes);

  // Format scheduled time safely
  let scheduledDisplay = `${booking.date} at ${booking.startTime}`;
  if (booking.requestedTime) {
    try {
      const d = new Date(booking.requestedTime);
      if (!isNaN(d.getTime())) {
        scheduledDisplay = d.toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
      }
    } catch {
      // keep fallback
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button & Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/bookings')}
            className="rounded-xl border border-[#EEEEF2] bg-white p-2 text-[#6B6B6B] hover:text-[#5B21B6] hover:bg-[#EDE9FE] shadow-soft-sm transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold font-mono text-[#1F1F1F]">Order #{bookingIdDisplay}</h1>
              <StatusBadge status={booking.bookingStatus || booking.status} size="md" pulse={booking.status === 'SLA Risk' || booking.slaAlert === 'SLA Risk'} />
            </div>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              {booking.service} • Nano-Market {areaDisplay}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {!isCompleted && (
            <>
              {/* Both Assign Expert and Cancel buttons are shown for booked / assigned orders */}
              {showAssignExpert && (
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="rounded-xl bg-[#5B21B6] px-3.5 py-2 text-xs font-semibold text-white shadow-soft-sm hover:bg-[#4C1D95] transition-all active:scale-95 cursor-pointer"
                >
                  {isAssigned ? 'Reassign Expert' : 'Assign Expert'}
                </button>
              )}

              <button
                onClick={() => setShowCancelDialog(true)}
                className="rounded-xl border border-rose-200 bg-[#FEF2F2] px-3 py-2 text-xs font-medium text-[#B42318] hover:bg-rose-100 shadow-soft-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Ban className="h-3.5 w-3.5" />
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Grid: Booking Info + Assignment Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Booking Details (2 Cols) */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-2xl border border-[#EEEEF2] bg-white p-5 shadow-soft-sm space-y-4">
            <h2 className="text-sm font-bold text-[#1F1F1F] uppercase tracking-wider border-b border-[#EEEEF2] pb-3">
              Booking Information
            </h2>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[#6B6B6B] font-mono text-[10px]">CUSTOMER NAME</span>
                <div className="font-semibold text-[#1F1F1F] mt-0.5">{customerName}</div>
              </div>
              <div>
                <span className="text-[#6B6B6B] font-mono text-[10px]">PHONE NUMBER</span>
                <div className="font-mono text-[#5B21B6] font-semibold mt-0.5">{customerPhone}</div>
              </div>
              <div className="col-span-2">
                <span className="text-[#6B6B6B] font-mono text-[10px]">SERVICE ADDRESS</span>
                <div className="text-[#1F1F1F] mt-0.5 leading-relaxed">{booking.address}</div>
              </div>
              <div>
                <span className="text-[#6B6B6B] font-mono text-[10px]">NANO-MARKET ZONE</span>
                <div className="font-mono text-[#5B21B6] font-semibold mt-0.5">{areaDisplay}</div>
              </div>
              <div>
                <span className="text-[#6B6B6B] font-mono text-[10px]">SCHEDULED DATE & TIME</span>
                <div className="text-[#1F1F1F] mt-0.5">{scheduledDisplay}</div>
              </div>
              <div>
                <span className="text-[#6B6B6B] font-mono text-[10px]">ESTIMATED DURATION</span>
                <div className="text-[#1F1F1F] mt-0.5">{durationDisplay}</div>
              </div>
              <div>
                <span className="text-[#6B6B6B] font-mono text-[10px]">ORDER VALUE</span>
                <div className="text-base font-bold font-mono text-[#5B21B6] mt-0.5">₹{amountDisplay}</div>
              </div>
              <div>
                <span className="text-[#6B6B6B] font-mono text-[10px]">PAYMENT STATUS</span>
                <div className="font-semibold text-emerald-700 mt-0.5">{booking.paymentStatus || 'Success'}</div>
              </div>
              <div>
                <span className="text-[#6B6B6B] font-mono text-[10px]">SLA STATUS</span>
                <div className="font-mono font-semibold text-[#1F1F1F] mt-0.5">
                  {booking.slaTimer || '—'} {booking.slaAlert ? `(${booking.slaAlert})` : ''}
                </div>
              </div>
            </div>

            {booking.notes && (
              <div className="rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-3 text-xs text-[#1F1F1F]">
                <span className="text-[#6B6B6B] font-semibold block text-[10px] uppercase font-mono">Customer Special Notes</span>
                <p className="mt-1">{booking.notes}</p>
              </div>
            )}
          </div>

          {/* Assigned Experts Cards */}
          <div className="rounded-2xl border border-[#EEEEF2] bg-white p-5 shadow-soft-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#EEEEF2] pb-3">
              <h2 className="text-sm font-bold text-[#1F1F1F] uppercase tracking-wider">
                Assigned Expert ({hasAssignedVendor || assignedWorkers.length > 0 ? 1 : 0} / 1)
              </h2>
              <span className="text-xs font-mono text-emerald-700 font-semibold bg-[#ECFDF3] px-2.5 py-0.5 rounded-full">
                {hasAssignedVendor || assignedWorkers.length > 0 ? '✓ Expert Assigned' : '⚠️ Pending Assignment'}
              </span>
            </div>

            {!hasAssignedVendor && assignedWorkers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#EEEEF2] p-8 text-center text-xs text-[#6B6B6B]">
                No experts currently dispatched. Click &quot;Assign Expert&quot; to dispatch candidate.
              </div>
            ) : hasAssignedVendor ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {booking.vendorPhoto ? (
                        <img
                          src={booking.vendorPhoto}
                          alt={booking.vendorName}
                          className="h-10 w-10 rounded-full object-cover border border-[#EEEEF2]"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-[#EDE9FE] text-[#5B21B6] font-bold text-xs flex items-center justify-center border border-[#DDD6FE]">
                          {booking.vendorName ? booking.vendorName.slice(0, 2).toUpperCase() : 'EX'}
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-bold text-[#1F1F1F]">{booking.vendorName || 'Assigned Expert'}</div>
                        <div className="text-[10px] font-mono text-[#6B6B6B]">Expert ID: {booking.vendorId}</div>
                      </div>
                    </div>
                    <StatusBadge status={booking.bookingStatus || 'Assigned'} size="sm" />
                  </div>

                  <div className="text-xs text-[#6B6B6B] space-y-1 border-t border-[#EEEEF2] pt-2">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="text-emerald-700 font-semibold">{booking.bookingStatus || 'Assigned'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Area:</span>
                      <span className="font-mono text-[#1F1F1F]">{areaDisplay}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {assignedWorkers.map((w) => (
                  <div
                    key={w.id}
                    className="rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={w.avatar}
                          alt={w.name}
                          className="h-10 w-10 rounded-full object-cover border border-[#EEEEF2]"
                        />
                        <div>
                          <div className="text-xs font-bold text-[#1F1F1F]">{w.name}</div>
                          <div className="text-[10px] font-mono text-[#6B6B6B]">Expert ID: {w.id}</div>
                        </div>
                      </div>
                      <StatusBadge status={w.status} size="sm" />
                    </div>

                    <div className="text-xs text-[#6B6B6B] space-y-1 border-t border-[#EEEEF2] pt-2">
                      <div className="flex justify-between">
                        <span>Rating:</span>
                        <span className="text-amber-600 font-semibold">⭐ {w.rating}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Direct Phone:</span>
                        <span className="font-mono text-[#1F1F1F]">{w.phone}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/workers/${w.id}`)}
                      className="w-full rounded-xl border border-[#EEEEF2] bg-white py-1.5 text-[11px] font-semibold text-[#1F1F1F] hover:text-[#5B21B6] hover:bg-[#EDE9FE] shadow-soft-sm transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Eye className="h-3.5 w-3.5 text-[#5B21B6]" /> View Profile
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dispatch Timeline (1 Col) */}
        <div className="rounded-2xl border border-[#EEEEF2] bg-white p-5 shadow-soft-sm space-y-4">
          <h2 className="text-sm font-bold text-[#1F1F1F] uppercase tracking-wider border-b border-[#EEEEF2] pb-3">
            Dispatch Audit Timeline
          </h2>

          <div className="relative border-l border-[#EEEEF2] ml-2 space-y-5 pl-4 text-xs">
            {booking.timeline && booking.timeline.length > 0 ? (
              booking.timeline.map((event, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[21px] top-0.5 h-2.5 w-2.5 rounded-full bg-[#5B21B6] ring-4 ring-[#EDE9FE]" />
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-[#6B6B6B]">{event.time}</span>
                    <span className="font-semibold text-[#1F1F1F]">{event.title}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#6B6B6B] leading-relaxed">
                    {event.description}
                  </p>
                </div>
              ))
            ) : (
              <div className="relative">
                <div className="absolute -left-[21px] top-0.5 h-2.5 w-2.5 rounded-full bg-[#5B21B6] ring-4 ring-[#EDE9FE]" />
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-[#6B6B6B]">Live Status</span>
                  <span className="font-semibold text-[#1F1F1F]">{booking.bookingStatus || 'Active'}</span>
                </div>
                <p className="mt-1 text-[11px] text-[#6B6B6B] leading-relaxed">
                  SLA Timer: {booking.slaTimer} ({booking.slaAlert})
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AssignWorkerModal
        booking={booking}
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onAssignSuccess={(updatedBooking) => {
          setFetchedBooking({ ...updatedBooking });
        }}
      />

      {activeAssignment && (
        <ReassignWorkerModal
          assignment={activeAssignment}
          isOpen={showReassignModal}
          onClose={() => setShowReassignModal(false)}
        />
      )}

      <ConfirmDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleCancelBooking}
        title="Cancel Customer Booking"
        message={`Are you sure you want to cancel booking #${bookingIdDisplay} (${booking.service})? This will unassign workers and alert the customer.`}
        variant="danger"
        requireReason={true}
        reasonOptions={['Customer Cancelled', 'No Supply Available', 'Emergency Incident', 'Duplicate Booking']}
      />
    </div>
  );
};
