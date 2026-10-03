import React from 'react';
import clsx from 'clsx';
import { WorkerStatus, BookingStatus, MarketStatus, ComplianceOverallStatus, DocStatus, PayoutStatus } from '../../types';

interface StatusBadgeProps {
  status: WorkerStatus | BookingStatus | MarketStatus | ComplianceOverallStatus | DocStatus | PayoutStatus | string;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm', pulse = false }) => {
  const getBadgeStyle = () => {
    switch (status) {
      // Active / Available / Completed / Verified / Resolved (Soft Green - Active / Enabled State)
      case 'Active':
      case 'active':
      case 'Available':
      case 'Completed':
      case 'completed':
      case 'Resolved':
      case 'resolved':
      case 'Verified':
      case 'Approved':
      case 'Paid':
      case 'Healthy':
        return 'bg-[#ECFDF3] text-[#027A48] border-[#A6F4C5]';

      // Inactive (Soft Purple / Blue - Brand Theme)
      case 'Inactive':
      case 'inactive':
        return 'bg-[#F5F3FF] text-[#6D28D9] border-[#DDD6FE]';

      // Busy / Assigned / Adjusted / Ongoing (Soft Purple - Brand Theme)
      case 'Busy':
      case 'Assigned':
      case 'assigned':
      case 'In Progress':
      case 'in progress':
      case 'Ongoing':
      case 'ongoing':
      case 'Adjusted':
      case 'Normal':
        return 'bg-[#F3E8FF] text-[#6B21A8] border-[#E9D5FF]';

      // Traveling / Pending / Under Review / Tight / Open (Soft Orange / Amber)
      case 'Traveling':
      case 'Pending':
      case 'pending':
      case 'Open':
      case 'open':
      case 'Under Review':
      case 'Queued':
      case 'Tight':
        return 'bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]';

      // Suspended / SLA Risk / Expired / Rejected / Critical (Soft Red - Blocked / Suspended State)
      case 'Suspended':
      case 'suspended':
      case 'SLA Risk':
      case 'Critical':
      case 'Expired':
      case 'Rejected':
        return 'bg-[#FEF2F2] text-[#B42318] border-[#FECDCA]';

      // New / Searching / Booked (Soft Cyan / Indigo)
      case 'New':
      case 'Searching':
      case 'Booked':
      case 'booked':
        return 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]';

      // Offline / Cancelled / Draft / Standby / Closed (Soft Gray)
      case 'Offline':
      case 'Cancelled':
      case 'cancelled':
      case 'Closed':
      case 'closed':
      case 'Unavailable':
      case 'Draft':
      case 'Calculated':
      case 'GPS Stale':
        if (status === 'GPS Stale') return 'bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]';
        return 'bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]';

      default:
        return 'bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]';
    }
  };

  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-[11px] font-medium',
    md: 'px-3 py-1 text-xs font-semibold',
    lg: 'px-3.5 py-1.5 text-xs font-semibold',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border transition-all select-none',
        getBadgeStyle(),
        sizeClasses[size]
      )}
    >
      <span className={clsx('h-1.5 w-1.5 rounded-full bg-current', pulse && 'animate-ping')} />
      {status}
    </span>
  );
};
