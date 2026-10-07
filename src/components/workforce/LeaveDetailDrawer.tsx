import React from 'react';
import { Drawer } from '../common/Drawer';
import { StatusBadge } from '../common/StatusBadge';
import { RawLeaveRecord } from '../../types';
import { 
  User, 
  Calendar, 
  MapPin, 
  Clock, 
  FileText, 
  CheckCircle2, 
  Info,
  CalendarDays,
  FileCheck
} from 'lucide-react';

const safeVal = (v: any): string => {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'string') {
    const trimmed = v.trim();
    return trimmed && trimmed !== 'null' && trimmed !== 'undefined' && trimmed !== 'NaN' ? trimmed : '—';
  }
  if (typeof v === 'number') {
    if (isNaN(v)) return '—';
    return String(v);
  }
  return String(v);
};

const formatDisplayDate = (dateStr: string | null | undefined): string => {
  if (!dateStr || typeof dateStr !== 'string') return '—';
  const trimmed = dateStr.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined' || trimmed === 'NaN') return '—';
  try {
    const parts = trimmed.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      const year = parseInt(parts[0], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, monthIndex, day);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    }
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    return trimmed;
  } catch {
    return trimmed;
  }
};

const formatDisplayDateTime = (dateTimeStr: string | null | undefined): string => {
  if (!dateTimeStr || typeof dateTimeStr !== 'string') return '—';
  const trimmed = dateTimeStr.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined' || trimmed === 'NaN') return '—';
  try {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      const datePart = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const timePart = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
      return `${datePart}, ${timePart}`;
    }
    return trimmed;
  } catch {
    return trimmed;
  }
};

