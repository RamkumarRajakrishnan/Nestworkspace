import React from 'react';
import { Drawer } from '../common/Drawer';
import { StatusBadge } from '../common/StatusBadge';
import { RawWorkerAttendanceRecord } from '../../types';
import { 
  User, 
  Calendar, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  ShieldAlert, 
  Coffee, 
  Smartphone, 
  Activity, 
  Image as ImageIcon,
  Compass,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

const safeVal = (v: any): string => {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'string') {
    const trimmed = v.trim();
    return trimmed && trimmed !== 'null' && trimmed !== 'undefined' ? trimmed : '—';
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
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return '—';
  try {
    const parts = trimmed.split('-');
    if (parts.length === 3) {
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

interface AttendanceDetailDrawerProps {
  record: RawWorkerAttendanceRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AttendanceDetailDrawer: React.FC<AttendanceDetailDrawerProps> = ({
  record,
  isOpen,
  onClose,
}) => {
  if (!record) return null;

  const workerName = safeVal(record.workerName);
  const workerId = safeVal(record.workerId);
  const areaName = safeVal(record.areaName);
  const formattedDate = formatDisplayDate(record.date);
  const status = safeVal(record.attendanceStatus) !== '—' ? record.attendanceStatus : 'Checked-In';
  const isVerified = record.CheckinVerified === true;

  const hasCheckInCoords = Boolean(
    record.checkInLatitude !== null &&
    record.checkInLatitude !== undefined &&
    record.checkInLongitude !== null &&
    record.checkInLongitude !== undefined &&
    !isNaN(Number(record.checkInLatitude)) &&
    !isNaN(Number(record.checkInLongitude)) &&
    Number(record.checkInLatitude) !== 0 &&
    Number(record.checkInLongitude) !== 0
  );

  const hasCheckOutCoords = Boolean(
    record.checkOutLatitude !== null &&
    record.checkOutLatitude !== undefined &&
    record.checkOutLongitude !== null &&
    record.checkOutLongitude !== undefined &&
    !isNaN(Number(record.checkOutLatitude)) &&
    !isNaN(Number(record.checkOutLongitude)) &&
    Number(record.checkOutLatitude) !== 0 &&
    Number(record.checkOutLongitude) !== 0
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={workerName !== '—' ? workerName : 'Attendance Details'}
      subtitle={`Worker ID: ${workerId} • ${areaName} • ${formattedDate}`}
      width="lg"
      lockBackgroundScroll={true}
    >
      <div className="space-y-4 w-full max-w-full overflow-hidden">
        {/* Top Header Card: Worker Overview */}
        <div className="flex items-center gap-3.5 sm:gap-4 rounded-2xl border border-[#EEEEF2] bg-[#FAF9FC] p-4 sm:p-4.5 w-full overflow-hidden">
          <div className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-2xl overflow-hidden border-2 border-white shadow-soft-sm bg-[#EDE9FE] flex items-center justify-center relative">
            {record.checkInPhoto ? (
              <img
                src={record.checkInPhoto}
                alt={workerName}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <span className="font-bold text-xl text-[#5B21B6] select-none">
                {workerName !== '—' ? workerName.charAt(0).toUpperCase() : <User className="h-7 w-7 text-[#5B21B6]" />}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-[#1F1F1F] truncate max-w-[200px] sm:max-w-[260px]" title={workerName}>
                {workerName}
              </h3>
              <StatusBadge status={status} size="sm" pulse={status === 'Checked-In'} />
            </div>
            <div className="mt-1 flex items-center gap-2.5 text-xs text-[#6B6B6B] flex-wrap">
              <span className="font-mono text-[11px] font-semibold text-[#5B21B6]">
                ID: {workerId}
              </span>
              <span className="flex items-center gap-1 font-mono text-[11px] text-[#6B6B6B]">
                <Calendar className="h-3.5 w-3.5 text-[#6B6B6B] shrink-0" />
                {formattedDate}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-white border border-[#EEEEF2] px-2.5 py-0.5 text-[10px] text-[#5B21B6] font-semibold truncate max-w-[180px]">
                <MapPin className="h-3 w-3 text-[#5B21B6] shrink-0" />
                <span className="truncate">{areaName}</span>
              </span>
              {isVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF3] border border-[#A6F4C5] px-2.5 py-0.5 text-[10px] text-[#027A48] font-bold">
                  <ShieldCheck className="h-3 w-3 text-[#027A48] shrink-0" />
                  <span>Check-In Verified</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#F3F4F6] border border-[#E5E7EB] px-2.5 py-0.5 text-[10px] text-[#6B6B6B] font-medium">
                  <ShieldAlert className="h-3 w-3 text-[#6B6B6B] shrink-0" />
                  <span>Check-In Unverified</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 1. Employee Information Section */}
        <div className="rounded-2xl border border-[#EEEEF2] bg-white p-4 space-y-3 shadow-soft-sm w-full overflow-hidden">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B] flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-[#5B21B6] shrink-0" />
            Employee Information
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
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
              <span className="text-[10px] text-[#6B6B6B] font-mono">ASSIGNED AREA</span>
              <div className="font-mono text-[#1F1F1F] font-semibold mt-0.5 truncate">{areaName}</div>
            </div>
            <div className="rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2] min-w-0">
              <span className="text-[10px] text-[#6B6B6B] font-mono">RECORD DATE</span>
              <div className="font-mono text-[#1F1F1F] font-semibold mt-0.5 truncate">{formattedDate}</div>
            </div>
          </div>
        </div>

        {/* 2. Attendance Information Section */}
        <div className="rounded-2xl border border-[#EEEEF2] bg-white p-4 space-y-3 shadow-soft-sm w-full overflow-hidden">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B] flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-[#5B21B6] shrink-0" />
            Attendance Metrics
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2] min-w-0">
              <span className="text-[10px] text-[#6B6B6B] font-mono">ATTENDANCE STATUS</span>
              <div className="mt-1">
                <StatusBadge status={status} size="sm" pulse={status === 'Checked-In'} />
              </div>
            </div>
            <div className="rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2] min-w-0">
              <span className="text-[10px] text-[#6B6B6B] font-mono">TOTAL WORKED HOURS</span>
              <div className="font-mono text-[#027A48] font-bold mt-0.5 truncate text-sm">
                {safeVal(record.totalWorkedHours)}
              </div>
            </div>
            <div className="rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2] min-w-0">
              <span className="text-[10px] text-[#6B6B6B] font-mono">CHECK-IN TIME</span>
              <div className="font-mono text-[#1F1F1F] font-semibold mt-0.5 truncate">
                {safeVal(record.checkInTime)}
              </div>
            </div>
            <div className="rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2] min-w-0">
              <span className="text-[10px] text-[#6B6B6B] font-mono">CHECK-OUT TIME</span>
              <div className="font-mono text-[#1F1F1F] font-semibold mt-0.5 truncate">
                {safeVal(record.checkOutTime)}
              </div>
            </div>
            <div className="rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2] min-w-0">
              <span className="text-[10px] text-[#6B6B6B] font-mono">BREAK START</span>
              <div className="font-mono text-[#1F1F1F] font-semibold mt-0.5 truncate">
                {safeVal(record.breakStartTime)}
              </div>
            </div>
            <div className="rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2] min-w-0">
              <span className="text-[10px] text-[#6B6B6B] font-mono">BREAK END</span>
              <div className="font-mono text-[#1F1F1F] font-semibold mt-0.5 truncate">
                {safeVal(record.breakEndTime)}
              </div>
            </div>
            <div className="sm:col-span-2 rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2] min-w-0 flex items-center justify-between">
              <span className="text-[10px] text-[#6B6B6B] font-mono">CHECK-IN VERIFIED</span>
              {isVerified ? (
                <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[#027A48] bg-[#ECFDF3] px-2 py-0.5 rounded-md border border-[#A6F4C5]/60">
                  <ShieldCheck className="h-3 w-3 text-[#027A48] shrink-0" />
                  <span>Verified</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[#6B6B6B] bg-[#F3F4F6] px-2 py-0.5 rounded-md border border-[#E5E7EB]">
                  <span>Unverified</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3. Location Telemetry Section */}
        <div className="rounded-2xl border border-[#EEEEF2] bg-white p-4 space-y-3 shadow-soft-sm w-full overflow-hidden">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B] flex items-center gap-1.5">
            <Compass className="h-3.5 w-3.5 text-[#5B21B6] shrink-0" />
            Location Telemetry
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {/* Check-In Location */}
            <div className="rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2] min-w-0 space-y-1">
              <span className="text-[10px] text-[#6B6B6B] font-mono">CHECK-IN LOCATION</span>
              <div className="font-semibold text-[#1F1F1F] truncate" title={safeVal(record.checkInLocation)}>
                {safeVal(record.checkInLocation)}
              </div>
              <div className="font-mono text-[10px] text-[#6B6B6B] truncate">
                {hasCheckInCoords
                  ? `${Number(record.checkInLatitude).toFixed(5)}° N, ${Number(record.checkInLongitude).toFixed(5)}° E`
                  : 'Coordinates: —'}
              </div>
            </div>

            {/* Check-Out Location */}
            <div className="rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2] min-w-0 space-y-1">
              <span className="text-[10px] text-[#6B6B6B] font-mono">CHECK-OUT LOCATION</span>
              <div className="font-semibold text-[#1F1F1F] truncate" title={safeVal(record.checkOutLocation)}>
                {safeVal(record.checkOutLocation)}
              </div>
              <div className="font-mono text-[10px] text-[#6B6B6B] truncate">
                {hasCheckOutCoords
                  ? `${Number(record.checkOutLatitude).toFixed(5)}° N, ${Number(record.checkOutLongitude).toFixed(5)}° E`
                  : 'Coordinates: —'}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Photos Section */}
        <div className="rounded-2xl border border-[#EEEEF2] bg-white p-4 space-y-3 shadow-soft-sm w-full overflow-hidden">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B] flex items-center gap-1.5">
            <ImageIcon className="h-3.5 w-3.5 text-[#5B21B6] shrink-0" />
            Attendance Photos
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Check-In Photo */}
            <div className="rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-3 space-y-2 flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#1F1F1F] flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#027A48]" />
                  Check-In Photo
                </span>
                {record.checkInPhoto && (
                  <a
                    href={record.checkInPhoto}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-semibold text-[#5B21B6] hover:underline flex items-center gap-0.5"
                  >
                    <span>View Full</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>
              <div className="relative w-full aspect-4/3 rounded-lg overflow-hidden border border-[#EEEEF2] bg-white flex items-center justify-center">
                {record.checkInPhoto ? (
                  <img
                    src={record.checkInPhoto}
                    alt="Check-In"
                    className="w-full h-full object-cover transition-transform hover:scale-105 duration-200"
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="text-center p-4 text-[#6B6B6B]">
                    <ImageIcon className="h-8 w-8 mx-auto text-[#D1D5DB] mb-1" />
                    <span className="text-[11px] font-mono">No Check-In Photo</span>
                  </div>
                )}
              </div>
            </div>

            {/* Check-Out Photo */}
            <div className="rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-3 space-y-2 flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#1F1F1F] flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[#4B5563]" />
                  Check-Out Photo
                </span>
                {record.checkOutPhoto && (
                  <a
                    href={record.checkOutPhoto}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-semibold text-[#5B21B6] hover:underline flex items-center gap-0.5"
                  >
                    <span>View Full</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>
              <div className="relative w-full aspect-4/3 rounded-lg overflow-hidden border border-[#EEEEF2] bg-white flex items-center justify-center">
                {record.checkOutPhoto ? (
                  <img
                    src={record.checkOutPhoto}
                    alt="Check-Out"
                    className="w-full h-full object-cover transition-transform hover:scale-105 duration-200"
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="text-center p-4 text-[#6B6B6B]">
                    <ImageIcon className="h-8 w-8 mx-auto text-[#D1D5DB] mb-1" />
                    <span className="text-[11px] font-mono">No Check-Out Photo</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 5. Device & Telemetry Information Section */}
        <div className="rounded-2xl border border-[#EEEEF2] bg-white p-4 space-y-3 shadow-soft-sm w-full overflow-hidden">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B] flex items-center gap-1.5">
            <Smartphone className="h-3.5 w-3.5 text-[#5B21B6] shrink-0" />
            Device & Telemetry Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2] min-w-0">
              <span className="text-[10px] text-[#6B6B6B] font-mono">DEVICE ID</span>
              <div className="font-mono text-[#1F1F1F] font-semibold mt-0.5 truncate" title={safeVal(record.deviceId)}>
                {safeVal(record.deviceId)}
              </div>
            </div>
            <div className="rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2] min-w-0">
              <span className="text-[10px] text-[#6B6B6B] font-mono">LAST HEARTBEAT</span>
              <div className="font-mono text-[#1F1F1F] font-semibold mt-0.5 truncate">
                {safeVal(record.lastHearbeat)}
              </div>
            </div>
            <div className="rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2] min-w-0">
              <span className="text-[10px] text-[#6B6B6B] font-mono">CHECKOUT BY</span>
              <div className="font-mono text-[#1F1F1F] font-semibold mt-0.5 truncate">
                {safeVal(record.checkoutby)}
              </div>
            </div>
            <div className="rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2] min-w-0">
              <span className="text-[10px] text-[#6B6B6B] font-mono">WORKED MINUTES</span>
              <div className="font-mono text-[#1F1F1F] font-semibold mt-0.5 truncate">
                {record.totalWorkedMinutes !== null && record.totalWorkedMinutes !== undefined ? `${record.totalWorkedMinutes} mins` : '—'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
};
