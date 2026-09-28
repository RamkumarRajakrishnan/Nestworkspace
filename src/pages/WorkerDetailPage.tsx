import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOperations } from '../context/OperationsContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { 
  ArrowLeft, 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Briefcase, 
  ShieldCheck, 
  TrendingUp, 
  AlertTriangle,
  Receipt,
  Radio,
  FileCheck
} from 'lucide-react';

export const WorkerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { workers, bookings, documents, payouts, updateWorkerStatus } = useOperations();

  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [targetStatus, setTargetStatus] = useState<any>(null);

  const worker = workers.find((w) => w.id === id);

  if (!worker) {
    return (
      <div className="py-16 text-center space-y-3">
        <h2 className="text-base font-bold text-white">Expert #{id} Not Found</h2>
        <button
          onClick={() => navigate('/workers')}
          className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
        >
          Return to Directory
        </button>
      </div>
    );
  }

  // Get current active job
  const currentBooking = bookings.find((b) => b.id === worker.currentJobId);

  // Worker compliance documents
  const workerDocs = documents.filter((d) => d.workerId === worker.id);

  // Worker payout ledger
  const workerPayout = payouts.find((p) => p.workerId === worker.id);

  // Mock schedule timeline
  const scheduleSlots = [
    { time: '09:00 AM', label: 'Job #BK-9001 (Completed)', status: 'Completed', details: 'House Cleaning' },
    { time: '11:00 AM', label: currentBooking ? `Job #${currentBooking.id} (${currentBooking.status})` : 'Idle / Available', status: worker.status, details: currentBooking?.service || 'Standing by for dispatch' },
    { time: '02:00 PM', label: 'Scheduled Slot (BK-2007)', status: 'Scheduled', details: 'Dusting & Wiping' },
    { time: '04:30 PM', label: 'Available Standby', status: 'Available', details: 'Buffer slot in zone' },
  ];

  const handleStatusChangeRequest = (status: any) => {
    setTargetStatus(status);
    setShowStatusConfirm(true);
  };

  const handleConfirmStatusChange = async () => {
    if (targetStatus) {
      await updateWorkerStatus(worker.id, targetStatus);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/workers')}
          className="rounded-xl border border-[#EEEEF2] bg-white p-2 text-[#6B6B6B] hover:text-[#5B21B6] hover:bg-[#EDE9FE] shadow-soft-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-xs font-mono text-[#6B6B6B]">Expert Directory / {worker.id}</span>
      </div>

      {/* Header Profile Hero Card */}
      <div className="rounded-2xl border border-[#EEEEF2] bg-white p-6 shadow-soft-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            <img
              src={worker.avatar}
              alt={worker.name}
              className="h-20 w-20 rounded-2xl object-cover border-2 border-[#EEEEF2] shadow-soft-sm"
            />
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl font-bold text-[#1F1F1F]">{worker.name}</h1>
                <span className="font-mono text-xs text-[#6B6B6B] font-semibold">{worker.id}</span>
                <StatusBadge status={worker.status} size="md" pulse={worker.status === 'Available'} />
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6B6B6B]">
                <span className="flex items-center gap-1 font-mono text-[#5B21B6] font-semibold bg-[#EDE9FE] px-2 py-0.5 rounded-lg">
                  <MapPin className="h-3.5 w-3.5 text-[#5B21B6]" />
                  {worker.areaId} Zone
                </span>
                <span className="flex items-center gap-1 text-amber-600 font-semibold">
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  {worker.rating} ({worker.ratingCount} reviews)
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-[#6B6B6B]" />
                  Joined {worker.joinedDate}
                </span>
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {worker.skills.map((s, idx) => (
                  <span
                    key={idx}
                    className="rounded-lg bg-[#EDE9FE] border border-[#DDD6FE] px-2.5 py-0.5 text-[11px] font-semibold text-[#5B21B6]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap sm:flex-col items-stretch gap-2 shrink-0">
            <button
              onClick={() => handleStatusChangeRequest(worker.status === 'Available' ? 'Unavailable' : 'Available')}
              className={`rounded-xl px-4 py-2 text-xs font-semibold shadow-soft-sm transition-all text-center ${
                worker.status === 'Available'
                  ? 'border border-amber-300 bg-[#FFF7ED] text-[#C2410C] hover:bg-amber-100'
                  : 'bg-[#5B21B6] text-white hover:bg-[#4C1D95]'
              }`}
            >
              {worker.status === 'Available' ? 'Mark Unavailable' : 'Set Available'}
            </button>
            <button
              onClick={() => handleStatusChangeRequest('Suspended')}
              className="rounded-xl border border-rose-200 bg-[#FEF2F2] px-4 py-2 text-xs font-semibold text-[#B42318] hover:bg-rose-100 shadow-soft-sm transition-all text-center"
            >
              Suspend Expert
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Details, Assignment, Schedule, Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Assignment Card */}
          <div className="rounded-2xl border border-[#EEEEF2] bg-white p-5 shadow-soft-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[#EEEEF2] pb-3">
              <h2 className="text-sm font-bold text-[#1F1F1F] uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-[#5B21B6]" />
                Current Active Assignment
              </h2>
              {currentBooking && (
                <StatusBadge status={currentBooking.status} size="sm" />
              )}
            </div>

            {currentBooking ? (
              <div className="rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#5B21B6]">
                      Booking #{currentBooking.id}
                    </span>
                    <h4 className="text-sm font-semibold text-[#1F1F1F] mt-0.5">{currentBooking.service}</h4>
                    <p className="text-xs text-[#6B6B6B] mt-1">{currentBooking.address}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-[#6B6B6B] font-mono">Scheduled Slot</span>
                    <div className="font-mono text-xs font-bold text-[#1F1F1F]">{currentBooking.startTime}</div>
                    <span className="text-[10px] text-[#6B6B6B]">{currentBooking.durationMinutes} mins</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[#EEEEF2] pt-3 text-xs">
                  <div>
                    <span className="text-[#6B6B6B]">Customer:</span>{' '}
                    <strong className="text-[#1F1F1F]">{currentBooking.customer.name}</strong>
                  </div>
                  <button
                    onClick={() => navigate(`/orders/${currentBooking.id}`)}
                    className="text-xs font-semibold text-[#5B21B6] hover:text-[#4C1D95]"
                  >
                    View Order Details →
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[#EEEEF2] p-6 text-center text-xs text-[#6B6B6B]">
                Expert has no active assignment. Ready for automated or supervisor dispatch.
              </div>
            )}
          </div>

          {/* Today's Schedule Timeline */}
          <div className="rounded-2xl border border-[#EEEEF2] bg-white p-5 shadow-soft-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#EEEEF2] pb-3">
              <h2 className="text-sm font-bold text-[#1F1F1F] uppercase tracking-wider flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#5B21B6]" />
                Today's Operational Schedule
              </h2>
              <span className="text-xs font-mono text-[#6B6B6B]">4 Slots Monitored</span>
            </div>

            <div className="space-y-3">
              {scheduleSlots.map((slot, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-3.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-[#6B6B6B] w-20">
                      {slot.time}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-[#1F1F1F]">{slot.label}</div>
                      <div className="text-[11px] text-[#6B6B6B]">{slot.details}</div>
                    </div>
                  </div>
                  <StatusBadge status={slot.status} size="sm" />
                </div>
              ))}
            </div>
          </div>

          {/* Compliance Checklist */}
          <div className="rounded-2xl border border-[#EEEEF2] bg-white p-5 shadow-soft-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#EEEEF2] pb-3">
              <h2 className="text-sm font-bold text-[#1F1F1F] uppercase tracking-wider flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-[#5B21B6]" />
                Compliance & Verification Checklist
              </h2>
              <StatusBadge status={worker.complianceStatus} size="sm" />
            </div>

            {workerDocs.length === 0 ? (
              <div className="text-xs text-[#6B6B6B]">Standard background check records on file.</div>
            ) : (
              <div className="divide-y divide-[#EEEEF2] text-xs">
                {workerDocs.map((doc) => (
                  <div key={doc.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[#1F1F1F]">{doc.type}</div>
                      <div className="text-[11px] font-mono text-[#6B6B6B]">
                        {doc.documentNumber} • Exp: {doc.expiryDate}
                      </div>
                    </div>
                    <StatusBadge status={doc.status} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Personal Info, Performance, Financials */}
        <div className="space-y-6">
          {/* Personal Information */}
          <div className="rounded-2xl border border-[#EEEEF2] bg-white p-5 shadow-soft-sm space-y-3 text-xs">
            <h3 className="text-sm font-bold text-[#1F1F1F] uppercase tracking-wider border-b border-[#EEEEF2] pb-3">
              Expert Information
            </h3>

            <div className="space-y-2.5">
              <div>
                <span className="text-[#6B6B6B] font-mono text-[10px]">PHONE</span>
                <div className="font-mono text-[#1F1F1F] mt-0.5">{worker.phone}</div>
              </div>
              <div>
                <span className="text-[#6B6B6B] font-mono text-[10px]">EMAIL</span>
                <div className="text-[#1F1F1F] mt-0.5">{worker.email}</div>
              </div>
              <div>
                <span className="text-[#6B6B6B] font-mono text-[10px]">BASE NANO-MARKET</span>
                <div className="font-mono text-[#5B21B6] font-semibold mt-0.5">{worker.areaId}</div>
              </div>
              <div>
                <span className="text-[#6B6B6B] font-mono text-[10px]">LAST GPS LOCATION</span>
                <div className="font-mono text-[#1F1F1F] mt-0.5">
                  {worker.lat.toFixed(4)}, {worker.lng.toFixed(4)} ({worker.lastGpsUpdate})
                </div>
              </div>
            </div>
          </div>

          {/* Performance Telemetry */}
          <div className="rounded-2xl border border-[#EEEEF2] bg-white p-5 shadow-soft-sm space-y-4">
            <h3 className="text-sm font-bold text-[#1F1F1F] uppercase tracking-wider border-b border-[#EEEEF2] pb-3">
              Performance Metrics
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-[#FAF9FC] border border-[#EEEEF2] p-3">
                <span className="text-[10px] text-[#6B6B6B] font-mono uppercase">Completion Rate</span>
                <div className="text-lg font-bold font-mono text-emerald-700 mt-1">
                  {worker.completionRate}%
                </div>
              </div>
              <div className="rounded-xl bg-[#FAF9FC] border border-[#EEEEF2] p-3">
                <span className="text-[10px] text-[#6B6B6B] font-mono uppercase">Cancellation Rate</span>
                <div className="text-lg font-bold font-mono text-[#1F1F1F] mt-1">
                  {worker.cancellationRate}%
                </div>
              </div>
              <div className="rounded-xl bg-[#FAF9FC] border border-[#EEEEF2] p-3">
                <span className="text-[10px] text-[#6B6B6B] font-mono uppercase">Avg Response Time</span>
                <div className="text-lg font-bold font-mono text-[#1F1F1F] mt-1">
                  {worker.avgResponseTimeSec}s
                </div>
              </div>
              <div className="rounded-xl bg-[#FAF9FC] border border-[#EEEEF2] p-3">
                <span className="text-[10px] text-[#6B6B6B] font-mono uppercase">Customer Rating</span>
                <div className="text-lg font-bold font-mono text-amber-600 mt-1 flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-500 text-amber-500" /> {worker.rating}
                </div>
              </div>
            </div>
          </div>

          {/* Financials & Payouts */}
          <div className="rounded-2xl border border-[#EEEEF2] bg-white p-5 shadow-soft-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#EEEEF2] pb-3">
              <h3 className="text-sm font-bold text-[#1F1F1F] uppercase tracking-wider">Earnings Summary</h3>
              <button
                onClick={() => navigate('/payouts')}
                className="text-xs text-[#5B21B6] hover:underline font-semibold"
              >
                Payouts Console →
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1">
                <span className="text-[#6B6B6B]">Today's Net Earnings:</span>
                <span className="font-mono font-bold text-emerald-700">₹{worker.todayEarnings}</span>
              </div>
              <div className="flex justify-between py-1 border-t border-[#EEEEF2]">
                <span className="text-[#6B6B6B]">Weekly Total:</span>
                <span className="font-mono font-bold text-[#1F1F1F]">₹{worker.weeklyEarnings}</span>
              </div>
              {workerPayout && (
                <div className="flex justify-between py-1 border-t border-[#EEEEF2] text-[11px]">
                  <span className="text-[#6B6B6B]">Today's Settlement Status:</span>
                  <StatusBadge status={workerPayout.status} size="sm" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showStatusConfirm}
        onClose={() => setShowStatusConfirm(false)}
        onConfirm={handleConfirmStatusChange}
        title="Confirm Status Modification"
        message={`Are you sure you want to update ${worker.name}'s operational status to ${targetStatus}?`}
        variant="warning"
        requireReason={true}
        reasonOptions={['Shift Break', 'Shift Ended', 'Maintenance', 'Supervisor Override']}
      />
    </div>
  );
};