interface LeaveDetailDrawerProps {
  record: RawLeaveRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const LeaveDetailDrawer: React.FC<LeaveDetailDrawerProps> = ({
  record,
  isOpen,
  onClose,
}) => {
  if (!record) return null;

  const workerName = safeVal(record.workerName);
  const workerId = safeVal(record.workerId);
  const areaName = safeVal(record.areaName);
  const formattedLeaveDate = formatDisplayDate(record.leaveDate);
  const leaveType = safeVal(record.leaveType);
  const status = safeVal(record.status) !== '—' ? record.status! : 'Pending';
  const reason = safeVal(record.reason);
  const requestedAt = formatDisplayDateTime(record.requestedAt);
  const approvedAt = formatDisplayDateTime(record.approvedAt);
  const approvedBy = safeVal(record.approvedBy);
  const notes = safeVal(record.notes);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={workerName !== '—' ? workerName : 'Leave Request Details'}
      subtitle={`Worker ID: ${workerId} • ${areaName} • ${formattedLeaveDate}`}
      width="lg"
      lockBackgroundScroll={true}
    >
      <div className="space-y-4 w-full max-w-full overflow-hidden">
        {/* Top Header Card: Leave Overview */}
        <div className="flex items-center gap-3.5 sm:gap-4 rounded-2xl border border-[#EEEEF2] bg-[#FAF9FC] p-4 sm:p-4.5 w-full overflow-hidden">
          <div className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-2xl overflow-hidden border-2 border-white shadow-soft-sm bg-[#EDE9FE] flex items-center justify-center relative">
            <span className="font-bold text-xl text-[#5B21B6] select-none">
              {workerName !== '—' ? workerName.charAt(0).toUpperCase() : <User className="h-7 w-7 text-[#5B21B6]" />}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-[#1F1F1F] truncate max-w-[200px] sm:max-w-[260px]" title={workerName}>
                {workerName}
              </h3>
              <StatusBadge status={status} size="sm" pulse={status === 'Pending'} />
            </div>
            <div className="mt-1 flex items-center gap-2.5 text-xs text-[#6B6B6B] flex-wrap">
              <span className="font-mono text-[11px] font-semibold text-[#5B21B6]">
                ID: {workerId}
              </span>
              <span className="flex items-center gap-1 font-mono text-[11px] text-[#6B6B6B]">
                <Calendar className="h-3.5 w-3.5 text-[#6B6B6B] shrink-0" />
                {formattedLeaveDate}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-white border border-[#EEEEF2] px-2.5 py-0.5 text-[10px] text-[#5B21B6] font-semibold truncate max-w-[180px]">
                <MapPin className="h-3 w-3 text-[#5B21B6] shrink-0" />
                <span className="truncate">{areaName}</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#EDE9FE] border border-[#DDD6FE] px-2.5 py-0.5 text-[10px] text-[#5B21B6] font-semibold">
                <CalendarDays className="h-3 w-3 text-[#5B21B6] shrink-0" />
                <span>{leaveType}</span>
              </span>
            </div>
          </div>
        </div>

        {/* 1. Employee Information Section */}
        <div className="rounded-2xl border border-[#EEEEF2] bg-white p-4 space-y-3 shadow-soft-sm w-full overflow-hidden">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B] flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-[#5B21B6] shrink-0" />
            Employee Information
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2] min-w-0">
              <span className="text-[10px] text-[#6B6B6B] font-mono">EMPLOYEE NAME</span>
              <div className="font-semibold text-[#1F1F1F] mt-0.5 truncate" title={workerName}>
                {workerName}
              </div>
            </div>
            <div className="rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2] min-w-0">
              <span className="text-[10px] text-[#6B6B6B] font-mono">EMPLOYEE ID</span>
              <div className="font-mono text-[#5B21B6] font-bold mt-0.5 truncate">{workerId}</div>
            </div>
            <div className="rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2] min-w-0">
              <span className="text-[10px] text-[#6B6B6B] font-mono">AREA</span>
              <div className="font-mono text-[#1F1F1F] font-semibold mt-0.5 truncate">{areaName}</div>
            </div>
          </div>
        </div>

        {/* 2. Leave Information Section */}
        <div className="rounded-2xl border border-[#EEEEF2] bg-white p-4 space-y-3 shadow-soft-sm w-full overflow-hidden">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B] flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-[#5B21B6] shrink-0" />
            Leave Information
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2] min-w-0">
              <span className="text-[10px] text-[#6B6B6B] font-mono">LEAVE DATE</span>
              <div className="font-mono text-[#1F1F1F] font-semibold mt-0.5 truncate">
                {formattedLeaveDate}
              </div>
            </div>
            <div className="rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2] min-w-0">
              <span className="text-[10px] text-[#6B6B6B] font-mono">LEAVE TYPE</span>
              <div className="font-mono text-[#5B21B6] font-bold mt-0.5 truncate">
                {leaveType}
              </div>
            </div>
            <div className="rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2] min-w-0">
              <span className="text-[10px] text-[#6B6B6B] font-mono">STATUS</span>
              <div className="mt-1">
                <StatusBadge status={status} size="sm" pulse={status === 'Pending'} />
              </div>
            </div>
            <div className="rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2] min-w-0">
              <span className="text-[10px] text-[#6B6B6B] font-mono">REASON</span>
              <div className="text-[#1F1F1F] font-medium mt-0.5 break-words">
                {reason}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Request Information Section */}
        <div className="rounded-2xl border border-[#EEEEF2] bg-white p-4 space-y-3 shadow-soft-sm w-full overflow-hidden">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B] flex items-center gap-1.5">
            <FileCheck className="h-3.5 w-3.5 text-[#5B21B6] shrink-0" />
            Request Information
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2] min-w-0">
              <span className="text-[10px] text-[#6B6B6B] font-mono">REQUESTED AT</span>
              <div className="font-mono text-[#1F1F1F] font-medium mt-0.5 truncate">
                {requestedAt}
              </div>
            </div>
            <div className="rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2] min-w-0">
              <span className="text-[10px] text-[#6B6B6B] font-mono">APPROVED AT</span>
              <div className="font-mono text-[#1F1F1F] font-medium mt-0.5 truncate">
                {approvedAt}
              </div>
            </div>
            <div className="rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2] min-w-0">
              <span className="text-[10px] text-[#6B6B6B] font-mono">APPROVED BY</span>
              <div className="font-mono text-[#5B21B6] font-semibold mt-0.5 truncate">
                {approvedBy}
              </div>
            </div>
            <div className="rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2] min-w-0">
              <span className="text-[10px] text-[#6B6B6B] font-mono">NOTES</span>
              <div className="text-[#1F1F1F] font-medium mt-0.5 break-words">
                {notes}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
};
