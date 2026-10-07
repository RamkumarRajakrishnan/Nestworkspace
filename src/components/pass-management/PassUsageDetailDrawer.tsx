import React from 'react';
import { Drawer } from '../common/Drawer';
import { StatusBadge } from '../common/StatusBadge';
import { RawUserNestPassRecord } from '../../types';
import {
  Ticket,
  User,
  Calendar,
  Clock,
  CreditCard,
  Hash,
  Activity,
  Layers,
  CheckCircle2,
  Wallet,
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

const formatCurrency = (val: number | string | null | undefined): string => {
  if (val === null || val === undefined) return '—';
  const num = Number(val);
  if (isNaN(num)) return '—';
  return `₹${num.toLocaleString('en-IN')}`;
};

interface PassUsageDetailDrawerProps {
  record: RawUserNestPassRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PassUsageDetailDrawer: React.FC<PassUsageDetailDrawerProps> = ({
  record,
  isOpen,
  onClose,
}) => {
  if (!record) return null;

  const userId = safeVal(record.userId);
  const packId = safeVal(record.packId);
  const bookingId = safeVal(record.bookingId);
  const status = safeVal(record.status) !== '—' ? record.status : 'Active';
  const expiryDate = formatDisplayDate(record.expiryDate);
  const totalVisits = Number(record.totalvisit) || 0;
  const completedVisits = Number(record.completedVisits) || 0;
  const remainingVisits = Number(record.remainingVisits) || 0;
  const duration = safeVal(record.duration);
  const paidAmount = formatCurrency(record.paidAmount);
  const walletUsage = formatCurrency(record.walletuseage);
  const razorpayId = safeVal(record.razorpayorderid);

  // Calculation for progress percentage
  const usagePercent = totalVisits > 0 ? Math.min(100, Math.round((completedVisits / totalVisits) * 100)) : 0;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={packId !== '—' ? `Pass: ${packId}` : 'Pass Usage Details'}
      subtitle={`User: ${userId} • ${bookingId}`}
      width="lg"
      lockBackgroundScroll={true}
    >
      <div className="space-y-4 w-full max-w-full overflow-hidden">
        {/* Top Header Card */}
        <div className="flex items-center gap-3.5 sm:gap-4 rounded-2xl border border-[#EEEEF2] bg-[#FAF9FC] p-4 sm:p-4.5 w-full overflow-hidden">
          <div className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-2xl overflow-hidden border-2 border-white shadow-soft-sm bg-[#EDE9FE] flex items-center justify-center relative">
            <Ticket className="h-7 w-7 text-[#5B21B6]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-[#1F1F1F] truncate max-w-[200px] sm:max-w-[260px]" title={packId}>
                Package {packId}
              </h3>
              <StatusBadge status={status} size="sm" pulse={status === 'Active'} />
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-[#6B6B6B] flex-wrap">
              <span className="font-mono text-[11px] font-semibold text-[#5B21B6] truncate max-w-[240px]">
                {userId}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-white border border-[#EEEEF2] px-2.5 py-0.5 text-[10px] text-[#5B21B6] font-semibold truncate max-w-[220px]">
                <Hash className="h-3 w-3 text-[#5B21B6] shrink-0" />
                <span className="truncate">{bookingId}</span>
              </span>
            </div>
          </div>
        </div>

        {/* 1. Customer & Pass Information */}
        <div className="rounded-2xl border border-[#EEEEF2] bg-white p-4 space-y-3 shadow-soft-sm w-full overflow-hidden">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B] flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-[#5B21B6] shrink-0" />
            Customer & Pass Information
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2] min-w-0">
              <span className="text-[10px] text-[#6B6B6B] font-mono">USER ID / EMAIL</span>
              <div className="font-semibold text-[#1F1F1F] mt-0.5 truncate" title={userId}>
                {userId}
              </div>
            </div>
            <div className="rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2] min-w-0">
              <span className="text-[10px] text-[#6B6B6B] font-mono">PASS PACKAGE ID</span>
              <div className="font-mono text-[#5B21B6] font-bold mt-0.5 truncate">{packId}</div>
            </div>
            <div className="rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2] min-w-0">
              <span className="text-[10px] text-[#6B6B6B] font-mono">STATUS</span>
              <div className="mt-1">
                <StatusBadge status={status} size="sm" pulse={status === 'Active'} />
              </div>
            </div>
            <div className="rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2] min-w-0">
              <span className="text-[10px] text-[#6B6B6B] font-mono">EXPIRY DATE & TIME</span>
              <div className="font-mono text-[#1F1F1F] font-semibold mt-0.5 truncate">{expiryDate}</div>
            </div>
          </div>
        </div>

        {/* 2. Visit & Usage Metrics */}
        <div className="rounded-2xl border border-[#EEEEF2] bg-white p-4 space-y-3 shadow-soft-sm w-full overflow-hidden">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B] flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-[#5B21B6] shrink-0" />
            Visits & Session Metrics
          </h4>

          {/* Progress Bar */}
          <div className="rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] text-[#6B6B6B] font-mono font-semibold uppercase">Visits Consumed</span>
              <span className="font-bold text-[#5B21B6] font-mono">{completedVisits} of {totalVisits} visits ({usagePercent}%)</span>
            </div>
            <div className="h-2 w-full rounded-full bg-[#E5E7EB] overflow-hidden">
              <div
                className="h-full bg-[#5B21B6] rounded-full transition-all duration-300"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2] min-w-0 text-center">
              <span className="text-[10px] text-[#6B6B6B] font-mono block">TOTAL</span>
              <div className="font-mono text-base font-bold text-[#1F1F1F] mt-0.5">{totalVisits}</div>
              <span className="text-[10px] text-[#8C8C8C]">Visits</span>
            </div>
            <div className="rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2] min-w-0 text-center">
              <span className="text-[10px] text-[#6B6B6B] font-mono block">COMPLETED</span>
              <div className="font-mono text-base font-bold text-[#027A48] mt-0.5">{completedVisits}</div>
              <span className="text-[10px] text-[#8C8C8C]">Used</span>
            </div>
            <div className="rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2] min-w-0 text-center">
              <span className="text-[10px] text-[#6B6B6B] font-mono block">REMAINING</span>
              <div className="font-mono text-base font-bold text-[#5B21B6] mt-0.5">{remainingVisits}</div>
              <span className="text-[10px] text-[#8C8C8C]">Available</span>
            </div>
            <div className="rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2] min-w-0 text-center">
              <span className="text-[10px] text-[#6B6B6B] font-mono block">DURATION</span>
              <div className="font-mono text-base font-bold text-[#1F1F1F] mt-0.5">{duration}</div>
              <span className="text-[10px] text-[#8C8C8C]">Minutes/Visit</span>
            </div>
          </div>
        </div>

        {/* 3. Payment & Transaction Details */}
        <div className="rounded-2xl border border-[#EEEEF2] bg-white p-4 space-y-3 shadow-soft-sm w-full overflow-hidden">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B] flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5 text-[#5B21B6] shrink-0" />
            Payment & Transaction Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2] min-w-0">
              <span className="text-[10px] text-[#6B6B6B] font-mono">PAID AMOUNT</span>
              <div className="font-mono text-sm font-bold text-[#027A48] mt-0.5">{paidAmount}</div>
            </div>
            <div className="rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2] min-w-0">
              <span className="text-[10px] text-[#6B6B6B] font-mono">WALLET USAGE</span>
              <div className="font-mono text-sm font-semibold text-[#1F1F1F] mt-0.5">{walletUsage}</div>
            </div>
            <div className="rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2] min-w-0 sm:col-span-2">
              <span className="text-[10px] text-[#6B6B6B] font-mono">BOOKING REFERENCE ID</span>
              <div className="font-mono text-[#5B21B6] font-semibold mt-0.5 truncate select-all">{bookingId}</div>
            </div>
            <div className="rounded-xl bg-[#FAF9FC] p-3 border border-[#EEEEF2] min-w-0 sm:col-span-2">
              <span className="text-[10px] text-[#6B6B6B] font-mono">RAZORPAY ORDER / PAYMENT ID</span>
              <div className="font-mono text-[#1F1F1F] font-semibold mt-0.5 truncate select-all">{razorpayId}</div>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
};
