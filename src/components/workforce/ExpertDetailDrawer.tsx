import React, { useState, useEffect } from 'react';
import { Drawer } from '../common/Drawer';
import { StatusBadge } from '../common/StatusBadge';
import { getNestWorkerById, formatImageUrl, RawApiExpertDetail } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Phone, 
  Radio, 
  CreditCard, 
  ShieldCheck, 
  Calendar, 
  Loader2, 
  User,
  Pencil,
  ArrowRight
} from 'lucide-react';

const safeVal = (v: any): string => {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'object') return '—';
  const str = String(v).trim();
  return str && str !== 'null' && str !== 'undefined' ? str : '—';
};

interface ExpertDetailDrawerProps {
  expert: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ExpertDetailDrawer: React.FC<ExpertDetailDrawerProps> = ({
  expert,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const [detailData, setDetailData] = useState<RawApiExpertDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && expert?.tableId) {
      setIsLoading(true);
      getNestWorkerById(expert.tableId).then((res) => {
        setIsLoading(false);
        if (res.success && res.data) {
          setDetailData(res.data);
        }
      });
    } else {
      setDetailData(null);
    }
  }, [isOpen, expert?.tableId]);

  if (!expert) return null;

  // Merge row summary data with fetched detailed data
  const data = detailData || expert;
  const fullName = safeVal(data.fullName || expert.fullName || expert.name);
  const workerId = safeVal(data.workerId || expert.workerId || expert.id);
  const areaName = safeVal(data.areaName || expert.areaName || expert.areaId);
  const mobileNumber = safeVal(data.mobileNumber || expert.mobileNumber || expert.phone);
  const rawStatus = data.joiningStatus || expert.joiningStatus || 'Active';
  const joiningStatus = typeof rawStatus === 'string' ? rawStatus.trim() : 'Active';
  const verificationStatus = safeVal(data.verificationStatus || expert.verificationStatus || 'Verified');
  
  const rawImage = data.profileImage || expert.profileImage || expert.avatar || '';
  const avatarUrl = formatImageUrl(rawImage);

  const monthlySalary = data.monthlySalary !== undefined && data.monthlySalary !== null && data.monthlySalary !== '' 
    ? data.monthlySalary 
    : expert.monthlySalary;
  const shiftTimeing = data.shiftTimeing !== undefined && data.shiftTimeing !== null && data.shiftTimeing !== ''
    ? data.shiftTimeing 
    : expert.shiftTimeing;

  const hasCoords = Boolean(
    data.latitude && data.longitude &&
    !isNaN(Number(data.latitude)) && !isNaN(Number(data.longitude)) &&
    Number(data.latitude) !== 0 && Number(data.longitude) !== 0
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={fullName !== '—' ? fullName : 'Expert Profile'}
      subtitle={`Expert ID: ${workerId} • Zone: ${areaName}`}
      width="lg"
      lockBackgroundScroll={true}
      /* Top Edit and View Profile actions removed from header per requirement */
    >
      <div className="space-y-4 w-full max-w-full overflow-hidden">
        {/* Loading Indicator banner if fetching detailed data */}
        {isLoading && (
          <div className="flex items-center gap-2 rounded-xl bg-[#FAF9FC] border border-[#EEEEF2] p-2.5 text-xs text-[#5B21B6]">
            <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
            <span className="font-medium">Fetching complete live profile data...</span>
          </div>
        )}

        {/* Header Profile Card */}
        <div className="flex items-center gap-3.5 sm:gap-4 rounded-2xl border border-[#EEEEF2] bg-[#FAF9FC] p-4 sm:p-4.5 w-full overflow-hidden">
          <div className="h-16 w-16 shrink-0 rounded-2xl overflow-hidden border-2 border-white shadow-soft-sm bg-[#EDE9FE] flex items-center justify-center relative">
            <span className="font-bold text-xl text-[#5B21B6] select-none">
              {fullName !== '—' ? fullName.charAt(0).toUpperCase() : <User className="h-8 w-8 text-[#5B21B6]" />}
            </span>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={fullName}
                className="absolute inset-0 h-full w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : null}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-[#1F1F1F] truncate max-w-[200px] sm:max-w-[260px]" title={fullName}>
                {fullName}
              </h3>
              <StatusBadge status={joiningStatus} size="sm" pulse={joiningStatus === 'Active'} />
            </div>
            <div className="mt-1 flex items-center gap-2.5 text-xs text-[#6B6B6B] flex-wrap">
              <span className="flex items-center gap-1 text-[#027A48] font-bold">
                <ShieldCheck className="h-3.5 w-3.5 text-[#027A48] shrink-0" />
                {verificationStatus}
              </span>
              {data.joinedDate && (
                <span className="flex items-center gap-1 font-mono text-[11px]">
                  <Calendar className="h-3.5 w-3.5 text-[#6B6B6B] shrink-0" />
                  Joined {new Date(data.joinedDate).toLocaleDateString()}
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-white border border-[#EEEEF2] px-2.5 py-0.5 text-[10px] text-[#5B21B6] font-semibold truncate max-w-[180px]">
                <MapPin className="h-3 w-3 text-[#5B21B6] shrink-0" />
                <span className="truncate">{areaName}</span>
              </span>
              {data.gender && (
                <span className="rounded-full bg-white border border-[#EEEEF2] px-2 py-0.5 text-[10px] text-[#6B6B6B] font-semibold">
                  {safeVal(data.gender)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Action Buttons in Middle Part: Edit & Full Profile */}
        <div className="grid grid-cols-2 gap-2.5 w-full">
          <button
            type="button"
            onClick={() => {
              const routeId = expert.tableId || expert.workerId;
              navigate(`/workers/${routeId}?edit=true`, {
                state: { tableId: expert.tableId, edit: true }
              });
              onClose();
            }}
            className="flex items-center justify-center gap-2 rounded-xl border border-[#EEEEF2] bg-white hover:bg-[#FAF9FC] hover:border-[#5B21B6]/30 text-[#1F1F1F] hover:text-[#5B21B6] px-4 py-2.5 text-xs font-bold transition-all shadow-soft-sm active:scale-95 cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5 text-[#5B21B6] shrink-0" />
            <span>Edit</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const routeId = expert.tableId || expert.workerId;
              navigate(`/workers/${routeId}`, {
                state: { tableId: expert.tableId }
              });
              onClose();
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white px-4 py-2.5 text-xs font-bold transition-all shadow-soft-sm hover:shadow-soft-md active:scale-95 cursor-pointer"
          >
            <span>Full Profile</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0" />
          </button>
        </div>

        {/* Location & Shift Details */}
        <div className="rounded-2xl border border-[#EEEEF2] bg-white p-4 space-y-3 shadow-soft-sm w-full overflow-hidden">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B] flex items-center gap-1.5">
            <Radio className="h-3.5 w-3.5 text-[#5B21B6] shrink-0" />
            Location & Operations Telemetry
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2] min-w-0">
              <span className="text-[10px] text-[#6B6B6B] font-mono">LATITUDE / LONGITUDE</span>
              <div className="font-mono text-[#1F1F1F] font-semibold mt-0.5 truncate">
                {hasCoords ? `${Number(data.latitude).toFixed(4)}° N, ${Number(data.longitude).toFixed(4)}° E` : '—'}
              </div>
            </div>
            <div className="rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2] min-w-0">
              <span className="text-[10px] text-[#6B6B6B] font-mono">BASE AREA</span>
              <div className="font-mono text-[#5B21B6] font-bold mt-0.5 truncate">{areaName}</div>
            </div>
            <div className="rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2] min-w-0">
              <span className="text-[10px] text-[#6B6B6B] font-mono">SHIFT TIMING</span>
              <div className="font-mono text-[#1F1F1F] font-semibold mt-0.5 truncate">
                {shiftTimeing !== undefined && shiftTimeing !== null && String(shiftTimeing).trim() ? `${shiftTimeing} hrs` : '—'}
              </div>
            </div>
            <div className="rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2] min-w-0">
              <span className="text-[10px] text-[#6B6B6B] font-mono">REFERRED BY</span>
              <div className="font-mono text-[#7C3AED] font-bold mt-0.5 truncate">{safeVal(data.referredBy)}</div>
            </div>
          </div>
        </div>

        {/* Compensation & Status */}
        <div className="grid grid-cols-3 gap-2 w-full overflow-hidden">
          <div className="rounded-2xl border border-[#EEEEF2] bg-white p-3 text-center shadow-soft-sm min-w-0">
            <div className="text-[10px] text-[#6B6B6B] uppercase font-mono font-medium truncate">Salary</div>
            <div className="text-sm sm:text-base font-bold font-mono text-[#5B21B6] mt-1 truncate">
              {monthlySalary ? `₹${Number(monthlySalary).toLocaleString('en-IN')}` : '—'}
            </div>
          </div>
          <div className="rounded-2xl border border-[#EEEEF2] bg-white p-3 text-center shadow-soft-sm min-w-0">
            <div className="text-[10px] text-[#6B6B6B] uppercase font-mono font-medium truncate">Status</div>
            <div className="mt-1 flex justify-center">
              <StatusBadge status={joiningStatus} size="sm" />
            </div>
          </div>
          <div className="rounded-2xl border border-[#EEEEF2] bg-white p-3 text-center shadow-soft-sm min-w-0">
            <div className="text-[10px] text-[#6B6B6B] uppercase font-mono font-medium truncate">Verification</div>
            <div className="mt-1 flex justify-center">
              <StatusBadge status={verificationStatus} size="sm" />
            </div>
          </div>
        </div>

        {/* Identity & Verification Documents */}
        <div className="rounded-2xl border border-[#EEEEF2] bg-white p-4 space-y-2 text-xs shadow-soft-sm w-full overflow-hidden">
          <h4 className="font-bold text-[#1F1F1F] flex items-center gap-1.5 uppercase text-[11px] tracking-wider text-[#6B6B6B]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#5B21B6] shrink-0" />
            Identity & KYC Information
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
            <div className="min-w-0 rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2]">
              <span className="text-[10px] text-[#6B6B6B]">Aadhaar Number</span>
              <div className="font-mono font-semibold text-[#1F1F1F] mt-0.5 truncate break-all">
                {safeVal(data.aadhaarNumber)}
              </div>
            </div>
            <div className="min-w-0 rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2]">
              <span className="text-[10px] text-[#6B6B6B]">PAN Number</span>
              <div className="font-mono font-semibold text-[#1F1F1F] mt-0.5 truncate break-all">
                {safeVal(data.panNumber)}
              </div>
            </div>
          </div>
        </div>

        {/* Banking Information */}
        <div className="rounded-2xl border border-[#EEEEF2] bg-white p-4 space-y-2 text-xs shadow-soft-sm w-full overflow-hidden">
          <h4 className="font-bold text-[#1F1F1F] flex items-center gap-1.5 uppercase text-[11px] tracking-wider text-[#6B6B6B]">
            <CreditCard className="h-3.5 w-3.5 text-[#5B21B6] shrink-0" />
            Bank Account Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
            <div className="min-w-0">
              <span className="text-[10px] text-[#6B6B6B]">Bank Name</span>
              <div className="font-semibold text-[#1F1F1F] truncate">{safeVal(data.bankName)}</div>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-[#6B6B6B]">Account Number</span>
              <div className="font-mono text-[#1F1F1F] truncate break-all">{safeVal(data.accountNumber)}</div>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-[#6B6B6B]">IFSC Code</span>
              <div className="font-mono text-[#1F1F1F] truncate break-all">{safeVal(data.ifscCode)}</div>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-[#6B6B6B]">Account Holder</span>
              <div className="text-[#1F1F1F] truncate">{safeVal(data.accountHolderName || (fullName !== '—' ? fullName : ''))}</div>
            </div>
          </div>
        </div>

        {/* Direct Contact Information */}
        <div className="rounded-2xl border border-[#EEEEF2] bg-[#FAF9FC] p-4 space-y-2 text-xs w-full overflow-hidden">
          <h4 className="font-bold text-[#1F1F1F]">Direct Contact Information</h4>
          <div className="flex items-center gap-2 text-[#6B6B6B] min-w-0">
            <Phone className="h-3.5 w-3.5 text-[#5B21B6] shrink-0" />
            <span className="font-mono text-[#1F1F1F] font-medium truncate">{mobileNumber}</span>
          </div>
          {data.address && (
            <div className="flex items-start gap-2 text-[#6B6B6B] pt-1 min-w-0">
              <MapPin className="h-3.5 w-3.5 text-[#5B21B6] shrink-0 mt-0.5" />
              <span className="text-[#1F1F1F] break-words">{safeVal(data.address)}</span>
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
};
