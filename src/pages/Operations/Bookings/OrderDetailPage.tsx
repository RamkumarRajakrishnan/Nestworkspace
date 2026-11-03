import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useOperations } from '../../../context/OperationsContext';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { RoyalPassBadge } from '../../../components/common/RoyalPassBadge';
import { AssignWorkerModal } from '../../../components/operations/AssignWorkerModal';
import { ReassignWorkerModal } from '../../../components/operations/ReassignWorkerModal';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { getOrderDetails, cancelBooking } from '../../../services/api';
import { mapApiBookingToBooking, formatDurationInHours, getBookingTimelineStages } from '../../../services/bookingService';
import { DynamicKeyValueRenderer } from '../../../components/operations/DynamicKeyValueRenderer';
import { Booking } from '../../../types';
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
  Ticket,
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
  const [rawApiMessage, setRawApiMessage] = useState<Record<string, any> | null>(
    (routeBooking as any)?.rawMessage || null
  );
  const [loadingDirect, setLoadingDirect] = useState<boolean>(!routeBooking && !bookings.some((b) => b.tableId === id));
  const [errorDirect, setErrorDirect] = useState<string | null>(null);

  const contextBooking = bookings.find((b) => b.tableId === id || b.bookingId === id || b.id === id);
  const booking = fetchedBooking || contextBooking;

  const fetchOrderData = (showSpinner = false) => {
    // Resolve valid tableId (UUID) or fallback to id
    const tableIdToFetch =
      (id && id.length > 25 && id.includes('-') && !id.startsWith('HN-') ? id : null) ||
      booking?.tableId ||
      routeBooking?.tableId ||
      contextBooking?.tableId ||
      bookings.find((b) => b.bookingId === id || b.id === id)?.tableId ||
      id;

    if (!tableIdToFetch) return;
    if (showSpinner) setLoadingDirect(true);
    setErrorDirect(null);

    getOrderDetails(tableIdToFetch)
      .then((res) => {
        if (res.success && res.data) {
          const raw = (res as any).rawMessage || res.data;
          setRawApiMessage(raw);
          setFetchedBooking(mapApiBookingToBooking(raw));
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
      .finally(() => {
        setLoadingDirect(false);
      });
  };

  useEffect(() => {
    // If tableId is present, fetch latest order details from nestBookingDetails?tableId=<TABLE_ID>
    if (id) {
      fetchOrderData(!booking);
    }
  }, [id]);

  if (loadingDirect && !booking) {
    return (
      <div className="py-24 text-center space-y-3 max-w-md mx-auto">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#1B2E79]" />
        <h2 className="text-sm font-semibold text-[#1F1F1F]">Loading Order Details...</h2>
        <p className="text-xs text-[#6B6B6B]">Retrieving booking record #{id} from dispatch engine</p>
      </div>
    );
  }

  if (errorDirect && !booking) {
    return (
      <div className="py-16 text-center space-y-3 max-w-md mx-auto">
        <div className="h-12 w-12 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto text-rose-600 shadow-soft-sm">
          <AlertTriangle className="h-6 w-6 text-rose-600" />
        </div>
        <h2 className="text-base font-bold text-[#1F1F1F]">Unable to Load Booking #{id}</h2>
        <p className="text-xs text-[#6B6B6B]">{errorDirect}</p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => fetchOrderData(true)}
            className="rounded-xl border border-[#EEEEF2] bg-white px-4 py-2 text-xs font-semibold text-[#1F1F1F] hover:bg-[#FAF9FC] shadow-soft-sm transition-all cursor-pointer"
          >
            Retry Fetch
          </button>
          <button
            onClick={() => navigate('/bookings')}
            className="rounded-xl bg-[#1B2E79] px-4 py-2 text-xs font-semibold text-white hover:bg-[#13225C] transition-all shadow-soft-sm cursor-pointer"
          >
            Return to Bookings
          </button>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="py-16 text-center space-y-3 max-w-md mx-auto">
        <h2 className="text-base font-bold text-[#1F1F1F]">Booking #{id} Not Found</h2>
        <p className="text-xs text-[#6B6B6B]">The requested order could not be located in the dispatch records.</p>
        <button
          onClick={() => navigate('/bookings')}
          className="rounded-xl bg-[#1B2E79] px-4 py-2 text-xs font-semibold text-white hover:bg-[#13225C] transition-all shadow-soft-sm cursor-pointer"
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
  const customerNotesDisplay = booking.notes || rawApiMessage?.customerNotes || rawApiMessage?.notes;
  const amountDisplay = booking.totalAmount !== undefined && booking.totalAmount !== '' 
    ? booking.totalAmount 
    : (booking.amount || '—');
  const durationDisplay = formatDurationInHours(booking.duration || booking.durationMinutes);
  const timelineStages = getBookingTimelineStages(booking);

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

  // Dynamic API data dictionary containing returned API fields
  const displayApiData: Record<string, any> = rawApiMessage || (booking as any)?.rawMessage || {
    tableId: booking.tableId,
    bookingId: booking.bookingId || booking.id,
    bookingStatus: booking.bookingStatus || booking.status,
    bookingType: booking.bookingType,
    customerName: booking.customerName || booking.customer?.name,
    customerPhone: booking.customerPhone || booking.customer?.phone,
    customerEmail: booking.customerEmail || booking.customer?.email,
    customerNotes: booking.notes,
    vendorId: booking.vendorId,
    vendorName: booking.vendorName,
    vendorPhoto: booking.vendorPhoto,
    address: booking.address,
    areaName: areaDisplay,
    createdTime: booking.createdTime,
    requestedTime: booking.requestedTime,
    assignedTime: booking.assignedTime,
    startedTime: booking.startedTime,
    completedTime: booking.completedTime,
    duration: booking.duration || booking.durationMinutes,
    totalAmount: booking.totalAmount || booking.amount,
    paymentStatus: booking.paymentStatus,
    slaTimer: booking.slaTimer,
    slaAlert: booking.slaAlert,
  };

  // Check if pass booking is yes
  const isPassBooking = Boolean(
    displayApiData?.passbooking === true ||
    displayApiData?.passbooking === 'true' ||
    displayApiData?.passbooking === 1 ||
    String(displayApiData?.passbooking || '').trim().toLowerCase() === 'yes' ||
    String(displayApiData?.passBooking || '').trim().toLowerCase() === 'yes' ||
    rawApiMessage?.passbooking === true ||
    rawApiMessage?.passbooking === 'true' ||
    rawApiMessage?.passbooking === 1 ||
    String(rawApiMessage?.passbooking || '').trim().toLowerCase() === 'yes' ||
    String(rawApiMessage?.passBooking || '').trim().toLowerCase() === 'yes' ||
    (booking as any)?.passbooking === true ||
    (booking as any)?.passbooking === 'true' ||
    (booking as any)?.passbooking === 1 ||
    String((booking as any)?.passbooking || '').trim().toLowerCase() === 'yes' ||
    String((booking as any)?.passBooking || '').trim().toLowerCase() === 'yes' ||
    String(displayApiData?.paymentMethod || '').trim().toLowerCase() === 'pass'
  );

  const passId =
    displayApiData?.passId ||
    displayApiData?.passid ||
    rawApiMessage?.passId ||
    rawApiMessage?.passid ||
    (booking as any)?.passId ||
    (booking as any)?.passid;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Back button & Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/bookings')}
            className="rounded-xl border border-[#EEEEF2] bg-white p-2 text-[#6B6B6B] hover:text-[#1B2E79] hover:bg-[#EEF3FF] shadow-soft-sm transition-colors cursor-pointer"
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
                  className="rounded-xl bg-[#1B2E79] px-3.5 py-2 text-xs font-semibold text-white shadow-soft-sm hover:bg-[#13225C] transition-all active:scale-95 cursor-pointer"
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

      {/* Main Grid: Booking Info + Assignment Details + Timeline (First Image) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Booking Details (2 Cols) */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-2xl border border-[#EEEEF2] bg-white p-5 shadow-soft-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EEEEF2] pb-3">
              <h2 className="text-sm font-bold text-[#1F1F1F] uppercase tracking-wider">
                Booking Overview
              </h2>

              {isPassBooking && (
                <RoyalPassBadge size="md" className="-my-1.5" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[#6B6B6B] font-mono text-[10px]">CUSTOMER NAME</span>
                <div className="font-semibold text-[#1F1F1F] mt-0.5">{customerName}</div>
              </div>
              <div>
                <span className="text-[#6B6B6B] font-mono text-[10px]">PHONE NUMBER</span>
                <div className="font-mono text-[#1B2E79] font-semibold mt-0.5">{customerPhone}</div>
              </div>
              <div className="col-span-2">
                <span className="text-[#6B6B6B] font-mono text-[10px]">SERVICE ADDRESS</span>
                <div className="text-[#1F1F1F] mt-0.5 leading-relaxed">{booking.address}</div>
              </div>
              <div>
                <span className="text-[#6B6B6B] font-mono text-[10px]">NANO-MARKET ZONE</span>
                <div className="font-mono text-[#1B2E79] font-semibold mt-0.5">{areaDisplay}</div>
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
                <div className="text-base font-bold font-mono text-[#1B2E79] mt-0.5">₹{amountDisplay}</div>
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

            {customerNotesDisplay && (
              <div className="rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-3 text-xs text-[#1F1F1F]">
                <span className="text-[#6B6B6B] font-semibold block text-[10px] uppercase font-mono">Customer Special Notes</span>
                <p className="mt-1">{customerNotesDisplay}</p>
              </div>
            )}
          </div>

          {/* Assigned Experts Cards */}
          <div className="rounded-2xl border border-[#EEEEF2] bg-white p-5 shadow-soft-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#EEEEF2] pb-3">
              <h2 className="text-sm font-bold text-[#1F1F1F] uppercase tracking-wider">
                Assigned Expert ({hasAssignedVendor ? 1 : 0} / 1)
              </h2>
              <span className="text-xs font-mono text-emerald-700 font-semibold bg-[#ECFDF3] px-2.5 py-0.5 rounded-full">
                {hasAssignedVendor ? '✓ Expert Assigned' : '⚠️ Pending Assignment'}
              </span>
            </div>

            {!hasAssignedVendor ? (
              <div className="rounded-xl border border-dashed border-[#EEEEF2] p-8 text-center text-xs text-[#6B6B6B]">
                No experts currently dispatched.
              </div>
            ) : (
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
                        <div className="h-10 w-10 rounded-full bg-[#EEF3FF] text-[#1B2E79] font-bold text-xs flex items-center justify-center border border-[#C4D9FD]">
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
            )}
          </div>
        </div>

        {/* Dispatch & Fulfillment Timeline (1 Col) */}
        <div className="rounded-2xl border border-[#EEEEF2] bg-white p-5 shadow-soft-sm space-y-4">
          <h2 className="text-sm font-bold text-[#1F1F1F] uppercase tracking-wider border-b border-[#EEEEF2] pb-3">
            Dispatch & Fulfillment Timeline
          </h2>

          <div className="pt-1">
            {timelineStages.map((stage, idx) => {
              const isLast = idx === timelineStages.length - 1;
              const isStageCompleted = stage.isCompleted;
              const isNextCompleted = Boolean(timelineStages[idx + 1]?.isCompleted);
              return (
                <div key={stage.key} className="flex gap-3 text-xs">
                  {/* Timeline dot and connecting line */}
                  <div className="flex flex-col items-center shrink-0">
                    <div
                      className={`h-3 w-3 rounded-full shrink-0 mt-0.5 ${
                        isStageCompleted
                          ? 'bg-[#1B2E79] ring-4 ring-[#EEF3FF]'
                          : 'bg-[#D1D5DB] ring-4 ring-[#F3F4F6]'
                      }`}
                    />
                    {!isLast && (
                      <div
                        className={`w-0.5 grow min-h-[30px] my-1 ${
                          isNextCompleted ? 'bg-[#1B2E79]' : 'bg-[#E5E7EB]'
                        }`}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className={`flex-1 ${!isLast ? 'pb-4' : 'pb-0'}`}>
                    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
                      <span className="font-bold text-xs text-[#1F1F1F]">{stage.title}</span>
                      <span
                        className={`font-mono text-[11px] ${
                          isStageCompleted
                            ? 'text-[#1B2E79] font-semibold'
                            : stage.timeDisplay !== 'Pending'
                            ? 'text-[#475467] font-medium'
                            : 'text-[#9CA3AF] italic'
                        }`}
                      >
                        {stage.timeDisplay}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-[#6B6B6B] leading-relaxed break-words">
                      {stage.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dynamic API Response Fields (Only fields NOT already shown above) */}
      <DynamicKeyValueRenderer
        data={displayApiData}
        excludeAlreadyDisplayed={true}
      />

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
