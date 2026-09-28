import React, { useState } from 'react';
import { Drawer } from '../common/Drawer';
import { Worker } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { useOperations } from '../../context/OperationsContext';
import { useNavigate } from 'react-router-dom';
import { 
  Star, 
  MapPin, 
  Clock, 
  Phone, 
  Mail, 
  Briefcase, 
  Radio, 
  Power,
  ArrowRight
} from 'lucide-react';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface WorkerDetailDrawerProps {
  worker: Worker | null;
  isOpen: boolean;
  onClose: () => void;
  onAssignClick?: (worker: Worker) => void;
}

export const WorkerDetailDrawer: React.FC<WorkerDetailDrawerProps> = ({
  worker,
  isOpen,
  onClose,
  onAssignClick,
}) => {
  const navigate = useNavigate();
  const { updateWorkerStatus } = useOperations();
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [targetStatus, setTargetStatus] = useState<any>(null);

  if (!worker) return null;

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
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title={worker.name}
        subtitle={`${worker.id} • Zone: ${worker.areaId}`}
        width="lg"
        actions={
          <button
            onClick={() => {
              navigate(`/workers/${worker.id}`);
              onClose();
            }}
            className="flex items-center gap-1.5 rounded-xl border border-[#EEEEF2] bg-white px-3 py-1.5 text-xs font-semibold text-[#5B21B6] hover:bg-[#F5F3FF] transition-colors shadow-soft-sm active:scale-95"
            title="Open Full Expert Profile Page"
          >
            <span>Full Profile</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        }
      >
        <div className="space-y-5">
          {/* Header Card */}
          <div className="flex items-center gap-4 rounded-2xl border border-[#EEEEF2] bg-[#FAF9FC] p-4.5">
            <img
              src={worker.avatar}
              alt={worker.name}
              className="h-16 w-16 rounded-2xl object-cover border-2 border-white shadow-soft-sm"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#1F1F1F]">{worker.name}</h3>
                <StatusBadge status={worker.status} size="sm" pulse={worker.status === 'Available'} />
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs text-[#6B6B6B]">
                <span className="flex items-center gap-1 text-[#B45309] font-bold">
                  <Star className="h-3.5 w-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                  {worker.rating} ({worker.ratingCount} reviews)
                </span>
                <span>Joined {worker.joinedDate}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {worker.skills.map((s, idx) => (
                  <span key={idx} className="rounded-full bg-white border border-[#EEEEF2] px-2 py-0.5 text-[10px] text-[#5B21B6] font-semibold">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Dispatch / Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            {worker.status === 'Available' ? (
              <button
                onClick={() => onAssignClick && onAssignClick(worker)}
                className="rounded-xl bg-[#5B21B6] px-4 py-2.5 text-xs font-bold text-white shadow-soft-sm hover:bg-[#4C1D95] transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Briefcase className="h-3.5 w-3.5" />
                Assign Immediate Job
              </button>
            ) : (
              <button
                onClick={() => handleStatusChangeRequest('Available')}
                className="rounded-xl border border-[#A6F4C5] bg-[#ECFDF3] px-4 py-2.5 text-xs font-bold text-[#027A48] hover:bg-[#D1FADF] transition-all flex items-center justify-center gap-1.5"
              >
                <Power className="h-3.5 w-3.5" />
                Mark Available
              </button>
            )}

            <button
              onClick={() => handleStatusChangeRequest(worker.status === 'Unavailable' ? 'Available' : 'Unavailable')}
              className="rounded-xl border border-[#EEEEF2] bg-white px-4 py-2.5 text-xs font-semibold text-[#6B6B6B] hover:bg-[#FAF9FC] transition-all shadow-soft-sm"
            >
              {worker.status === 'Unavailable' ? 'Clear Unavailable' : 'Mark Unavailable'}
            </button>
          </div>

          {/* Live Telemetry & GPS Stats */}
          <div className="rounded-2xl border border-[#EEEEF2] bg-white p-4.5 space-y-3 shadow-soft-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B] flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 text-[#5B21B6]" />
              Live Telemetry & GPS Coordinates
            </h4>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2]">
                <span className="text-[10px] text-[#6B6B6B] font-mono">LATITUDE / LONGITUDE</span>
                <div className="font-mono text-[#1F1F1F] font-semibold mt-0.5">
                  {worker.lat.toFixed(4)}° N, {worker.lng.toFixed(4)}° E
                </div>
              </div>
              <div className="rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2]">
                <span className="text-[10px] text-[#6B6B6B] font-mono">LAST LOCATION UPDATE</span>
                <div className="font-mono text-[#5B21B6] font-bold mt-0.5">{worker.lastGpsUpdate}</div>
              </div>
              <div className="rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2]">
                <span className="text-[10px] text-[#6B6B6B] font-mono">GPS ACCURACY</span>
                <div className="font-mono text-[#1F1F1F] font-semibold mt-0.5">±{worker.gpsAccuracyMeters} meters</div>
              </div>
              <div className="rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2]">
                <span className="text-[10px] text-[#6B6B6B] font-mono">CURRENT ASSIGNMENT</span>
                <div className="font-mono text-[#7C3AED] font-bold mt-0.5">{worker.currentJobId || 'None (Idle)'}</div>
              </div>
            </div>
          </div>

          {/* Today's Performance & Financials */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-2xl border border-[#EEEEF2] bg-white p-3.5 text-center shadow-soft-sm">
              <div className="text-[10px] text-[#6B6B6B] uppercase font-mono font-medium">Today's Jobs</div>
              <div className="text-lg font-bold font-mono text-[#1F1F1F] mt-1">{worker.todayJobs}</div>
            </div>
            <div className="rounded-2xl border border-[#EEEEF2] bg-white p-3.5 text-center shadow-soft-sm">
              <div className="text-[10px] text-[#6B6B6B] uppercase font-mono font-medium">Earnings Today</div>
              <div className="text-lg font-bold font-mono text-[#5B21B6] mt-1">₹{worker.todayEarnings}</div>
            </div>
            <div className="rounded-2xl border border-[#EEEEF2] bg-white p-3.5 text-center shadow-soft-sm">
              <div className="text-[10px] text-[#6B6B6B] uppercase font-mono font-medium">Compliance</div>
              <div className="mt-1">
                <StatusBadge status={worker.complianceStatus} size="sm" />
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="rounded-2xl border border-[#EEEEF2] bg-[#FAF9FC] p-4.5 space-y-2 text-xs">
            <h4 className="font-bold text-[#1F1F1F]">Direct Contact Information</h4>
            <div className="flex items-center gap-2 text-[#6B6B6B]">
              <Phone className="h-3.5 w-3.5 text-[#5B21B6]" />
              <span className="font-mono text-[#1F1F1F] font-medium">{worker.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-[#6B6B6B]">
              <Mail className="h-3.5 w-3.5 text-[#5B21B6]" />
              <span className="text-[#1F1F1F]">{worker.email}</span>
            </div>
          </div>
        </div>
      </Drawer>

      <ConfirmDialog
        isOpen={showStatusConfirm}
        onClose={() => setShowStatusConfirm(false)}
        onConfirm={handleConfirmStatusChange}
        title="Update Expert Status"
        message={`Are you sure you want to change ${worker.name}'s status to ${targetStatus}?`}
        variant="warning"
        requireReason={true}
        reasonOptions={['Shift Ended', 'Break / Meal', 'Vehicle Maintenance', 'Admin Override']}
      />
    </>
  );
};
